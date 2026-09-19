// Туршилтын өгөгдөл. Зөвхөн ЛОКАЛ Supabase дээр ажиллана.
//   pnpm db:reset && pnpm db:seed
// Бүх огноо "өнөөдөр"-өөс харьцангуй тул хэзээ ажиллуулсан бүх төлөв (идэвхтэй, дуусах гэж буй,
// дууссан, туршилт, анхааруулга) харагдана.
import { addDaysISO, todayUB } from "../src/lib/dates";
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
      .update({
        trial_ends_at: addDaysISO(today, -60),
        paid_until: addDaysISO(today, gym.subscription.paidDaysLeft),
        platform_plan_id: plans.get(gym.subscription.plan) ?? null,
        verified_at: new Date().toISOString(),
      })
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

  const trainerLogins: string[] = [];
  for (const [index, gym] of GYMS.entries()) {
    const rng = createRng(1000 + index);
    const { gymId, managerId } = await seedGym(supabase, gym, plans, today);
    const trainers = await seedTrainers(supabase, index, gymId);
    const clientIds = await seedClients(supabase, rng, gymId, managerId, trainers.map((t) => t.id));
    for (const t of trainers) if (t.email) trainerLogins.push(`  ${t.email.padEnd(20)} — ${gym.name} багш (${t.name})`);
    console.log(`✓ ${gym.name}: ${trainers.length} багш, ${clientIds.length} үйлчлүүлэгч`);
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
