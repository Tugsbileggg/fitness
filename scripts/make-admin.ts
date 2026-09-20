// Платформын админ үүсгэх эсвэл одоо байгаа хэрэглэгчийг админ болгох.
//   pnpm admin:create admin@example.mn "НууцҮг123"
// Хэрэглэгч байхгүй бол нууц үгээр шинээр үүсгэнэ (имэйл баталгаажсан төлөвтэй).
import { adminClient, describeTarget, findUserByEmail } from "./lib";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email) {
    console.error('Хэрэглээ: pnpm admin:create <имэйл> ["нууц үг"]');
    process.exit(1);
  }

  // Аль сан руу бичиж байгааг үргэлж харуулна: локал ба cloud хоёрыг андуурахаас сэргийлнэ.
  console.log(`Өгөгдлийн сан: ${describeTarget().url}`);
  const supabase = adminClient();
  let user = await findUserByEmail(supabase, email);

  if (!user) {
    if (!password || password.length < 8) {
      console.error("Шинэ админ үүсгэхэд 8-аас дээш тэмдэгттэй нууц үг өгнө үү.");
      process.exit(1);
    }
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Платформын админ" },
    });
    if (error) throw error;
    user = data.user;
    console.log(`Шинэ хэрэглэгч үүслээ: ${email}`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_platform_admin: true })
    .eq("id", user.id);
  if (error) throw error;

  console.log(`✓ ${email} одоо платформын админ боллоо.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
