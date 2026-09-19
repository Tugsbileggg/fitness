import { describe, expect, it } from "vitest";
import {
  asUser,
  createAdmin,
  createAuthUser,
  createGymOwner,
  createStaff,
  makePastDue,
  PERMISSION_DENIED,
  run,
  withTx,
} from "./helpers";

describe("бүртгэлийн trigger", () => {
  it("фитнес бүртгэхэд профайл, фитнес, менежер, 14 хоногийн туршилт үүснэ", () =>
    withTx(async (db) => {
      const { userId, gymId } = await createGymOwner(db, "Хүчит фитнес");

      const gym = await db.query("select name, phone, created_by from public.gyms where id = $1", [gymId]);
      expect(gym.rows[0]).toMatchObject({ name: "Хүчит фитнес", phone: "99112233", created_by: userId });

      const member = await db.query("select role, is_active from public.gym_users where user_id = $1", [userId]);
      expect(member.rows).toEqual([{ role: "manager", is_active: true }]);

      const sub = await db.query(
        "select trial_ends_at = app.today_ub() + 14 as ok, paid_until from public.gym_subscriptions where gym_id = $1",
        [gymId],
      );
      expect(sub.rows[0]).toEqual({ ok: true, paid_until: null });

      const profile = await db.query("select full_name, is_platform_admin from public.profiles where id = $1", [userId]);
      expect(profile.rows[0]).toEqual({ full_name: "Хүчит фитнес менежер", is_platform_admin: false });
    }));

  it("урилгаар үүссэн хэрэглэгчид зөвхөн профайл үүснэ", () =>
    withTx(async (db) => {
      const userId = await createAuthUser(db, { meta: { full_name: "Бат" } });
      const gyms = await db.query("select count(*)::int as n from public.gym_users where user_id = $1", [userId]);
      expect(gyms.rows[0].n).toBe(0);
      const profile = await db.query("select full_name from public.profiles where id = $1", [userId]);
      expect(profile.rows[0].full_name).toBe("Бат");
    }));

  it("metadata-аар админ эрх авах боломжгүй", () =>
    withTx(async (db) => {
      const userId = await createAuthUser(db, { meta: { full_name: "Хакер", is_platform_admin: true } });
      const profile = await db.query("select is_platform_admin from public.profiles where id = $1", [userId]);
      expect(profile.rows[0].is_platform_admin).toBe(false);
    }));
});

describe("платформын эрхийн төлөв (app.subscription_status)", () => {
  // Туршилт 2026-10-03-нд дуусна. [тайлбар, suspended_at, paid_until, өнөөдөр, хүлээгдэх]
  const cases: Array<[string, string | null, string | null, string, string]> = [
    ["түр зогсоосон (төлсөн байсан ч)", "2026-09-01T00:00:00Z", "2026-12-31", "2026-09-19", "suspended"],
    ["туршилтын хугацаанд", null, null, "2026-09-19", "trial"],
    ["туршилтын сүүлийн өдөр", null, null, "2026-10-03", "trial"],
    ["туршилт дууссан", null, null, "2026-10-04", "past_due"],
    ["туршилтын үеэр төлсөн", null, "2026-11-03", "2026-09-20", "active"],
    ["төлсөн хугацаанд", null, "2026-11-01", "2026-10-10", "active"],
    ["төлсөн сүүлийн өдөр", null, "2026-11-01", "2026-11-01", "active"],
    ["төлсөн хугацаа дууссан", null, "2026-11-01", "2026-11-02", "past_due"],
  ];

  it.each(cases)("%s", (_label, suspendedAt, paidUntil, today, expected) =>
    withTx(async (db) => {
      const { rows } = await db.query(
        "select app.subscription_status($1::timestamptz, $2::date, '2026-10-03'::date, $3::date) as s",
        [suspendedAt, paidUntil, today],
      );
      expect(rows[0].s).toBe(expected);
    }),
  );
});

describe("эрхийн хугацаа (app.compute_period)", () => {
  const cases: Array<[string, string | null, string, number, string, string]> = [
    ["анхны төлбөр", null, "2026-09-19", 1, "2026-09-19", "2026-10-19"],
    ["идэвхтэй үед сунгах", "2026-10-19", "2026-10-10", 1, "2026-10-20", "2026-11-19"],
    ["дуусах өдөр сунгах", "2026-10-19", "2026-10-19", 3, "2026-10-20", "2027-01-19"],
    ["дууссаны дараа", "2026-09-10", "2026-09-19", 1, "2026-09-19", "2026-10-19"],
    ["сарын сүүлийн өдөр", null, "2027-01-31", 1, "2027-01-31", "2027-02-28"],
    ["өндөр жил", null, "2028-01-31", 1, "2028-01-31", "2028-02-29"],
    ["12 сар", null, "2026-09-19", 12, "2026-09-19", "2027-09-19"],
  ];

  it.each(cases)("%s", (_label, currentEnd, paidOn, months, startsOn, endsOn) =>
    withTx(async (db) => {
      const { rows } = await db.query(
        "select starts_on::text, ends_on::text from app.compute_period($1::date, $2::date, $3)",
        [currentEnd, paidOn, months],
      );
      expect(rows[0]).toEqual({ starts_on: startsOn, ends_on: endsOn });
    }),
  );
});

describe("RLS: фитнес хоорондын тусгаарлалт", () => {
  it("менежер зөвхөн өөрийн фитнесийг харна", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      await createGymOwner(db, "Б фитнес");

      await asUser(db, a.userId, async () => {
        const gyms = await run<{ id: string }>(db, "select id from public.gyms");
        expect(gyms.rows.map((r) => r.id)).toEqual([a.gymId]);

        const members = await run<{ gym_id: string }>(db, "select gym_id from public.gym_users");
        expect(new Set(members.rows.map((r) => r.gym_id))).toEqual(new Set([a.gymId]));

        const subs = await run<{ gym_id: string }>(db, "select gym_id from public.gym_subscriptions");
        expect(subs.rows.map((r) => r.gym_id)).toEqual([a.gymId]);

        const profiles = await run<{ id: string }>(db, "select id from public.profiles");
        expect(profiles.rows.map((r) => r.id)).toEqual([a.userId]);
      });
    }));

  it("өөр фитнесийн мэдээллийг засаж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");

      await asUser(db, a.userId, async () => {
        const res = await run(db, "update public.gyms set name = 'Хакердсан' where id = $1", [b.gymId]);
        expect(res.error).toBeNull();
        expect(res.rowCount).toBe(0);
      });
      const check = await db.query("select name from public.gyms where id = $1", [b.gymId]);
      expect(check.rows[0].name).toBe("Б фитнес");
    }));

  it("менежер өөрийн фитнесийн мэдээллийг засна", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      await asUser(db, a.userId, async () => {
        const res = await run(db, "update public.gyms set name = 'А фитнес клуб', expiring_threshold_days = 10 where id = $1", [a.gymId]);
        expect(res.error).toBeNull();
        expect(res.rowCount).toBe(1);
      });
    }));

  it("нэвтрээгүй хэрэглэгч фитнесийн өгөгдөл харахгүй", () =>
    withTx(async (db) => {
      await createGymOwner(db, "А фитнес");
      await asUser(db, null, async () => {
        for (const table of ["gyms", "gym_users", "gym_subscriptions", "profiles"]) {
          const res = await run(db, `select * from public.${table}`);
          expect(res.error?.code, table).toBe(PERMISSION_DENIED);
        }
      });
    }));

  it("идэвхгүй болгосон ажилтан фитнесийг харахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const trainer = await createStaff(db, a.gymId, "trainer");
      await db.query("update public.gym_users set is_active = false where user_id = $1", [trainer]);
      await asUser(db, trainer, async () => {
        const gyms = await run(db, "select id from public.gyms");
        expect(gyms.rows).toHaveLength(0);
      });
    }));
});

describe("RLS: эрх нэмэгдүүлэх оролдлого", () => {
  it("хэрэглэгч өөрийгөө админ болгож чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      await asUser(db, a.userId, async () => {
        const res = await run(db, "update public.profiles set is_platform_admin = true where id = $1", [a.userId]);
        expect(res.error?.code).toBe(PERMISSION_DENIED);
        const ok = await run(db, "update public.profiles set full_name = 'Шинэ нэр' where id = $1", [a.userId]);
        expect(ok.rowCount).toBe(1);
      });
    }));

  it("менежер платформын эрхээ өөрөө сунгаж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      await asUser(db, a.userId, async () => {
        const res = await run(db, "update public.gym_subscriptions set paid_until = '2030-01-01' where gym_id = $1", [a.gymId]);
        expect(res.error?.code).toBe(PERMISSION_DENIED);
      });
    }));

  it("менежер өөрийгөө өөр фитнест нэмж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      await asUser(db, a.userId, async () => {
        const res = await run(db, "insert into public.gym_users (gym_id, user_id, role) values ($1, $2, 'manager')", [b.gymId, a.userId]);
        expect(res.error?.code).toBe(PERMISSION_DENIED);
      });
    }));

  it("DELETE хэзээ ч зөвшөөрөгдөхгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      await asUser(db, a.userId, async () => {
        for (const table of ["gyms", "gym_users", "gym_subscriptions", "profiles", "platform_plans"]) {
          const res = await run(db, `delete from public.${table}`);
          expect(res.error?.code, table).toBe(PERMISSION_DENIED);
        }
      });
    }));

  it("багш фитнесийн мэдээллийг засаж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const trainer = await createStaff(db, a.gymId, "trainer");
      await asUser(db, trainer, async () => {
        const seen = await run(db, "select id from public.gyms");
        expect(seen.rows).toHaveLength(1);
        const res = await run(db, "update public.gyms set name = 'Багшийн өөрчлөлт' where id = $1", [a.gymId]);
        expect(res.rowCount).toBe(0);
      });
    }));
});

describe("read-only горим", () => {
  it("эрх дууссан фитнес уншиж чадна, засаж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      await makePastDue(db, a.gymId);
      await asUser(db, a.userId, async () => {
        const read = await run(db, "select id from public.gyms");
        expect(read.rows).toHaveLength(1);
        const write = await run(db, "update public.gyms set name = 'Шинэ нэр' where id = $1", [a.gymId]);
        expect(write.rowCount).toBe(0);
      });
    }));
});

describe("get_my_context", () => {
  it("менежерт фитнес, дүр, туршилтын төлөвийг буцаана", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      await asUser(db, a.userId, async () => {
        const { rows } = await run(db, "select * from public.get_my_context()");
        expect(rows[0]).toMatchObject({
          user_id: a.userId,
          gym_id: a.gymId,
          gym_name: "А фитнес",
          role: "manager",
          subscription_status: "trial",
          is_platform_admin: false,
        });
      });
    }));

  it("админ бүх фитнесийг харна, өөрөө фитнесгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      const admin = await createAdmin(db);
      await asUser(db, admin, async () => {
        const ctx = await run(db, "select gym_id, is_platform_admin from public.get_my_context()");
        expect(ctx.rows[0]).toEqual({ gym_id: null, is_platform_admin: true });
        const gyms = await run<{ id: string }>(db, "select id from public.gyms where id = any($1)", [[a.gymId, b.gymId]]);
        expect(gyms.rows).toHaveLength(2);
      });
    }));
});

describe("платформын тариф", () => {
  it("нэвтрээгүй хэрэглэгч зөвхөн идэвхтэй тарифыг харна, админ л засна", () =>
    withTx(async (db) => {
      await db.query(
        "insert into public.platform_plans (name, monthly_price, is_active) values ('Идэвхтэй', 1000, true), ('Хаагдсан', 2000, false)",
      );
      await asUser(db, null, async () => {
        const res = await run<{ name: string }>(db, "select name from public.platform_plans where name in ('Идэвхтэй','Хаагдсан')");
        expect(res.rows.map((r) => r.name)).toEqual(["Идэвхтэй"]);
      });
      const a = await createGymOwner(db);
      await asUser(db, a.userId, async () => {
        const res = await run(db, "insert into public.platform_plans (name, monthly_price) values ('Хакер', 0)");
        expect(res.error?.code).toBe(PERMISSION_DENIED);
      });
      const admin = await createAdmin(db);
      await asUser(db, admin, async () => {
        const res = await run(db, "insert into public.platform_plans (name, monthly_price) values ('Шинэ', 5000)");
        expect(res.error).toBeNull();
      });
    }));
});

describe("логоны storage", () => {
  it("менежер зөвхөн өөрийн фитнесийн хавтаст лого байршуулна", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      await asUser(db, a.userId, async () => {
        const own = await run(
          db,
          "insert into storage.objects (bucket_id, name, owner_id) values ('gym-logos', $1, $2)",
          [`${a.gymId}/logo.png`, a.userId],
        );
        expect(own.error).toBeNull();
        const other = await run(
          db,
          "insert into storage.objects (bucket_id, name, owner_id) values ('gym-logos', $1, $2)",
          [`${b.gymId}/logo.png`, a.userId],
        );
        expect(other.error?.code).toBe(PERMISSION_DENIED);
      });
    }));
});
