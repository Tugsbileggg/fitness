// Supabase CLOUD төсөлтэй ажиллах командууд. `.env.cloud.local`-ээс тохиргоо уншина.
//   pnpm cloud:link      — төсөлтэй холбох (supabase link)
//   pnpm cloud:push:dry  — ажиллах migration-уудыг харах
//   pnpm cloud:push      — migration-уудыг cloud DB-д ажиллуулах
//   pnpm cloud:check     — тохиргоо бүрэн эсэхийг шалгах
//   pnpm cloud:auth      — Auth тохиргоо (Site URL, redirect, нууц үг ≥ 8, холбоос 24 цаг,
//                          өөрийн SMTP тохируулсан бол монгол имэйл загварууд)
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

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

/**
 * Supabase Management API-аар Auth тохируулна. Site URL = NEXT_PUBLIC_SITE_URL.
 * Үнэгүй багцад өөрийн SMTP-гүй бол имэйл загвар өөрчлөх боломжгүй тул тэр үед загварыг алгасна
 * (апп анхдагч англи загвартай ч ажиллана: /auth/confirm ба /auth/callback).
 */
async function configureAuth() {
  requireVars(["SUPABASE_PROJECT_REF", "SUPABASE_ACCESS_TOKEN"]);
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const url = `https://api.supabase.com/v1/projects/${process.env.SUPABASE_PROJECT_REF}/config/auth`;
  const headers = { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" };

  const current = await fetch(url, { headers });
  if (!current.ok) fail(`Auth тохиргоо уншихад алдаа: ${current.status}`);
  const config = (await current.json()) as { smtp_host: string | null };

  const allow = [...new Set([`${site}/**`, "http://localhost:3000/**", "http://127.0.0.1:3000/**"])];
  const body: Record<string, unknown> = {
    site_url: site,
    uri_allow_list: allow.join(","),
    password_min_length: 8,
    mailer_otp_exp: 86400,
    mailer_autoconfirm: false,
  };
  if (config.smtp_host) {
    const tpl = (name: string) => readFileSync(`supabase/templates/${name}.html`, "utf8");
    Object.assign(body, {
      mailer_subjects_confirmation: "Имэйл хаягаа баталгаажуулна уу",
      mailer_templates_confirmation_content: tpl("confirmation"),
      mailer_subjects_invite: "Таныг фитнесийн системд урьж байна",
      mailer_templates_invite_content: tpl("invite"),
      mailer_subjects_recovery: "Нууц үг сэргээх",
      mailer_templates_recovery_content: tpl("recovery"),
    });
  }

  const res = await fetch(url, { method: "PATCH", headers, body: JSON.stringify(body) });
  if (!res.ok) fail(`Auth тохиргоо хадгалахад алдаа: ${res.status} ${(await res.text()).slice(0, 200)}`);
  console.log(`✓ Site URL: ${site}`);
  console.log(`✓ Redirect URLs: ${allow.join(", ")}`);
  console.log("✓ Нууц үг ≥ 8 тэмдэгт, имэйлийн холбоос 24 цаг");
  console.log(
    config.smtp_host
      ? "✓ Монгол имэйл загварууд (баталгаажуулах, урилга, нууц үг сэргээх)"
      : "! Өөрийн SMTP тохируулаагүй тул имэйл загвар англиар үлдлээ. SMTP тохируулсны дараа дахин ажиллуулна уу.",
  );
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
  case "auth":
    configureAuth().catch((e) => fail(String(e)));
    break;
  default:
    fail("Хэрэглээ: tsx scripts/cloud.ts <check|link|push|auth> [--dry-run]");
}
