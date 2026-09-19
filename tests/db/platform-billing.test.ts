import { describe, expect, it } from "vitest";
import {
  asUser,
  createAdmin,
  createGymOwner,
  createStaff,
  type Db,
  insertClient,
  makePastDue,
  PERMISSION_DENIED,
  run,
  withTx,
} from "./helpers";

async function insertPlatformPlan(db: Db, price = 99000, maxClients: number | null = 300) {
  const { rows } = await db.query<{ id: string }>(
    "insert into public.platform_plans (name, monthly_price, max_clients) values ('Стандарт', $1, $2) returning id",
    [price, maxClients],
  );
  return rows[0].id;
}

async function sqlDate(db: Db, expr: string) {
  const { rows } = await db.query<{ d: string }>(`select (${expr})::date::text as d`);
  return rows[0].d;
}

function recordPlatformPayment(db: Db, gymId: string, planId: string, months = 1, paidOn: string | null = null) {
  return run<{ payment_id: string; period_start: string; period_end: string }>(
    db,
    `select payment_id, period_start::text, period_end::text
       from public.admin_record_platform_payment($1, $2, $3, $4, coalesce($5::date, app.today_ub()), 'bank_transfer')`,
    [gymId, planId, months, 99000 * months, paidOn],
  );
}

async function status(db: Db, gymId: string) {
  const { rows } = await db.query<{ s: string }>("select app.gym_status($1)::text as s", [gymId]);
  return rows[0].s;
}

describe("админы RPC-ийн эрх", () => {
  it("менежер, багш, нэвтрээгүй хэрэглэгч админы функц дуудаж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const trainer = await createStaff(db, a.gymId, "trainer");
      const plan = await insertPlatformPlan(db);
      for (const user of [a.userId, trainer]) {
        await asUser(db, user, async () => {
          expect((await recordPlatformPayment(db, a.gymId, plan)).error?.code).toBe(PERMISSION_DENIED);
          expect((await run(db, "select * from public.admin_gym_overview()")).error?.code).toBe(PERMISSION_DENIED);
          expect((await run(db, "select * from public.admin_platform_summary()")).error?.code).toBe(PERMISSION_DENIED);
          expect((await run(db, "select public.admin_set_gym_suspended($1, true, 'x')", [a.gymId])).error?.code).toBe(
            PERMISSION_DENIED,
          );
          expect((await run(db, "select public.admin_extend_trial($1, 30)", [a.gymId])).error?.code).toBe(
            PERMISSION_DENIED,
          );
        });
      }
      await asUser(db, null, async () => {
        expect((await run(db, "select * from public.admin_gym_overview()")).error?.code).toBe(PERMISSION_DENIED);
      });
    }));

  it("платформын төлбөрийн хүснэгтэд шууд бичих боломжгүй (админ ч)", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const admin = await createAdmin(db);
      const plan = await insertPlatformPlan(db);
      await asUser(db, admin, async () => {
        const res = await run(
          db,
          `insert into public.platform_payments (gym_id, platform_plan_id, plan_name, months, amount, paid_on, method, period_start, period_end, recorded_by)
           values ($1, $2, 'x', 1, 0, current_date, 'cash', current_date, current_date, $3)`,
          [a.gymId, plan, admin],
        );
        expect(res.error?.code).toBe(PERMISSION_DENIED);
        const sub = await run(db, "update public.gym_subscriptions set paid_until = '2099-01-01'");
        expect(sub.error?.code).toBe(PERMISSION_DENIED);
      });
    }));
});

describe("платформын төлбөр ба эрхийн хугацаа", () => {
  it("туршилтын үеэр төлбөл туршилт дууссаны дараагаас сунгана", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const admin = await createAdmin(db);
      const plan = await insertPlatformPlan(db);
      const trialEnd = await sqlDate(db, "app.today_ub() + 14");
      const expectedEnd = await sqlDate(db, `'${trialEnd}'::date + interval '1 month'`);

      await asUser(db, admin, async () => {
        const res = await recordPlatformPayment(db, a.gymId, plan);
        expect(res.error).toBeNull();
        expect(res.rows[0].period_end).toBe(expectedEnd);
      });
      expect(await status(db, a.gymId)).toBe("active");
    }));

  it("эрх дууссан (past_due) фитнес төлбөл төлсөн өдрөөс эхэлж, идэвхтэй болно", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const admin = await createAdmin(db);
      const plan = await insertPlatformPlan(db);
      await makePastDue(db, a.gymId);
      expect(await status(db, a.gymId)).toBe("past_due");
      const t = await sqlDate(db, "app.today_ub()");
      const expectedEnd = await sqlDate(db, "app.today_ub() + interval '3 months'");

      await asUser(db, admin, async () => {
        const res = await recordPlatformPayment(db, a.gymId, plan, 3);
        expect(res.rows[0]).toMatchObject({ period_start: t, period_end: expectedEnd });
      });
      expect(await status(db, a.gymId)).toBe("active");
      // Read-only-оос гарсан тул менежер дахин бичиж чадна.
      await asUser(db, a.userId, async () => {
        expect((await run(db, "update public.gyms set name = 'Шинэ нэр' where id = $1", [a.gymId])).rowCount).toBe(1);
      });
    }));

  it("хүчингүй болгоход хугацааг өмнөх төлбөрөөр сэргээнэ", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const admin = await createAdmin(db);
      const plan = await insertPlatformPlan(db);
      await asUser(db, admin, async () => {
        const first = await recordPlatformPayment(db, a.gymId, plan, 1);
        const second = await recordPlatformPayment(db, a.gymId, plan, 1);
        expect((await run(db, "select public.admin_void_platform_payment($1, 'x')", [first.rows[0].payment_id])).error?.code).toBe("22023");
        expect((await run(db, "select public.admin_void_platform_payment($1, 'Давхар бүртгэсэн')", [second.rows[0].payment_id])).error).toBeNull();
        const sub = await run(db, "select paid_until::text from public.gym_subscriptions where gym_id = $1", [a.gymId]);
        expect(sub.rows[0]).toEqual({ paid_until: first.rows[0].period_end });
        await run(db, "select public.admin_void_platform_payment($1, 'Бүгд')", [first.rows[0].payment_id]);
        const none = await run(db, "select paid_until from public.gym_subscriptions where gym_id = $1", [a.gymId]);
        expect(none.rows[0]).toEqual({ paid_until: null });
      });
      expect(await status(db, a.gymId)).toBe("trial");
    }));

  it("түр зогсооход read-only болж, сэргээхэд буцна; шалтгаан заавал", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const admin = await createAdmin(db);
      const client = await insertClient(db, a.gymId);
      await asUser(db, admin, async () => {
        expect((await run(db, "select public.admin_set_gym_suspended($1, true, '')", [a.gymId])).error?.code).toBe("22023");
        expect((await run(db, "select public.admin_set_gym_suspended($1, true, 'Гэрээ зөрчсөн')", [a.gymId])).error).toBeNull();
      });
      expect(await status(db, a.gymId)).toBe("suspended");
      await asUser(db, a.userId, async () => {
        expect((await run(db, "select id from public.clients")).rows).toHaveLength(1);
        const edit = await run(db, "update public.clients set notes = 'x' where id = $1", [client]);
        expect(edit.rowCount).toBe(0);
      });
      await asUser(db, admin, async () => {
        await run(db, "select public.admin_set_gym_suspended($1, false)", [a.gymId]);
      });
      expect(await status(db, a.gymId)).toBe("trial");
    }));

  it("туршилт сунгах ба баталгаажуулах", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const admin = await createAdmin(db);
      await makePastDue(db, a.gymId);
      const expected = await sqlDate(db, "app.today_ub() - 1 + 10");
      await asUser(db, admin, async () => {
        const res = await run<{ d: string }>(db, "select public.admin_extend_trial($1, 10)::text as d", [a.gymId]);
        expect(res.rows[0].d).toBe(expected);
        await run(db, "select public.admin_set_gym_verified($1, true)", [a.gymId]);
      });
      expect(await status(db, a.gymId)).toBe("trial");
      const v = await db.query("select verified_at is not null as v from public.gym_subscriptions where gym_id = $1", [a.gymId]);
      expect(v.rows[0].v).toBe(true);
    }));
});

describe("платформын төлбөрийн харагдац", () => {
  it("менежер өөрийнхийг, админ бүгдийг харна; багш ба өөр фитнес харахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      const trainer = await createStaff(db, a.gymId, "trainer");
      const admin = await createAdmin(db);
      const plan = await insertPlatformPlan(db);
      await asUser(db, admin, async () => {
        await recordPlatformPayment(db, a.gymId, plan);
        await recordPlatformPayment(db, b.gymId, plan);
        const own = await run(db, "select id from public.platform_payments where gym_id = any($1)", [[a.gymId, b.gymId]]);
        expect(own.rows).toHaveLength(2);
      });
      await asUser(db, a.userId, async () => {
        const rows = await run<{ gym_id: string }>(db, "select gym_id from public.platform_payments");
        expect(rows.rows.map((r) => r.gym_id)).toEqual([a.gymId]);
      });
      await asUser(db, trainer, async () => {
        expect((await run(db, "select id from public.platform_payments")).rows).toHaveLength(0);
        expect((await run(db, "select * from public.gym_usage($1)", [a.gymId])).rows).toHaveLength(0);
      });
    }));

  it("админы тойм үйлчлүүлэгчийн тоог өгнө, нэр утсыг биш", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const admin = await createAdmin(db);
      await insertClient(db, a.gymId, "Нууц нэр");
      await insertClient(db, a.gymId, "Нууц нэр 2");
      await asUser(db, admin, async () => {
        const overview = await run<{ gym_id: string; client_count: number; status: string }>(
          db,
          "select gym_id, client_count, status from public.admin_gym_overview() where gym_id = $1",
          [a.gymId],
        );
        expect(overview.rows[0]).toMatchObject({ client_count: 2, status: "trial" });
        expect((await run(db, "select full_name from public.clients")).rows).toHaveLength(0);
        const summary = await run<{ gym_count: number }>(db, "select * from public.admin_platform_summary()");
        expect(summary.rows[0].gym_count).toBeGreaterThanOrEqual(1);
      });
    }));
});
