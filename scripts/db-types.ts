// Локал DB-ээс TypeScript төрөл үүсгэнэ: pnpm db:types
// `supabase gen types ... > file` хэлбэр нь CLI алдаа гарахад (жишээ нь Docker унтарсан) файлыг хоосолдог.
// Энд гаралтыг эхлээд шалгаад, амжилттай бол л бичнэ.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const OUT = "src/types/database.types.ts";

// Тогтмол команд (хэрэглэгчийн оролтгүй) тул shell-ээр нэг мөр болгон дамжуулна (Windows-д pnpm.cmd).
const result = spawnSync("pnpm exec supabase gen types typescript --local", {
  encoding: "utf8",
  shell: true,
  maxBuffer: 20 * 1024 * 1024,
});

if (result.status !== 0 || !result.stdout.includes("export type Database")) {
  console.error(`✗ Төрөл үүсгэж чадсангүй. ${OUT} өөрчлөгдөөгүй.`);
  console.error((result.stderr || result.stdout || "").trim().slice(0, 500));
  console.error("Локал Supabase асаалттай эсэхийг шалгана уу: pnpm db:start");
  process.exit(1);
}

writeFileSync(OUT, result.stdout);
console.log(`✓ ${OUT} шинэчлэгдлээ`);
