// Туршилтын өгөгдөл. Зөвхөн ЛОКАЛ Supabase дээр ажиллана.
//   pnpm db:reset && pnpm db:seed
// Бүх огноо "өнөөдөр"-өөс харьцангуй тул хэзээ ажиллуулсан бүх төлөв (идэвхтэй, дуусах гэж буй,
// дууссан, туршилт, анхааруулга) харагдана.
import { addDaysISO, todayUB } from "../src/lib/dates";
import { adminClient, findUserByEmail, type AdminClient } from "./lib";

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

  for (const gym of GYMS) {
    await seedGym(supabase, gym, plans, today);
    console.log(`✓ ${gym.name} (${gym.manager.email})`);
  }

  console.log(`\nБүх хэрэглэгчийн нууц үг: ${PASSWORD}`);
  console.log("  admin@demo.test      — платформын админ");
  for (const gym of GYMS) console.log(`  ${gym.manager.email.padEnd(20)} — ${gym.name} менежер`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
