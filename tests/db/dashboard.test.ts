import { describe, expect, it } from "vitest";
import {
  asUser,
  createGymOwner,
  createStaff,
  type Db,
  insertClient,
  insertPlan,
  makePastDue,
  PERMISSION_DENIED,
  recordPayment,
  run,
  withTx,
} from "./helpers";

/** Эрхийн хугацааг шууд тохируулна (төлөвийн тестэд RPC-ээр огноо тааруулахаас хялбар). */
async function setMembership(db: Db, gymId: string, clientId: string, daysFromToday: number | null) {
  if (daysFromToday === null) return;
  await db.query(
    `insert into public.client_memberships (client_id, gym_id, starts_on, ends_on, last_plan_name)
     values ($1, $2, app.today_ub() - 30, app.today_ub() + $3::int, '1 сар')
     on conflict (client_id) do update set ends_on = excluded.ends_on`,
    [clientId, gymId, daysFromToday],
  );
}

async function seedStatuses(db: Db, gymId: string) {
  const ids: Record<string, string> = {};
  for (const [name, days] of [
    ["none", null],
    ["expired40", -40],
    ["expired1", -1],
    ["today", 0],
    ["in7", 7],
    ["in8", 8],
    ["in60", 60],
  ] as const) {
    ids[name] = await insertClient(db, gymId, name);
    await setMembership(db, gymId, ids[name], days);
  }
  return ids;
}

describe("client_status_v", () => {
  it("төлөв ба үлдсэн хоногийг фитнесийн тохиргоогоор тооцно", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      await seedStatuses(db, a.gymId);
      const deleted = await insertClient(db, a.gymId, "deleted");
      await db.query("update public.clients set deleted_at = now() where id = $1", [deleted]);

      await asUser(db, a.userId, async () => {
        const { rows } = await run<{ full_name: string; status: string; days_left: number | null }>(
          db,
          "select full_name, status, days_left from public.client_status_v order by full_name",
        );
        const byName = Object.fromEntries(rows.map((r) => [r.full_name, [r.status, r.days_left]]));
        expect(byName).toEqual({
          none: ["none", null],
          expired40: ["expired", -40],
          expired1: ["expired", -1],
          today: ["expiring", 0],
          in7: ["expiring", 7],
          in8: ["active", 8],
          in60: ["active", 60],
        });
      });

      await db.query("update public.gyms set expiring_threshold_days = 14 where id = $1", [a.gymId]);
      await asUser(db, a.userId, async () => {
        const { rows } = await run<{ status: string }>(db, "select status from public.client_status_v where full_name = 'in8'");
        expect(rows[0].status).toBe("expiring");
      });
    }));

  it("өөр фитнесийн мөр view-ээр ч харагдахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      await seedStatuses(db, a.gymId);
      await asUser(db, b.userId, async () => {
        expect((await run(db, "select id from public.client_status_v")).rows).toHaveLength(0);
      });
      await asUser(db, null, async () => {
        expect((await run(db, "select id from public.client_status_v")).error?.code).toBe(PERMISSION_DENIED);
      });
    }));
});

describe("Мэдэгдсэн тэмдэглэл", () => {
  it("багш тэмдэглэнэ, notified_by автоматаар өөрөө болно, сунгахад шинэ мөчлөг эхэлнэ", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const trainer = await createStaff(db, a.gymId, "trainer");
      const client = await insertClient(db, a.gymId, "Сунгах");
      const plan = await insertPlan(db, a.gymId);

      await asUser(db, trainer, async () => {
        await recordPayment(db, { clientId: client, planId: plan });
        const m = await run<{ ends_on: string }>(db, "select ends_on::text from public.client_memberships where client_id = $1", [client]);
        const ins = await run(
          db,
          "insert into public.client_notices (gym_id, client_id, ends_on, note) values ($1, $2, $3, 'Утсаар хэлсэн')",
          [a.gymId, client, m.rows[0].ends_on],
        );
        expect(ins.error).toBeNull();
        const v = await run(db, "select notice_note, notified_by_name from public.client_status_v where id = $1", [client]);
        expect(v.rows[0]).toEqual({ notice_note: "Утсаар хэлсэн", notified_by_name: "Ажилтан trainer" });

        const spoof = await run(
          db,
          "insert into public.client_notices (gym_id, client_id, ends_on, notified_by) values ($1, $2, current_date, $3)",
          [a.gymId, client, a.userId],
        );
        expect(spoof.error?.code).toBe(PERMISSION_DENIED);

        // Сунгалт → шинэ ends_on → өмнөх тэмдэглэл энэ мөчлөгт хамаарахгүй.
        await recordPayment(db, { clientId: client, planId: plan });
        const after = await run(db, "select notice_id from public.client_status_v where id = $1", [client]);
        expect(after.rows[0]).toEqual({ notice_id: null });
      });
    }));

  it("тэмдэглэлийг буцаах (soft delete)", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const client = await insertClient(db, a.gymId);
      await setMembership(db, a.gymId, client, 3);
      await asUser(db, a.userId, async () => {
        const ins = await run<{ id: string }>(
          db,
          "insert into public.client_notices (gym_id, client_id, ends_on) values ($1, $2, app.today_ub() + 3) returning id",
          [a.gymId, client],
        );
        const undo = await run(db, "update public.client_notices set deleted_at = now() where id = $1", [ins.rows[0].id]);
        expect(undo.rowCount).toBe(1);
        const v = await run(db, "select notice_id from public.client_status_v where id = $1", [client]);
        expect(v.rows[0]).toEqual({ notice_id: null });
        expect((await run(db, "delete from public.client_notices")).error?.code).toBe(PERMISSION_DENIED);
      });
    }));

  it("өөр фитнесийн үйлчлүүлэгчид тэмдэглэл хийж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      const aClient = await insertClient(db, a.gymId);
      await asUser(db, b.userId, async () => {
        const asA = await run(
          db,
          "insert into public.client_notices (gym_id, client_id, ends_on) values ($1, $2, current_date)",
          [a.gymId, aClient],
        );
        expect(asA.error?.code).toBe(PERMISSION_DENIED);
        const asB = await run(
          db,
          "insert into public.client_notices (gym_id, client_id, ends_on) values ($1, $2, current_date)",
          [b.gymId, aClient],
        );
        expect(asB.error?.code).toBe("23503");
      });
    }));

  it("read-only фитнест тэмдэглэл хийхгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const client = await insertClient(db, a.gymId);
      await makePastDue(db, a.gymId);
      await asUser(db, a.userId, async () => {
        const res = await run(
          db,
          "insert into public.client_notices (gym_id, client_id, ends_on) values ($1, $2, current_date)",
          [a.gymId, client],
        );
        expect(res.error?.code).toBe(PERMISSION_DENIED);
      });
    }));
});

describe("dashboard_summary", () => {
  it("тоонуудыг тооцож, орлогыг зөвхөн менежерт харуулна", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const trainer = await createStaff(db, a.gymId, "trainer");
      await seedStatuses(db, a.gymId);
      const plan = await insertPlan(db, a.gymId, { price: 80000 });
      const fresh = await insertClient(db, a.gymId, "шинэ");
      const renew = await insertClient(db, a.gymId, "сунгалт");

      await asUser(db, a.userId, async () => {
        await recordPayment(db, { clientId: fresh, planId: plan });
        await recordPayment(db, { clientId: renew, planId: plan });
        await recordPayment(db, { clientId: renew, planId: plan, discountType: "amount", discountValue: 5000 });
      });

      const expected = {
        active_count: 6, // today, in7, in8, in60, шинэ, сунгалт
        expiring_count: 2, // today, in7
        expired_count: 2,
        expired_recent_count: 1, // expired1 (40 хоногийнх 30-аас хэтэрсэн)
        none_count: 1,
        month_new_clients: 2, // шинэ + сунгалтын анхны төлбөр
        month_renewed_clients: 1,
      };

      await asUser(db, a.userId, async () => {
        const { rows } = await run(db, "select * from public.dashboard_summary($1)", [a.gymId]);
        expect(rows[0]).toMatchObject({ ...expected, month_revenue: "235000", month_payment_count: 3 });
      });
      await asUser(db, trainer, async () => {
        const { rows } = await run(db, "select * from public.dashboard_summary($1)", [a.gymId]);
        expect(rows[0]).toMatchObject({ ...expected, month_revenue: null, month_payment_count: null });
      });
    }));

  it("өөр фитнесийн нэгтгэлийг авах боломжгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      await asUser(db, b.userId, async () => {
        expect((await run(db, "select * from public.dashboard_summary($1)", [a.gymId])).error?.code).toBe(
          PERMISSION_DENIED,
        );
      });
    }));
});
