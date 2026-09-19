import { describe, expect, it } from "vitest";
import {
  asUser,
  createGymOwner,
  createStaff,
  type Db,
  makePastDue,
  PERMISSION_DENIED,
  run,
  withTx,
} from "./helpers";

const FK_VIOLATION = "23503";

async function insertTrainer(db: Db, gymId: string, name = "Багш") {
  const { rows } = await db.query<{ id: string }>(
    "insert into public.trainers (gym_id, full_name, phone) values ($1, $2, '99001122') returning id",
    [gymId, name],
  );
  return rows[0].id;
}

async function insertClient(db: Db, gymId: string, name = "Үйлчлүүлэгч", trainerId: string | null = null) {
  const { rows } = await db.query<{ id: string }>(
    `insert into public.clients (gym_id, full_name, phone, gender, birth_year, assigned_trainer_id)
     values ($1, $2, '88112233', 'female', 1995, $3) returning id`,
    [gymId, name, trainerId],
  );
  return rows[0].id;
}

const CLIENT_INSERT =
  "insert into public.clients (gym_id, full_name, phone, gender, birth_year, assigned_trainer_id) values ($1, $2, '99112233', 'male', 1990, $3)";

describe("үйлчлүүлэгч: tenant тусгаарлалт", () => {
  it("менежер өөр фитнесийн үйлчлүүлэгч, багшийг харахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      await insertClient(db, a.gymId, "А-гийн үйлчлүүлэгч");
      await insertClient(db, b.gymId, "Б-гийн үйлчлүүлэгч");
      await insertTrainer(db, b.gymId, "Б-гийн багш");

      await asUser(db, a.userId, async () => {
        const clients = await run<{ full_name: string }>(db, "select full_name from public.clients");
        expect(clients.rows.map((r) => r.full_name)).toEqual(["А-гийн үйлчлүүлэгч"]);
        const trainers = await run(db, "select id from public.trainers");
        expect(trainers.rows).toHaveLength(0);
      });
    }));

  it("өөр фитнесийн gym_id-аар үйлчлүүлэгч нэмж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      await asUser(db, a.userId, async () => {
        const res = await run(db, CLIENT_INSERT, [b.gymId, "Хуурамч", null]);
        expect(res.error?.code).toBe(PERMISSION_DENIED);
      });
    }));

  it("өөр фитнесийн багшийг хариуцсан багш болгож чадахгүй (нийлмэл FK)", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      const bTrainer = await insertTrainer(db, b.gymId, "Б-гийн багш");
      const aTrainer = await insertTrainer(db, a.gymId, "А-гийн багш");
      const aClient = await insertClient(db, a.gymId);

      await asUser(db, a.userId, async () => {
        const insert = await run(db, CLIENT_INSERT, [a.gymId, "Шинэ", bTrainer]);
        expect(insert.error?.code).toBe(FK_VIOLATION);

        const update = await run(db, "update public.clients set assigned_trainer_id = $1 where id = $2", [bTrainer, aClient]);
        expect(update.error?.code).toBe(FK_VIOLATION);

        const ok = await run(db, CLIENT_INSERT, [a.gymId, "Зөв", aTrainer]);
        expect(ok.error).toBeNull();
      });
    }));

  it("өөр фитнесийн үйлчлүүлэгчийг засаж, устгаж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      const bClient = await insertClient(db, b.gymId, "Б-гийн үйлчлүүлэгч");
      await asUser(db, a.userId, async () => {
        const edit = await run(db, "update public.clients set full_name = 'Хакер' where id = $1", [bClient]);
        expect(edit.rowCount).toBe(0);
        const del = await run(db, "update public.clients set deleted_at = now() where id = $1", [bClient]);
        expect(del.rowCount).toBe(0);
        const hard = await run(db, "delete from public.clients where id = $1", [bClient]);
        expect(hard.error?.code).toBe(PERMISSION_DENIED);
      });
      const check = await db.query("select full_name, deleted_at from public.clients where id = $1", [bClient]);
      expect(check.rows[0]).toEqual({ full_name: "Б-гийн үйлчлүүлэгч", deleted_at: null });
    }));

  it("үйлчлүүлэгчийг өөр фитнес рүү шилжүүлж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      const aClient = await insertClient(db, a.gymId);
      await asUser(db, a.userId, async () => {
        const res = await run(db, "update public.clients set gym_id = $1 where id = $2", [b.gymId, aClient]);
        expect(res.error?.code).toBe(PERMISSION_DENIED);
      });
    }));

  it("нэвтрээгүй хэрэглэгч юу ч харахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      await insertClient(db, a.gymId);
      await asUser(db, null, async () => {
        expect((await run(db, "select * from public.clients")).error?.code).toBe(PERMISSION_DENIED);
        expect((await run(db, "select * from public.trainers")).error?.code).toBe(PERMISSION_DENIED);
      });
    }));
});

describe("багш ба менежерийн эрхийн ялгаа", () => {
  it("багш үйлчлүүлэгч нэмж, засна; устгаж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const trainer = await createStaff(db, a.gymId, "trainer");
      const clientId = await insertClient(db, a.gymId);

      await asUser(db, trainer, async () => {
        expect((await run(db, CLIENT_INSERT, [a.gymId, "Багшийн нэмсэн", null])).error).toBeNull();
        const edit = await run(db, "update public.clients set notes = 'Өвдөгний бэртэлтэй' where id = $1", [clientId]);
        expect(edit.rowCount).toBe(1);
        const del = await run(db, "update public.clients set deleted_at = now() where id = $1", [clientId]);
        expect(del.error?.code).toBe(PERMISSION_DENIED);
      });
    }));

  it("менежер soft delete хийнэ, deleted_by автоматаар бичигдэнэ", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const clientId = await insertClient(db, a.gymId);
      await asUser(db, a.userId, async () => {
        const del = await run(db, "update public.clients set deleted_at = now() where id = $1", [clientId]);
        expect(del.rowCount).toBe(1);
      });
      const row = await db.query("select deleted_at is not null as deleted, deleted_by from public.clients where id = $1", [clientId]);
      expect(row.rows[0]).toEqual({ deleted: true, deleted_by: a.userId });
    }));

  it("багш багшийн бүртгэлийг нэмж, засаж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const trainer = await createStaff(db, a.gymId, "trainer");
      const trainerRecord = await insertTrainer(db, a.gymId);
      await asUser(db, trainer, async () => {
        const insert = await run(db, "insert into public.trainers (gym_id, full_name, phone) values ($1, 'Шинэ', '99112233')", [a.gymId]);
        expect(insert.error?.code).toBe(PERMISSION_DENIED);
        const update = await run(db, "update public.trainers set full_name = 'Өөрчилсөн' where id = $1", [trainerRecord]);
        expect(update.rowCount).toBe(0);
        const seen = await run(db, "select id from public.trainers");
        expect(seen.rows).toHaveLength(1);
      });
    }));

  it("менежер ч багшид дурын хэрэглэгчийн эрх холбож чадахгүй (user_id)", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      const trainerRecord = await insertTrainer(db, a.gymId);
      await asUser(db, a.userId, async () => {
        const res = await run(db, "update public.trainers set user_id = $1 where id = $2", [b.userId, trainerRecord]);
        expect(res.error?.code).toBe(PERMISSION_DENIED);
      });
    }));

  it("багшийг идэвхгүй болгоход нэвтрэх эрх нь хаагдана, идэвхжүүлэхэд сэргэнэ", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const trainerUser = await createStaff(db, a.gymId, "trainer");
      const trainerRecord = await insertTrainer(db, a.gymId, "Нэвтэрдэг багш");
      await db.query("update public.trainers set user_id = $1 where id = $2", [trainerUser, trainerRecord]);
      await insertClient(db, a.gymId);

      await asUser(db, a.userId, async () => {
        await run(db, "update public.trainers set is_active = false where id = $1", [trainerRecord]);
      });
      await asUser(db, trainerUser, async () => {
        expect((await run(db, "select id from public.clients")).rows).toHaveLength(0);
      });

      await asUser(db, a.userId, async () => {
        await run(db, "update public.trainers set is_active = true where id = $1", [trainerRecord]);
      });
      await asUser(db, trainerUser, async () => {
        expect((await run(db, "select id from public.clients")).rows).toHaveLength(1);
      });
    }));

  it("trainer_accounts зөвхөн тухайн фитнесийн менежерт мэдээлэл өгнө", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db, "А фитнес");
      const b = await createGymOwner(db, "Б фитнес");
      const trainerUser = await createStaff(db, a.gymId, "trainer");
      const trainerRecord = await insertTrainer(db, a.gymId);
      await db.query("update public.trainers set user_id = $1 where id = $2", [trainerUser, trainerRecord]);

      await asUser(db, a.userId, async () => {
        const res = await run(db, "select * from public.trainer_accounts($1)", [a.gymId]);
        expect(res.rows).toHaveLength(1);
      });
      await asUser(db, b.userId, async () => {
        const res = await run(db, "select * from public.trainer_accounts($1)", [a.gymId]);
        expect(res.rows).toHaveLength(0);
      });
      await asUser(db, trainerUser, async () => {
        const res = await run(db, "select * from public.trainer_accounts($1)", [a.gymId]);
        expect(res.rows).toHaveLength(0);
      });
    }));
});

describe("read-only фитнес", () => {
  it("эрх дууссан үед үйлчлүүлэгч, багш харна, нэмж засаж чадахгүй", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      const clientId = await insertClient(db, a.gymId);
      await insertTrainer(db, a.gymId);
      await makePastDue(db, a.gymId);

      await asUser(db, a.userId, async () => {
        expect((await run(db, "select id from public.clients")).rows).toHaveLength(1);
        expect((await run(db, "select id from public.trainers")).rows).toHaveLength(1);
        expect((await run(db, CLIENT_INSERT, [a.gymId, "Шинэ", null])).error?.code).toBe(PERMISSION_DENIED);
        const edit = await run(db, "update public.clients set notes = 'x' where id = $1", [clientId]);
        expect(edit.rowCount).toBe(0);
        const trainer = await run(db, "insert into public.trainers (gym_id, full_name, phone) values ($1, 'Шинэ', '99112233')", [a.gymId]);
        expect(trainer.error?.code).toBe(PERMISSION_DENIED);
      });
    }));
});

describe("хайлт", () => {
  it("кирилл нэрээр том жижиг үсэг ялгахгүй хайна", () =>
    withTx(async (db) => {
      const a = await createGymOwner(db);
      await insertClient(db, a.gymId, "Өлзийсайхан Батболд");
      await insertClient(db, a.gymId, "Дорж Ганбат");
      await asUser(db, a.userId, async () => {
        const res = await run<{ full_name: string }>(
          db,
          "select full_name from public.clients where full_name ilike $1",
          ["%өлзий%"],
        );
        expect(res.rows.map((r) => r.full_name)).toEqual(["Өлзийсайхан Батболд"]);
      });
    }));
});
