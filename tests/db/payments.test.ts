import { describe, expect, it } from "vitest";
import { DISCOUNT_CASES, PERIOD_CASES } from "../fixtures/membership-cases";
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

async function today(db: Db) {
  const { rows } = await db.query<{ t: string }>("select app.today_ub()::text as t");
  return rows[0].t;
}

async function sqlDate(db: Db, expr: string) {
  const { rows } = await db.query<{ d: string }>(`select (${expr})::date::text as d`);
  return rows[0].d;
}

describe("SQL ба TypeScript тооцооны нийцэл", () => {
  it.each(PERIOD_CASES)("compute_period: $name", ({ currentEnd, paidOn, months, startsOn, endsOn }) =>
    withTx(async (db) => {
      const { rows } = await db.query(
        "select starts_on::text, ends_on::text from app.compute_period($1::date, $2::date, $3)",
        [currentEnd, paidOn, months],
      );
      expect(rows[0]).toEqual({ starts_on: startsOn, ends_on: endsOn });
    }),
  );

  it.each(DISCOUNT_CASES)("compute_discount: $name", ({ price, type, value, expected }) =>
    withTx(async (db) => {
      const res = await run<{ d: string }>(
        db,
        "select app.compute_discount($1, $2::public.discount_type, $3) as d",
        [price, type, value],
      );
      if (expected === "error") {
        expect(res.error?.code).toBe("22023");
      } else {
        expect(Number(res.rows[0].d)).toBe(expected);
      }
    }),
  );
});

describe("record_payment", () => {
  it("анхны төлбөр: өнөөдрөөс эхэлж, хөнгөлөлтийг тооцно", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const client = await insertClient(db, a.gymId);
      const plan = await insertPlan(db, a.gymId, { months: 1, price: 80000 });
      const t = await today(db);
      const expectedEnd = await sqlDate(db, "app.today_ub() + interval '1 month'");

      await asUser(db, a.userId, async () => {
        const res = await recordPayment(db, { clientId: client, planId: plan, discountType: "percent", discountValue: 10 });
        expect(res.error).toBeNull();
        expect(res.rows[0]).toMatchObject({ starts_on: t, ends_on: expectedEnd, is_renewal: false });
        expect(Number(res.rows[0].amount)).toBe(72000);

        const pay = await run(db, "select list_price, discount_amount, amount, plan_name, recorded_by from public.payments");
        expect(pay.rows[0]).toMatchObject({ list_price: "80000", discount_amount: "8000", amount: "72000", plan_name: "1 сар", recorded_by: a.userId });

        const m = await run(db, "select ends_on::text, last_plan_name from public.client_memberships where client_id = $1", [client]);
        expect(m.rows[0]).toEqual({ ends_on: expectedEnd, last_plan_name: "1 сар" });
      });
    }));

  it("идэвхтэй эрхийг дуусах огнооноос нь сунгана", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const client = await insertClient(db, a.gymId);
      const plan1 = await insertPlan(db, a.gymId, { months: 1 });
      const plan3 = await insertPlan(db, a.gymId, { name: "3 сар", months: 3, price: 210000 });
      const firstEnd = await sqlDate(db, "app.today_ub() + interval '1 month'");
      const secondStart = await sqlDate(db, `'${firstEnd}'::date + 1`);
      const secondEnd = await sqlDate(db, `'${firstEnd}'::date + interval '3 months'`);

      await asUser(db, a.userId, async () => {
        await recordPayment(db, { clientId: client, planId: plan1 });
        const res = await recordPayment(db, { clientId: client, planId: plan3, method: "bank_transfer" });
        expect(res.error).toBeNull();
        expect(res.rows[0]).toMatchObject({ starts_on: secondStart, ends_on: secondEnd, is_renewal: true });
      });
    }));

  it("дууссан эрхийг төлсөн өдрөөс эхлүүлнэ", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const client = await insertClient(db, a.gymId);
      const plan = await insertPlan(db, a.gymId, { months: 1 });
      const oldPaid = await sqlDate(db, "app.today_ub() - 60");
      const t = await today(db);

      await asUser(db, a.userId, async () => {
        const first = await recordPayment(db, { clientId: client, planId: plan, paidOn: oldPaid });
        expect(first.error).toBeNull();
        const res = await recordPayment(db, { clientId: client, planId: plan });
        expect(res.rows[0]).toMatchObject({ starts_on: t, is_renewal: true });
      });
    }));

  it("буруу оролтыг татгалзана", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const client = await insertClient(db, a.gymId);
      const plan = await insertPlan(db, a.gymId, { price: 50000 });
      const inactive = await insertPlan(db, a.gymId, { active: false });
      const tomorrow = await sqlDate(db, "app.today_ub() + 1");
      const tooOld = await sqlDate(db, "app.today_ub() - 400");

      await asUser(db, a.userId, async () => {
        expect((await recordPayment(db, { clientId: client, planId: inactive })).error?.code).toBe("P0002");
        expect((await recordPayment(db, { clientId: client, planId: plan, method: "qpay" })).error?.code).toBe("22023");
        expect((await recordPayment(db, { clientId: client, planId: plan, paidOn: tomorrow })).error?.code).toBe("22023");
        expect((await recordPayment(db, { clientId: client, planId: plan, paidOn: tooOld })).error?.code).toBe("22023");
        expect(
          (await recordPayment(db, { clientId: client, planId: plan, discountType: "amount", discountValue: 60000 })).error?.code,
        ).toBe("22023");
        const none = await run(db, "select count(*)::int as n from public.payments");
        expect(none.rows[0]).toEqual({ n: 0 });
      });
    }));

  it("устгагдсан үйлчлүүлэгчид төлбөр бүртгэхгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const client = await insertClient(db, a.gymId);
      const plan = await insertPlan(db, a.gymId);
      await db.query("update public.clients set deleted_at = now() where id = $1", [client]);
      await asUser(db, a.userId, async () => {
        expect((await recordPayment(db, { clientId: client, planId: plan })).error?.code).toBe("P0002");
      });
    }));
});

describe("төлбөр: tenant ба дүрийн хамгаалалт", () => {
  it("өөр фитнесийн үйлчлүүлэгч эсвэл багцаар төлбөр бүртгэж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      const aClient = await insertClient(db, a.gymId);
      const aPlan = await insertPlan(db, a.gymId);
      const bClient = await insertClient(db, b.gymId);
      const bPlan = await insertPlan(db, b.gymId);

      await asUser(db, b.userId, async () => {
        expect((await recordPayment(db, { clientId: aClient, planId: aPlan })).error?.code).toBe("P0002");
        expect((await recordPayment(db, { clientId: bClient, planId: aPlan })).error?.code).toBe("P0002");
        expect((await recordPayment(db, { clientId: bClient, planId: bPlan })).error).toBeNull();
      });
      await asUser(db, a.userId, async () => {
        expect((await run(db, "select id from public.payments")).rows).toHaveLength(0);
        expect((await run(db, "select client_id from public.client_memberships")).rows).toHaveLength(0);
        expect((await run(db, "select id from public.membership_plans")).rows).toHaveLength(1);
      });
    }));

  it("багш төлбөр бүртгэнэ, гэхдээ төлбөрийн мөрүүдийг (орлогыг) харахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const trainer = await createStaff(db, a.gymId, "trainer");
      const client = await insertClient(db, a.gymId);
      const plan = await insertPlan(db, a.gymId);

      await asUser(db, trainer, async () => {
        const res = await recordPayment(db, { clientId: client, planId: plan });
        expect(res.error).toBeNull();
        expect((await run(db, "select * from public.payments")).rows).toHaveLength(0);
        expect((await run(db, "select sum(amount) from public.payments")).rows[0]).toEqual({ sum: null });
        const m = await run(db, "select ends_on from public.client_memberships");
        expect(m.rows).toHaveLength(1);
        expect((await run(db, "select id from public.membership_plans")).rows).toHaveLength(1);
      });
      await asUser(db, a.userId, async () => {
        const rows = await run(db, "select recorded_by from public.payments");
        expect(rows.rows).toEqual([{ recorded_by: trainer }]);
      });
    }));

  it("багш багц үүсгэж, засаж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const trainer = await createStaff(db, a.gymId, "trainer");
      const plan = await insertPlan(db, a.gymId);
      await asUser(db, trainer, async () => {
        const ins = await run(db, "insert into public.membership_plans (gym_id, name, duration_months, price) values ($1, 'x', 1, 1)", [a.gymId]);
        expect(ins.error?.code).toBe(PERMISSION_DENIED);
        const upd = await run(db, "update public.membership_plans set price = 1 where id = $1", [plan]);
        expect(upd.rowCount).toBe(0);
      });
    }));

  it("төлбөр ба эрхийн хүснэгтэд шууд бичих боломжгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const client = await insertClient(db, a.gymId);
      const plan = await insertPlan(db, a.gymId);
      await asUser(db, a.userId, async () => {
        await recordPayment(db, { clientId: client, planId: plan });
        const ins = await run(
          db,
          `insert into public.payments (gym_id, client_id, plan_id, plan_name, duration_months, list_price, amount,
             paid_on, method, starts_on, ends_on, is_renewal, recorded_by)
           values ($1, $2, $3, 'x', 1, 0, 0, current_date, 'cash', current_date, '2099-01-01', false, $4)`,
          [a.gymId, client, plan, a.userId],
        );
        expect(ins.error?.code).toBe(PERMISSION_DENIED);
        const extend = await run(db, "update public.client_memberships set ends_on = '2099-01-01' where client_id = $1", [client]);
        expect(extend.error?.code).toBe(PERMISSION_DENIED);
        const tamper = await run(db, "update public.payments set amount = 1");
        expect(tamper.error?.code).toBe(PERMISSION_DENIED);
      });
    }));

  it("нэвтрээгүй хэрэглэгч RPC дуудаж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const client = await insertClient(db, a.gymId);
      const plan = await insertPlan(db, a.gymId);
      await asUser(db, null, async () => {
        expect((await recordPayment(db, { clientId: client, planId: plan })).error?.code).toBe(PERMISSION_DENIED);
      });
    }));

  it("эрх дууссан (read-only) фитнест төлбөр бүртгэхгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const client = await insertClient(db, a.gymId);
      const plan = await insertPlan(db, a.gymId);
      await makePastDue(db, a.gymId);
      await asUser(db, a.userId, async () => {
        expect((await recordPayment(db, { clientId: client, planId: plan })).error?.code).toBe(PERMISSION_DENIED);
      });
    }));
});

describe("void_payment", () => {
  it("зөвхөн хамгийн сүүлийн төлбөрийг хүчингүй болгож, эрхийг өмнөхөөр сэргээнэ", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const client = await insertClient(db, a.gymId);
      const plan = await insertPlan(db, a.gymId);
      const firstEnd = await sqlDate(db, "app.today_ub() + interval '1 month'");

      await asUser(db, a.userId, async () => {
        const first = await recordPayment(db, { clientId: client, planId: plan });
        const second = await recordPayment(db, { clientId: client, planId: plan });
        const firstId = first.rows[0].payment_id;
        const secondId = second.rows[0].payment_id;

        const wrong = await run(db, "select public.void_payment($1, 'алдаа')", [firstId]);
        expect(wrong.error?.code).toBe("22023");
        const noReason = await run(db, "select public.void_payment($1, '  ')", [secondId]);
        expect(noReason.error?.code).toBe("22023");

        const ok = await run(db, "select public.void_payment($1, 'Буруу бүртгэсэн')", [secondId]);
        expect(ok.error).toBeNull();
        const m = await run(db, "select ends_on::text, last_payment_id from public.client_memberships where client_id = $1", [client]);
        expect(m.rows[0]).toEqual({ ends_on: firstEnd, last_payment_id: firstId });

        const again = await run(db, "select public.void_payment($1, 'дахин')", [secondId]);
        expect(again.error?.code).toBe("22023");

        await run(db, "select public.void_payment($1, 'бүгдийг')", [firstId]);
        const none = await run(db, "select ends_on from public.client_memberships where client_id = $1", [client]);
        expect(none.rows[0]).toEqual({ ends_on: null });
      });
    }));

  it("багш болон өөр фитнесийн менежер хүчингүй болгож чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      const trainer = await createStaff(db, a.gymId, "trainer");
      const client = await insertClient(db, a.gymId);
      const plan = await insertPlan(db, a.gymId);
      let paymentId = "";
      await asUser(db, a.userId, async () => {
        paymentId = (await recordPayment(db, { clientId: client, planId: plan })).rows[0].payment_id;
      });
      await asUser(db, trainer, async () => {
        expect((await run(db, "select public.void_payment($1, 'x')", [paymentId])).error?.code).toBe("P0002");
      });
      await asUser(db, b.userId, async () => {
        expect((await run(db, "select public.void_payment($1, 'x')", [paymentId])).error?.code).toBe("P0002");
      });
    }));
});
