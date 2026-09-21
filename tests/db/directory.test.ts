import { describe, expect, it } from "vitest";
import { AMENITY_CODES } from "@/features/directory/amenities";
import { AREA_CODES } from "@/features/directory/areas";
import {
  asUser,
  createAdmin,
  createGymOwner,
  createStaff,
  type Db,
  insertPlan,
  makePastDue,
  PERMISSION_DENIED,
  run,
  withTx,
} from "./helpers";

const CHECK_VIOLATION = "23514";
const UNIQUE_VIOLATION = "23505";

const HOURS = {
  mon: ["07:00", "22:00"],
  tue: ["07:00", "22:00"],
  wed: ["07:00", "22:00"],
  thu: ["07:00", "22:00"],
  fri: ["07:00", "22:00"],
  sat: ["09:00", "20:00"],
  sun: null,
};

type ProfileOverrides = Partial<{
  slug: string;
  is_published: boolean;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: unknown;
  amenities: string[];
  photo_paths: string[];
  show_prices: boolean;
  facebook_url: string | null;
  contact_phone: string | null;
}>;

/** Танилцуулга үүсгэнэ (superuser-ээр, RLS-гүй). Анхдагчаар нийтлэгдсэн, байршилтай. */
async function insertProfile(db: Db, gymId: string, o: ProfileOverrides = {}) {
  await db.query(
    `insert into public.gym_profiles
       (gym_id, slug, is_published, area, latitude, longitude, opening_hours, amenities, photo_paths,
        show_prices, contact_phone, tagline, description)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Товч', 'Урт танилцуулга')`,
    [
      gymId,
      o.slug ?? `gym-${gymId.slice(0, 8)}`,
      o.is_published ?? true,
      o.area === undefined ? "ub_bayanzurkh" : o.area,
      o.latitude === undefined ? 47.92 : o.latitude,
      o.longitude === undefined ? 106.95 : o.longitude,
      JSON.stringify(o.opening_hours === undefined ? HOURS : o.opening_hours),
      o.amenities ?? ["cardio", "shower"],
      o.photo_paths ?? [],
      o.show_prices ?? true,
      o.contact_phone === undefined ? "99112233" : o.contact_phone,
    ],
  );
}

async function verify(db: Db, gymId: string) {
  await db.query("update public.gym_subscriptions set verified_at = now() where gym_id = $1", [gymId]);
}

/** Нийтлэгдсэн, баталгаажсан, туршилтын хугацаанд байгаа (= жагсаалтад гарах) фитнес. */
async function createListedGym(db: Db, name: string, o: ProfileOverrides = {}) {
  const owner = await createGymOwner(db, name);
  await insertProfile(db, owner.gymId, o);
  await verify(db, owner.gymId);
  return owner;
}

/** Жагсаалтаас зөвхөн тестэд үүсгэсэн фитнесүүдийг (локал DB-д seed өгөгдөл байж болно). */
async function listedNames(db: Db, userId: string | null, among: string[]) {
  return asUser(db, userId, async () => {
    const res = await run<{ name: string }>(db, "select name from public.list_public_gyms()");
    expect(res.error).toBeNull();
    return res.rows.map((r) => r.name).filter((n) => among.includes(n)).sort();
  });
}

describe("нийтийн жагсаалт: хэн харагдах вэ", () => {
  it("нийтэлсэн + баталгаажсан + trial/active фитнес л харагдана", () =>
    withTx(async (db) => {
      await createListedGym(db, "Нийтэлсэн");

      const unpublished = await createGymOwner(db, "Нийтлээгүй");
      await insertProfile(db, unpublished.gymId, { is_published: false });
      await verify(db, unpublished.gymId);

      const unverified = await createGymOwner(db, "Баталгаажаагүй");
      await insertProfile(db, unverified.gymId);

      const pastDue = await createListedGym(db, "Хугацаа дууссан");
      await makePastDue(db, pastDue.gymId);

      const suspended = await createListedGym(db, "Түр зогссон");
      await db.query("update public.gym_subscriptions set suspended_at = now() where gym_id = $1", [
        suspended.gymId,
      ]);

      const paid = await createListedGym(db, "Төлбөртэй");
      await db.query(
        "update public.gym_subscriptions set trial_ends_at = app.today_ub() - 30, paid_until = app.today_ub() + 10 where gym_id = $1",
        [paid.gymId],
      );

      await createGymOwner(db, "Танилцуулгагүй");

      const all = ["Нийтэлсэн", "Нийтлээгүй", "Баталгаажаагүй", "Хугацаа дууссан", "Түр зогссон", "Төлбөртэй", "Танилцуулгагүй"];
      expect(await listedNames(db, null, all)).toEqual(["Нийтэлсэн", "Төлбөртэй"]);
    }));

  it("нэвтэрсэн хэрэглэгч ч мөн ижил жагсаалт авна", () =>
    withTx(async (db) => {
      const listed = await createListedGym(db, "Нийтэлсэн");
      const hidden = await createGymOwner(db, "Нийтлээгүй");
      await insertProfile(db, hidden.gymId, { is_published: false });
      const all = ["Нийтэлсэн", "Нийтлээгүй"];
      expect(await listedNames(db, hidden.userId, all)).toEqual(["Нийтэлсэн"]);
      expect(await listedNames(db, listed.userId, all)).toEqual(["Нийтэлсэн"]);
    }));

  it("get_public_gym нь жагсаалтад ороогүй фитнесийг буцаахгүй", () =>
    withTx(async (db) => {
      await createListedGym(db, "Нийтэлсэн", { slug: "niitelsen" });
      const hidden = await createGymOwner(db, "Нийтлээгүй");
      await insertProfile(db, hidden.gymId, { slug: "niitleegui", is_published: false });
      await verify(db, hidden.gymId);

      await asUser(db, null, async () => {
        const ok = await run<{ name: string }>(db, "select name from public.get_public_gym('niitelsen')");
        expect(ok.rows).toEqual([{ name: "Нийтэлсэн" }]);
        const no = await run(db, "select * from public.get_public_gym('niitleegui')");
        expect(no.rowCount).toBe(0);
        const missing = await run(db, "select * from public.get_public_gym('baikhgui')");
        expect(missing.rowCount).toBe(0);
      });
    }));
});

describe("нийтийн өгөгдөл: юу харагдах вэ", () => {
  it("зөвхөн нийтийн баганууд (үйлчлүүлэгч, ажилтан, орлого, имэйл байхгүй)", () =>
    withTx(async (db) => {
      await createListedGym(db, "Нийтэлсэн", { slug: "niitelsen" });
      await asUser(db, null, async () => {
        const list = await run<Record<string, unknown>>(db, "select * from public.list_public_gyms() where slug = 'niitelsen'");
        expect(Object.keys(list.rows[0]).sort()).toEqual(
          [
            "address", "amenities", "area", "cover_path", "latitude", "logo_path", "longitude", "name",
            "opening_hours", "price_from", "slug", "tagline",
          ].sort(),
        );
        const one = await run<Record<string, unknown>>(db, "select * from public.get_public_gym('niitelsen')");
        expect(Object.keys(one.rows[0]).sort()).toEqual(
          [
            "address", "amenities", "area", "contact_phone", "description", "facebook_url", "instagram_url",
            "latitude", "logo_path", "longitude", "name", "opening_hours", "photo_paths", "plans",
            "show_prices", "slug", "tagline", "updated_at",
          ].sort(),
        );
      });
    }));

  it("үнэ: идэвхтэй, устгаагүй багцууд; жагсаалтад хамгийн хямд 1 сарын үнэ", () =>
    withTx(async (db) => {
      const gym = await createListedGym(db, "Үнэтэй", { slug: "unetei" });
      await insertPlan(db, gym.gymId, { name: "1 сар", months: 1, price: 90000 });
      await insertPlan(db, gym.gymId, { name: "1 сар хямдралтай", months: 1, price: 70000 });
      await insertPlan(db, gym.gymId, { name: "3 сар", months: 3, price: 240000 });
      await insertPlan(db, gym.gymId, { name: "Архивласан", months: 1, price: 10000, active: false });
      const deleted = await insertPlan(db, gym.gymId, { name: "Устгасан", months: 1, price: 5000 });
      await db.query("update public.membership_plans set deleted_at = now() where id = $1", [deleted]);

      await asUser(db, null, async () => {
        const list = await run<{ price_from: string }>(
          db,
          "select price_from from public.list_public_gyms() where slug = 'unetei'",
        );
        expect(list.rows[0].price_from).toBe("70000");
        const one = await run<{ plans: Array<{ name: string; price: number }> }>(
          db,
          "select plans from public.get_public_gym('unetei')",
        );
        expect(one.rows[0].plans.map((p) => p.name).sort()).toEqual(["1 сар", "1 сар хямдралтай", "3 сар"]);
      });
    }));

  it("үнийг нуусан бол үнэ буцаахгүй", () =>
    withTx(async (db) => {
      const gym = await createListedGym(db, "Нууц үнэ", { slug: "nuuts-une", show_prices: false });
      await insertPlan(db, gym.gymId, { months: 1, price: 90000 });
      await asUser(db, null, async () => {
        const list = await run<{ price_from: string | null }>(
          db,
          "select price_from from public.list_public_gyms() where slug = 'nuuts-une'",
        );
        expect(list.rows[0].price_from).toBeNull();
        const one = await run<{ plans: unknown[]; show_prices: boolean }>(
          db,
          "select plans, show_prices from public.get_public_gym('nuuts-une')",
        );
        expect(one.rows[0]).toEqual({ plans: [], show_prices: false });
      });
    }));
});

describe("RLS: gym_profiles хүснэгт", () => {
  it("нэвтрээгүй хүн хүснэгтийг шууд уншиж, бичиж чадахгүй", () =>
    withTx(async (db) => {
      const gym = await createListedGym(db, "Нийтэлсэн");
      await asUser(db, null, async () => {
        const read = await run(db, "select * from public.gym_profiles");
        expect(read.error?.code).toBe(PERMISSION_DENIED);
        const write = await run(db, "insert into public.gym_profiles (gym_id, slug) values ($1, 'khakher')", [
          gym.gymId,
        ]);
        expect(write.error?.code).toBe(PERMISSION_DENIED);
      });
    }));

  it("менежер өөрийн танилцуулгыг үүсгэж, засна; ажилтан уншина", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const trainer = await createStaff(db, a.gymId, "trainer");
      await asUser(db, a.userId, async () => {
        const insert = await run(
          db,
          "insert into public.gym_profiles (gym_id, slug, tagline) values ($1, 'a-fitnes', 'Сайн байна уу')",
          [a.gymId],
        );
        expect(insert.error).toBeNull();
        const update = await run(
          db,
          "update public.gym_profiles set tagline = 'Шинэ' where gym_id = $1 returning tagline",
          [a.gymId],
        );
        expect(update.rows).toEqual([{ tagline: "Шинэ" }]);
      });
      await asUser(db, trainer, async () => {
        const read = await run<{ slug: string }>(db, "select slug from public.gym_profiles");
        expect(read.rows).toEqual([{ slug: "a-fitnes" }]);
      });
    }));

  it("өөр фитнесийн танилцуулгыг үүсгэж, засаж, уншиж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      await insertProfile(db, b.gymId, { slug: "b-fitnes", is_published: false });

      await asUser(db, a.userId, async () => {
        const insert = await run(db, "insert into public.gym_profiles (gym_id, slug) values ($1, 'khuurmag')", [
          b.gymId,
        ]);
        expect(insert.error?.code).toBe(PERMISSION_DENIED);

        const update = await run(db, "update public.gym_profiles set tagline = 'Хакердсан' where gym_id = $1", [
          b.gymId,
        ]);
        expect(update.rowCount).toBe(0);

        const read = await run(db, "select * from public.gym_profiles where gym_id = $1", [b.gymId]);
        expect(read.rowCount).toBe(0);
      });
    }));

  it("багш танилцуулгыг засаж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      await insertProfile(db, a.gymId, { slug: "a-fitnes" });
      const trainer = await createStaff(db, a.gymId, "trainer");
      await asUser(db, trainer, async () => {
        const update = await run(db, "update public.gym_profiles set tagline = 'Багш' where gym_id = $1", [a.gymId]);
        expect(update.rowCount).toBe(0);
      });
    }));

  it("эрх дууссан (read-only) фитнес засаж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      await insertProfile(db, a.gymId, { slug: "a-fitnes" });
      await makePastDue(db, a.gymId);
      await asUser(db, a.userId, async () => {
        const update = await run(db, "update public.gym_profiles set tagline = 'Шинэ' where gym_id = $1", [a.gymId]);
        expect(update.rowCount).toBe(0);
      });
    }));

  it("gym_id-г солих, устгах боломжгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      await insertProfile(db, a.gymId, { slug: "a-fitnes" });
      await asUser(db, a.userId, async () => {
        const move = await run(db, "update public.gym_profiles set gym_id = $1 where gym_id = $2", [b.gymId, a.gymId]);
        expect(move.error?.code).toBe(PERMISSION_DENIED);
        const del = await run(db, "delete from public.gym_profiles where gym_id = $1", [a.gymId]);
        expect(del.error?.code).toBe(PERMISSION_DENIED);
      });
    }));

  it("админ бүх танилцуулгыг уншина", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      await insertProfile(db, a.gymId, { slug: "a-fitnes", is_published: false });
      const admin = await createAdmin(db);
      await asUser(db, admin, async () => {
        const read = await run<{ slug: string }>(db, "select slug from public.gym_profiles where gym_id = $1", [
          a.gymId,
        ]);
        expect(read.rows).toEqual([{ slug: "a-fitnes" }]);
      });
    }));
});

describe("gym_profiles шалгалтууд", () => {
  const expectRejected = async (db: Db, gymId: string, o: ProfileOverrides, code = CHECK_VIOLATION) => {
    const attempt = await run(
      db,
      `insert into public.gym_profiles (gym_id, slug, is_published, area, latitude, longitude, opening_hours,
                                        amenities, photo_paths, facebook_url)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        gymId,
        o.slug ?? "zuv-slug",
        o.is_published ?? false,
        o.area ?? null,
        o.latitude ?? null,
        o.longitude ?? null,
        o.opening_hours === undefined ? null : JSON.stringify(o.opening_hours),
        o.amenities ?? [],
        o.photo_paths ?? [],
        o.facebook_url ?? null,
      ],
    );
    expect(attempt.error?.code).toBe(code);
  };

  it("slug давхардахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      await insertProfile(db, a.gymId, { slug: "ijil-ner" });
      await expectRejected(db, b.gymId, { slug: "ijil-ner" }, UNIQUE_VIOLATION);
    }));

  it.each(["Tom", "ab", "-gym", "gym--x", "хүчит", "gym_x"])("буруу slug: %s", (slug) =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      await expectRejected(db, a.gymId, { slug });
    }),
  );

  it("байршилгүйгээр нийтлэх боломжгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      await expectRejected(db, a.gymId, { is_published: true, area: "ub_bayanzurkh" });
      await expectRejected(db, a.gymId, { is_published: true, latitude: 47.9, longitude: 106.9 });
    }));

  it("координат хосоороо, Монгол улсын нутагт", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      await expectRejected(db, a.gymId, { latitude: 47.9 });
      await expectRejected(db, a.gymId, { latitude: 39.9, longitude: 116.4 });
    }));

  it("танигдахгүй бүс, үйлчилгээ, давхардсан үйлчилгээ", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      await expectRejected(db, a.gymId, { area: "beijing" });
      await expectRejected(db, a.gymId, { amenities: ["cardio", "spaceship"] });
      await expectRejected(db, a.gymId, { amenities: ["cardio", "cardio"] });
    }));

  it.each([
    ["өдөр дутуу", { mon: ["07:00", "22:00"] }],
    ["буруу түлхүүр", { ...HOURS, sun: undefined, xyz: null }],
    ["буруу цаг", { ...HOURS, mon: ["7:00", "22:00"] }],
    ["хаах < нээх", { ...HOURS, tue: ["22:00", "07:00"] }],
    ["гурван утга", { ...HOURS, wed: ["07:00", "12:00", "22:00"] }],
    ["тоо", { ...HOURS, thu: [7, 22] }],
    ["массив", []],
  ])("буруу цагийн хуваарь: %s", (_label, hours) =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      await expectRejected(db, a.gymId, { opening_hours: hours });
    }),
  );

  it("24:00 хүртэл ба амралтын өдөр зөвшөөрөгдөнө", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      await insertProfile(db, a.gymId, { opening_hours: { ...HOURS, fri: ["00:00", "24:00"], sat: null } });
    }));

  it("зураг зөвхөн өөрийн хавтсаас, 8 хүртэл", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      await expectRejected(db, a.gymId, { photo_paths: [`${b.gymId}/photo-1758000000000.jpg`] });
      await expectRejected(db, a.gymId, { photo_paths: [`${a.gymId}/../x.jpg`] });
      const nine = Array.from({ length: 9 }, (_, i) => `${a.gymId}/photo-175800000000${i}.jpg`);
      await expectRejected(db, a.gymId, { photo_paths: nine });
      await insertProfile(db, a.gymId, { photo_paths: nine.slice(0, 8) });
    }));

  it("Facebook холбоос зөвхөн facebook.com", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      await expectRejected(db, a.gymId, { facebook_url: "https://evil.example.com/facebook.com/x" });
      await expectRejected(db, a.gymId, { facebook_url: "javascript:alert(1)" });
    }));

  it("TS-ийн бүс, үйлчилгээний жагсаалт DB-тэй яг ижил", () =>
    withTx(async (db) => {
      const { rows } = await db.query<{ areas: string[]; amenities: string[] }>(
        "select app.directory_areas() as areas, app.directory_amenities() as amenities",
      );
      expect(rows[0].areas).toEqual([...AREA_CODES]);
      expect(rows[0].amenities).toEqual([...AMENITY_CODES]);
    }));
});

describe("Storage: gym-photos", () => {
  it("менежер зөвхөн өөрийн фитнесийн хавтаст зураг байршуулна, багш байршуулахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      const trainer = await createStaff(db, a.gymId, "trainer");
      const upload = (path: string, owner: string) =>
        run(db, "insert into storage.objects (bucket_id, name, owner_id) values ('gym-photos', $1, $2)", [
          path,
          owner,
        ]);

      await asUser(db, a.userId, async () => {
        expect((await upload(`${a.gymId}/photo-1758000000000.jpg`, a.userId)).error).toBeNull();
        expect((await upload(`${b.gymId}/photo-1758000000000.jpg`, a.userId)).error?.code).toBe(PERMISSION_DENIED);
      });
      await asUser(db, trainer, async () => {
        expect((await upload(`${a.gymId}/photo-1758000000001.jpg`, trainer)).error?.code).toBe(PERMISSION_DENIED);
      });
    }));
});
