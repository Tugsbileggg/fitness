// Платформын анхны тарифуудыг Supabase CLOUD дээр үүсгэнэ.
//   pnpm cloud:plans            — үүсгэнэ (нэр давхцвал шинэчилнэ, давхардуулахгүй)
//   pnpm cloud:plans --dry-run  — юу болохыг харуулна, юу ч бичихгүй
// Cloud дээр `pnpm db:seed` ажиллахгүй тул анхны тарифуудыг эндээс тавина.
// Тарифгүй үед нүүр хуудасны "Үнийн санал" хэсэг хоосон гарна.
import { formatMNT } from "../src/lib/money";
import { adminClient, describeTarget } from "./lib";
import { PLATFORM_PLANS } from "./platform-plans";

function describePlan(plan: (typeof PLATFORM_PLANS)[number]) {
  const limit = plan.max_clients ? `${plan.max_clients} хүртэл үйлчлүүлэгч` : "хязгааргүй үйлчлүүлэгч";
  return `${formatMNT(plan.monthly_price)} / сар, ${limit}`;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const target = describeTarget();
  if (target.isLocal) {
    throw new Error(
      `Энэ скрипт зөвхөн cloud дээр ажиллана. Локал дээр "pnpm db:seed" ашиглана уу. (одоогийн URL: ${target.url})`,
    );
  }
  const supabase = adminClient();
  console.log(`Өгөгдлийн сан: ${target.url}${dryRun ? "  (--dry-run: юу ч бичихгүй)" : ""}\n`);

  const { data: existing } = await supabase.from("platform_plans").select("id, name").throwOnError();
  const byName = new Map(existing.map((p) => [p.name, p.id]));

  for (const plan of PLATFORM_PLANS) {
    const id = byName.get(plan.name);
    if (dryRun) {
      console.log(`  ${id ? "~" : "+"} ${plan.name} — ${describePlan(plan)} ${id ? "(шинэчилнэ)" : "(нэмнэ)"}`);
      continue;
    }
    if (id) await supabase.from("platform_plans").update(plan).eq("id", id).throwOnError();
    else await supabase.from("platform_plans").insert(plan).throwOnError();
    console.log(`  ✓ ${plan.name} — ${describePlan(plan)}`);
  }

  console.log(
    dryRun
      ? "\n--dry-run дууслаа. Бодитоор үүсгэхийн тулд --dry-run-гүйгээр ажиллуулна уу."
      : "\n✓ Тарифууд бэлэн. Админаар нэвтэрч /admin/plans дээрээс засаж болно.",
  );
}

main().catch((e) => {
  console.error(`✗ ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
