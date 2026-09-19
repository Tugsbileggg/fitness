// Supabase CLOUD төсөлтэй ажиллах командууд. `.env.cloud.local`-ээс тохиргоо уншина.
//   pnpm cloud:link      — төсөлтэй холбох (supabase link)
//   pnpm cloud:push:dry  — ажиллах migration-уудыг харах
//   pnpm cloud:push      — migration-уудыг cloud DB-д ажиллуулах
//   pnpm cloud:check     — тохиргоо бүрэн эсэхийг шалгах
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const ENV_FILE = ".env.cloud.local";

function loadCloudEnv() {
  if (!existsSync(ENV_FILE)) {
    fail(`${ENV_FILE} файл олдсонгүй. .env.example-ийн cloud хэсгийг харна уу.`);
  }
  process.loadEnvFile(ENV_FILE);
}

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function requireVars(names: string[]) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) fail(`${ENV_FILE} дотор дараах утгууд хоосон байна: ${missing.join(", ")}`);
}

function check() {
  requireVars([
    "SUPABASE_PROJECT_REF",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SECRET_KEY",
  ]);
  const ref = process.env.SUPABASE_PROJECT_REF!;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (url !== `https://${ref}.supabase.co`) {
    fail(`NEXT_PUBLIC_SUPABASE_URL нь https://${ref}.supabase.co байх ёстой (одоо: ${url})`);
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!.startsWith("sb_publishable_")) {
    fail("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY нь sb_publishable_... хэлбэртэй байх ёстой");
  }
  if (!process.env.SUPABASE_SECRET_KEY!.startsWith("sb_secret_")) {
    fail("SUPABASE_SECRET_KEY нь sb_secret_... хэлбэртэй байх ёстой");
  }
  console.log(`✓ ${ENV_FILE} бүрэн байна (төсөл: ${ref})`);
}

function supabase(args: string[]) {
  // CLI нь SUPABASE_ACCESS_TOKEN, SUPABASE_DB_PASSWORD орчны хувьсагчийг өөрөө уншина.
  const result = spawnSync("pnpm", ["exec", "supabase", ...args], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  process.exit(result.status ?? 1);
}

loadCloudEnv();
const command = process.argv[2];

switch (command) {
  case "check":
    check();
    break;
  case "link":
    requireVars(["SUPABASE_PROJECT_REF", "SUPABASE_DB_PASSWORD"]);
    supabase(["link", "--project-ref", process.env.SUPABASE_PROJECT_REF!]);
    break;
  case "push":
    requireVars(["SUPABASE_DB_PASSWORD"]);
    supabase(["db", "push", ...process.argv.slice(3)]);
    break;
  default:
    fail("Хэрэглээ: tsx scripts/cloud.ts <check|link|push> [--dry-run]");
}
