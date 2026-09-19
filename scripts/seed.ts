// Туршилтын өгөгдөл. Зөвхөн ЛОКАЛ Supabase дээр ажиллана.
//   pnpm db:reset && pnpm db:seed
// Бүх огноо "өнөөдөр"-өөс харьцангуй тул хэзээ ажиллуулсан бүх төлөв (идэвхтэй, дуусах гэж буй,
// дууссан, туршилт, анхааруулга) харагдана.
import { createClient } from "@supabase/supabase-js";
import { addDaysISO, addMonthsISO, todayUB } from "../src/lib/dates";
import type { Database } from "../src/types/database.types";
import { adminClient, findUserByEmail, type AdminClient } from "./lib";
import { clientNote, createRng, mongolianName, phoneNumber, type Rng, TRAINER_PROFILES } from "./seed-data";

const CLIENTS_PER_GYM = 40;
const TRAINERS_PER_GYM = 3;
/** Нэвтрэх эрхтэй багшийн тоо (бусад нь зөвхөн бүртгэл). */
const TRAINERS_WITH_LOGIN = 2;

const PASSWORD = process.env.SEED_PASSWORD || "Demo12345";

type SeedGym = {
  key: string;
  name: string;
  address: string;
  phone: string;
  manager: { email: string; name: string };
  /** Платформын эрх: active = төлсөн, trial = туршилт (дуусахад N хоног үлдсэн). */
  subscription: { kind: "active"; paidDaysLeft: number; plan: string } | { kind: "trial"; daysLeft: number };
};

const GYMS: SeedGym[] = [
  {
    key: "khuchit",
    name: "Хүчит фитнес",
    address: "Улаанбаатар, Баянзүрх дүүрэг, 26-р хороо, Их Монгол улсын гудамж 12",
    phone: "77112233",
    manager: { email: "manager1@demo.test", name: "Батбаяр Ганзориг" },
    subscription: { kind: "active", paidDaysLeft: 20, plan: "Стандарт" },
  },
  {
    key: "erch",
    name: "Эрч хүч спорт клуб",
    address: "Улаанбаатар, Сүхбаатар дүүрэг, 1-р хороо, Энхтайваны өргөн чөлөө 45",
    phone: "88223344",
    manager: { email: "manager2@demo.test", name: "Сарангэрэл Должин" },
    subscription: { kind: "trial", daysLeft: 4 },
  },
];

const PLATFORM_PLANS = [
  { name: "Эхлэл", description: "Шинээр нээгдсэн жижиг заалуудад", max_clients: 100, monthly_price: 49000, sort_order: 1 },
  { name: "Стандарт", description: "Ихэнх фитнесүүдэд тохиромжтой", max_clients: 300, monthly_price: 99000, sort_order: 2 },
  { name: "Про", description: "Олон багштай, том фитнес", max_clients: null, monthly_price: 149000, sort_order: 3 },
];

function assertLocal() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url)) {
    throw new Error(`Seed зөвхөн локал Supabase дээр ажиллана. Одоогийн URL: ${url}`);
  }
}

async function createUser(supabase: AdminClient, email: string, metadata: Record<string, unknown>) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw new Error(`${email}: ${error.message}`);
  return data.user.id;
}

async function seedPlatform(supabase: AdminClient) {
  const adminId = await createUser(supabase, "admin@demo.test", { full_name: "Платформын админ" });
  await supabase.from("profiles").update({ is_platform_admin: true }).eq("id", adminId).throwOnError();

  const { data: plans } = await supabase
    .from("platform_plans")
    .insert(PLATFORM_PLANS)
    .select("id, name")
    .throwOnError();
  return { adminId, plans: new Map(plans.map((p) => [p.name, p.id])) };
}

async function seedGym(supabase: AdminClient, gym: SeedGym, plans: Map<string, string>, today: string) {
  // /register-тэй адил metadata → DB trigger фитнес, менежер, туршилтыг үүсгэнэ.
  const managerId = await createUser(supabase, gym.manager.email, {
    signup_type: "gym_owner",
    full_name: gym.manager.name,
    gym_name: gym.name,
    gym_address: gym.address,
    gym_phone: gym.phone,
  });
  const { data: membership } = await supabase
    .from("gym_users")
    .select("gym_id")
    .eq("user_id", managerId)
    .single()
    .throwOnError();
  const gymId = membership.gym_id;

  if (gym.subscription.kind === "active") {
    await supabase
      .from("gym_subscriptions")
      // 2 сарын өмнө бүртгүүлсэн; төлбөрүүдийг main() доор админы эрхээр RPC-ээр бүртгэнэ.
      .update({ trial_ends_at: addDaysISO(today, -60), verified_at: new Date().toISOString() })
      .eq("gym_id", gymId)
      .throwOnError();
  } else {
    await supabase
      .from("gym_subscriptions")
      .update({ trial_ends_at: addDaysISO(today, gym.subscription.daysLeft) })
      .eq("gym_id", gymId)
      .throwOnError();
  }

  return { gymId, managerId };
}

async function seedTrainers(supabase: AdminClient, gymIndex: number, gymId: string) {
  const trainers: { id: string; email: string | null; name: string }[] = [];
  for (let i = 0; i < TRAINERS_PER_GYM; i++) {
    const profile = TRAINER_PROFILES[gymIndex * TRAINERS_PER_GYM + i];
    const email = i < TRAINERS_WITH_LOGIN ? `trainer${gymIndex + 1}.${i + 1}@demo.test` : null;
    const { data: trainer } = await supabase
      .from("trainers")
      .insert({
        gym_id: gymId,
        full_name: profile.name,
        phone: `9${gymIndex + 1}0${i + 1}1122`.slice(0, 8),
        specialization: profile.specialization,
        email,
      })
      .select("id")
      .single()
      .throwOnError();

    if (email) {
      // Урилга хүлээн авч нууц үгээ тохируулсан багштай адил.
      const userId = await createUser(supabase, email, { full_name: profile.name });
      await supabase.from("gym_users").insert({ gym_id: gymId, user_id: userId, role: "trainer" }).throwOnError();
      await supabase
        .from("trainers")
        .update({ user_id: userId, invited_at: new Date().toISOString() })
        .eq("id", trainer.id)
        .throwOnError();
    }
    trainers.push({ id: trainer.id, email, name: profile.name });
  }
  return trainers;
}

async function seedClients(
  supabase: AdminClient,
  rng: Rng,
  gymId: string,
  createdBy: string,
  trainerIds: string[],
) {
  const usedPhones = new Set<string>();
  const rows = Array.from({ length: CLIENTS_PER_GYM }, () => {
    const gender = rng.chance(0.55) ? ("female" as const) : ("male" as const);
    return {
      gym_id: gymId,
      full_name: mongolianName(rng, gender),
      phone: phoneNumber(rng, usedPhones),
      gender,
      birth_year: rng.int(1968, 2008),
      assigned_trainer_id: rng.chance(0.7) ? rng.pick(trainerIds) : null,
      notes: clientNote(rng),
      created_by: createdBy,
    };
  });
  const { data } = await supabase.from("clients").insert(rows).select("id").throwOnError();
  return data.map((c) => c.id);
}

const GYM_PLANS = [
  { name: "1 сар", duration_months: 1, price: 80000 },
  { name: "3 сар", duration_months: 3, price: 210000 },
  { name: "6 сар", duration_months: 6, price: 390000 },
  { name: "1 жил", duration_months: 12, price: 720000 },
];

/**
 * Платформын төлбөрийг админаар (admin_record_platform_payment RPC) бүртгэнэ:
 * 45 хоногийн өмнө 1 сар, дараа нь хэдэн хоног хоцорч дахин 1 сар → эрх өнөөдрөөс paidDaysLeft хоног.
 */
async function seedPlatformPayments(admin: Payer, gymId: string, planId: string, today: string, paidDaysLeft: number) {
  const secondPaidOn = addMonthsISO(addDaysISO(today, paidDaysLeft), -1);
  for (const paidOn of [addDaysISO(today, -45), secondPaidOn]) {
    const { error } = await admin.rpc("admin_record_platform_payment", {
      p_gym_id: gymId,
      p_plan_id: planId,
      p_months: 1,
      p_amount: 99000,
      p_paid_on: paidOn,
      p_method: "bank_transfer",
      p_note: "Дансаар шилжүүлсэн",
    });
    if (error) throw new Error(`admin_record_platform_payment: ${error.message}`);
  }
}

async function seedPlans(supabase: AdminClient, gymId: string) {
  const { data } = await supabase
    .from("membership_plans")
    .insert(GYM_PLANS.map((p, i) => ({ ...p, gym_id: gymId, sort_order: i })))
    .select("id, duration_months")
    .throwOnError();
  return new Map(data.map((p) => [p.duration_months, p.id]));
}

/** Хэрэглэгчээр нэвтэрсэн client: төлбөрийг бодит RPC-ээр (RLS, эрхийн шалгалттай) бүртгэнэ. */
async function signedInClient(email: string) {
  const client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`${email}: ${error.message}`);
  return client;
}

type Payer = Awaited<ReturnType<typeof signedInClient>>;
type PaymentPlan = { months: number; paidOn: string; discount?: { type: "amount" | "percent"; value: number } };

/**
 * Үйлчлүүлэгч бүрт төлөвийн хуваарилалт (40 үйлчлүүлэгч):
 *  0–3   эрхгүй · 4–11 дууссан (1–28 хоногийн өмнө) · 12–19 дуусах гэж буй (0–7 хоног)
 *  20–39 идэвхтэй (энэ сарын шинэ/сунгалт, урт хугацааны, хөнгөлөлттэй)
 */
function paymentScenario(index: number, today: string, rng: Rng): PaymentPlan[] {
  const monthAgo = addMonthsISO(today, -1);
  const expiredDays = [1, 2, 4, 6, 9, 13, 20, 28];
  if (index < 4) return [];
  if (index < 12) {
    const d = expiredDays[index - 4];
    const last = { months: 1, paidOn: addDaysISO(monthAgo, -d) };
    // Заримд нь өмнөх сунгалтын түүх.
    return index % 3 === 0 ? [{ months: 1, paidOn: addDaysISO(addMonthsISO(today, -2), -d) }, last] : [last];
  }
  if (index < 20) {
    const daysLeft = index - 12;
    const last: PaymentPlan = { months: 1, paidOn: addDaysISO(monthAgo, daysLeft) };
    return index % 2 === 0 ? [{ months: 3, paidOn: addDaysISO(addMonthsISO(today, -4), daysLeft) }, last] : [last];
  }
  const thisMonthDay = () => addDaysISO(today, -rng.int(0, Number(today.slice(8, 10)) - 1));
  const discount = rng.chance(0.25)
    ? rng.chance(0.5)
      ? { type: "percent" as const, value: rng.pick([10, 15, 20]) }
      : { type: "amount" as const, value: rng.pick([5000, 10000, 20000]) }
    : undefined;
  switch (index % 4) {
    case 0: // энэ сард шинээр
      return [{ months: rng.pick([1, 3]), paidOn: thisMonthDay(), discount }];
    case 1: // идэвхтэй байхдаа энэ сард сунгасан
      return [
        { months: 3, paidOn: addDaysISO(addMonthsISO(today, -3), rng.int(3, 12)) },
        { months: rng.pick([1, 3, 6]), paidOn: thisMonthDay(), discount },
      ];
    case 2: // урт хугацааны
      return [{ months: rng.pick([6, 12]), paidOn: addDaysISO(addMonthsISO(today, -rng.int(1, 4)), -rng.int(0, 20)), discount }];
    default: // өнгөрсөн сард авсан 3 сарын эрх
      return [{ months: 3, paidOn: addDaysISO(monthAgo, -rng.int(0, 15)) }];
  }
}

async function seedPayments(
  rng: Rng,
  today: string,
  clientIds: string[],
  plans: Map<number, string>,
  manager: Payer,
  trainer: Payer | null,
) {
  let count = 0;
  for (const [index, clientId] of clientIds.entries()) {
    for (const p of paymentScenario(index, today, rng)) {
      const payer = trainer && rng.chance(0.25) ? trainer : manager;
      const { error } = await payer.rpc("record_payment", {
        p_client_id: clientId,
        p_plan_id: plans.get(p.months)!,
        p_paid_on: p.paidOn,
        p_method: rng.chance(0.6) ? "cash" : "bank_transfer",
        p_discount_type: p.discount?.type ?? "none",
        p_discount_value: p.discount?.value ?? 0,
      });
      if (error) throw new Error(`record_payment (${index}): ${error.message}`);
      count++;
    }
  }
  return count;
}

const NOTICE_NOTES = ["Утсаар хэлсэн", "Биечлэн хэлсэн, сунгана гэсэн", null];

/** Дуусах гэж буй зарим үйлчлүүлэгчид "Мэдэгдсэн" тэмдэглэл (менежерийн эрхээр, RLS-тэй). */
async function seedNotices(rng: Rng, gymId: string, manager: Payer) {
  const { data, error } = await manager
    .from("client_status_v")
    .select("id, ends_on")
    .eq("gym_id", gymId)
    .in("status", ["expiring", "expired"])
    .order("days_left");
  if (error) throw error;
  const picks = (data ?? []).filter((_, i) => i % 3 === 1);
  for (const row of picks) {
    const { error: insertError } = await manager.from("client_notices").insert({
      gym_id: gymId,
      client_id: row.id!,
      ends_on: row.ends_on!,
      note: rng.pick(NOTICE_NOTES),
    });
    if (insertError) throw insertError;
  }
  return picks.length;
}

async function main() {
  const supabase = adminClient();
  assertLocal();

  if (await findUserByEmail(supabase, "admin@demo.test")) {
    console.error("Seed өгөгдөл аль хэдийн байна. Эхлээд `pnpm db:reset` ажиллуулна уу.");
    process.exit(1);
  }

  const today = todayUB();
  const { plans } = await seedPlatform(supabase);
  console.log(`✓ Платформын админ ба ${plans.size} тариф`);

  const admin = await signedInClient("admin@demo.test");
  const trainerLogins: string[] = [];
  for (const [index, gym] of GYMS.entries()) {
    const rng = createRng(1000 + index);
    const { gymId, managerId } = await seedGym(supabase, gym, plans, today);
    if (gym.subscription.kind === "active") {
      await seedPlatformPayments(admin, gymId, plans.get(gym.subscription.plan)!, today, gym.subscription.paidDaysLeft);
    }
    const trainers = await seedTrainers(supabase, index, gymId);
    const clientIds = await seedClients(supabase, rng, gymId, managerId, trainers.map((t) => t.id));
    const gymPlans = await seedPlans(supabase, gymId);
    const manager = await signedInClient(gym.manager.email);
    const trainerEmail = trainers.find((t) => t.email)?.email;
    const trainer = trainerEmail ? await signedInClient(trainerEmail) : null;
    const paymentCount = await seedPayments(rng, today, clientIds, gymPlans, manager, trainer);
    await seedNotices(rng, gymId, manager);
    for (const t of trainers) if (t.email) trainerLogins.push(`  ${t.email.padEnd(20)} — ${gym.name} багш (${t.name})`);
    console.log(`✓ ${gym.name}: ${trainers.length} багш, ${clientIds.length} үйлчлүүлэгч, ${gymPlans.size} багц, ${paymentCount} төлбөр`);
  }

  console.log(`\nБүх хэрэглэгчийн нууц үг: ${PASSWORD}`);
  console.log("  admin@demo.test      — платформын админ");
  for (const gym of GYMS) console.log(`  ${gym.manager.email.padEnd(20)} — ${gym.name} менежер`);
  for (const line of trainerLogins) console.log(line);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
