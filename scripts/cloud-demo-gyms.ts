// "Фитнес хайх"-ийн жишээ фитнесүүдийг Supabase CLOUD дээр үүсгэх / нуух.
//   pnpm cloud:demo --dry-run    — юу болохыг харуулна, юу ч бичихгүй
//   pnpm cloud:demo              — үүсгэнэ (байгаа бол алгасна)
//   pnpm cloud:demo --unpublish  — бүх жишээ фитнесийг нийтээс нууна (устгахгүй)
//   pnpm cloud:demo --publish    — буцааж нийтэлнэ
// Жишээ фитнесүүд (scripts/demo-gyms.ts) зохиомол. Менежерүүд нь нууц үггүй тул нэвтрэх боломжгүй,
// утасны дугаар нийтэд харагдахгүй (зохиомол дугаар бодит хүнийх байж болно). Туршилтын хугацааг
// 1 жил болгоно: эс бөгөөс 14 хоногийн дараа past_due болж жагсаалтаас алга болно.
import { addDaysISO, todayUB } from "../src/lib/dates";
import { createDirectoryGym, demoManagerEmail, DIRECTORY_GYMS } from "./demo-gyms";
import { adminClient, describeTarget, findUserByEmail } from "./lib";

const DEMO_TRIAL_DAYS = 365;

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const toggle = args.has("--unpublish") ? false : args.has("--publish") ? true : null;

  const target = describeTarget();
  if (target.isLocal) {
    throw new Error(`Энэ скрипт зөвхөн cloud дээр ажиллана. Локал дээр "pnpm db:seed" ашиглана уу. (${target.url})`);
  }
  const supabase = adminClient();
  console.log(`Өгөгдлийн сан: ${target.url}${dryRun ? "  (--dry-run: юу ч бичихгүй)" : ""}\n`);

  for (const gym of DIRECTORY_GYMS) {
    const existing = await findUserByEmail(supabase, demoManagerEmail(gym));

    if (toggle !== null) {
      if (!existing) {
        console.log(`  - ${gym.name}: үүсээгүй`);
        continue;
      }
      const { data: member } = await supabase
        .from("gym_users")
        .select("gym_id")
        .eq("user_id", existing.id)
        .single()
        .throwOnError();
      if (!dryRun) {
        await supabase.from("gym_profiles").update({ is_published: toggle }).eq("gym_id", member.gym_id).throwOnError();
      }
      console.log(`  ${dryRun ? "~" : "✓"} ${gym.name}: ${toggle ? "нийтэлнэ" : "нуух"}`);
      continue;
    }

    if (existing) {
      console.log(`  = ${gym.name}: аль хэдийн байна`);
      continue;
    }
    if (dryRun) {
      console.log(`  + ${gym.name} — ${gym.address}`);
      continue;
    }
    const gymId = await createDirectoryGym(supabase, gym, { contactPhone: false });
    await supabase
      .from("gym_subscriptions")
      .update({ trial_ends_at: addDaysISO(todayUB(), DEMO_TRIAL_DAYS) })
      .eq("gym_id", gymId)
      .throwOnError();
    console.log(`  ✓ ${gym.name}`);
  }

  console.log(
    dryRun
      ? "\n--dry-run дууслаа."
      : toggle === null
        ? "\n✓ Жишээ фитнесүүд бэлэн. Бодит фитнесүүд нэгдмэгц `pnpm cloud:demo --unpublish`-ээр нууна."
        : "\n✓ Дууслаа. Нийтийн хуудас 5 минутын дотор шинэчлэгдэнэ.",
  );
}

main().catch((e) => {
  console.error(`✗ ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
