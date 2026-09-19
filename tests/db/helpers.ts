// DB/RLS тестийн туслахууд. Локал Supabase Postgres-т `pg`-ээр холбогдоно.
// Тест бүр транзакц дотор ажиллаж, төгсгөлд нь үргэлж ROLLBACK хийнэ: өгөгдөл үлдэхгүй.
import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";

const connectionString =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export const pool = new Pool({ connectionString, max: 4 });

export type Db = PoolClient;

export async function withTx<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const db = await pool.connect();
  try {
    await db.query("begin");
    return await fn(db);
  } finally {
    await db.query("rollback").catch(() => {});
    db.release();
  }
}

type QueryResult<T> = { rows: T[]; rowCount: number; error: null } | { rows: []; rowCount: 0; error: { code?: string; message: string } };

/**
 * Алдаа гарч болох query-г savepoint дотор ажиллуулна. Алдаа гарвал транзакц
 * тасрахгүй, харин алдааг буцаана.
 */
export async function run<T = Record<string, unknown>>(
  db: Db,
  sql: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  await db.query("savepoint t");
  try {
    const result = await db.query(sql, params);
    await db.query("release savepoint t");
    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0, error: null };
  } catch (e) {
    await db.query("rollback to savepoint t");
    const err = e as { code?: string; message: string };
    return { rows: [], rowCount: 0, error: { code: err.code, message: err.message } };
  }
}

/** auth.users-д хэрэглэгч үүсгэнэ (app.handle_new_user trigger ажиллана). */
export async function createAuthUser(
  db: Db,
  opts: { email?: string; meta?: Record<string, unknown> } = {},
): Promise<string> {
  const id = randomUUID();
  const email = opts.email ?? `${id}@test.local`;
  await db.query(
    `insert into auth.users
       (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
     values ('00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2, '',
             now(), '{"provider":"email","providers":["email"]}', $3, now(), now())`,
    [id, email, JSON.stringify(opts.meta ?? {})],
  );
  return id;
}

/** /register-ээр бүртгүүлсэнтэй адил: менежер + фитнес + туршилт. */
export async function createGymOwner(db: Db, gymName = "Тест фитнес") {
  const userId = await createAuthUser(db, {
    meta: {
      signup_type: "gym_owner",
      full_name: `${gymName} менежер`,
      gym_name: gymName,
      gym_address: "Улаанбаатар, СБД",
      gym_phone: "99112233",
    },
  });
  const { rows } = await db.query<{ gym_id: string }>(
    "select gym_id from public.gym_users where user_id = $1",
    [userId],
  );
  return { userId, gymId: rows[0].gym_id };
}

/** Фитнест багш нэмнэ (урилга хүлээн авсантай адил). */
export async function createStaff(db: Db, gymId: string, role: "manager" | "trainer" = "trainer") {
  const userId = await createAuthUser(db, { meta: { full_name: `Ажилтан ${role}` } });
  await db.query("insert into public.gym_users (gym_id, user_id, role) values ($1, $2, $3)", [
    gymId,
    userId,
    role,
  ]);
  return userId;
}

export async function createAdmin(db: Db) {
  const userId = await createAuthUser(db, { meta: { full_name: "Платформын админ" } });
  await db.query("update public.profiles set is_platform_admin = true where id = $1", [userId]);
  return userId;
}

/**
 * fn доторх query-нуудыг тухайн хэрэглэгчийн эрхээр (PostgREST-тэй адил role + JWT claims) ажиллуулна.
 * userId = null бол нэвтрээгүй (anon).
 */
export async function asUser<T>(db: Db, userId: string | null, fn: () => Promise<T>): Promise<T> {
  const claims = userId ? { sub: userId, role: "authenticated" } : { role: "anon" };
  await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
  await db.query(`set local role ${userId ? "authenticated" : "anon"}`);
  try {
    return await fn();
  } finally {
    await db.query("reset role");
    await db.query("select set_config('request.jwt.claims', '', true)");
  }
}

/** Фитнесийн платформын эрхийг өнгөрсөн болгож read-only (past_due) төлөвт оруулна. */
export async function makePastDue(db: Db, gymId: string) {
  await db.query(
    "update public.gym_subscriptions set trial_ends_at = app.today_ub() - 1, paid_until = null where gym_id = $1",
    [gymId],
  );
}

export const PERMISSION_DENIED = "42501";
