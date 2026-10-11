# Төслийн одоогийн байдал (2026.10.11)

Энэ файл нь шинэ чат/сешн ажлыг үргэлжлүүлэхэд хэрэгтэй бүх мэдээллийг агуулна.
Дэлгэрэнгүйг [README.md](../README.md), [docs/PLAN.md](PLAN.md), [docs/SUPABASE_CLOUD.md](SUPABASE_CLOUD.md)-ээс.

## Юу хийгдсэн

MVP-ийн 5 үе шат + 6-р үе шат ("Фитнес хайх": нийтийн танилцуулга, байршлаар хайх). Commit-ууд:

| Commit | Агуулга |
|---|---|
| `373585b` | Суурь: Next 16, TS 6, Tailwind 4, shadcn, Vitest, Supabase CLI, мөнгө/огноо/утасны туслахууд |
| `8aed265` | Нэвтрэлт ба multi-tenant суурь (RLS, бүртгэлийн trigger, app shell) |
| `16ddfae` | Багш (урилга) ба үйлчлүүлэгч (хайлт, soft delete) |
| `3458e35` | Эрхийн багц, төлбөр, `record_payment`/`void_payment` |
| `ef7b0b6` | Хяналтын самбар, "Мэдэгдсэн", `client_status_v`, тохиргоо |
| `c96f2cc` | Платформын төлбөр, админ самбар, "Миний бүртгэл" |
| `1df3731` | Supabase-ийн анхдагч имэйл загварын дэмжлэг, `pnpm cloud:auth` |
| `9e3dff8` | `pnpm cloud:plans` (тариф cloud-д) |
| `7d44e1c` | Proxy дутуу env хувьсагчийг нэрээр нь хэлдэг болсон (Vercel-ийн 500) |
| `1e9cf34` | 6-р үе шат: `gym_profiles`, `/gyms`, `/gyms/[slug]`, `/listing`, газрын зураг, жишээ фитнесүүд |
| `c75dc02`…`86fce1f` | "Volt" дүр төрх: токен, фонт, нүүр хуудас, самбар, үйлчлүүлэгчид, хөдөлгөөн, арын зураг |
| (сүүлийнх) | Функцийн бүс `icn1`, монгол 404/алдааны хуудас, icon/OG зураг, robots/sitemap |

Тест: 144 unit + 132 DB/RLS. `pnpm lint`, `typecheck`, `test`, `test:db`, `build` бүгд давдаг.

## Локал орчин

```bash
pnpm install && pnpm db:start && pnpm db:reset && pnpm db:seed && pnpm dev
```

Туршилтын хэрэглэгчид (нууц үг `Demo12345`): `admin@demo.test`, `manager1@demo.test`, `manager2@demo.test`,
багш нар, жишээ фитнесийн менежерүүд `gym.<key>@demo.test` (README-д бүрэн жагсаалт). Имэйл: http://127.0.0.1:54324

## Cloud / Vercel төлөв

Supabase төсөл: `hflpfpamiwhxriwbngcg` (Seoul). Vercel: https://fitness-pi-opal-62.vercel.app
GitHub: https://github.com/Tugsbileggg/fitness (**public** — `.env*` git-д ордоггүй, түүх шалгасан, цэвэр).

Хийгдсэн:
- Migration 01–06 (06 = "Фитнес хайх", 2026.09.21-нд push хийсэн), тарифууд (Эхлэл / Стандарт / Про),
  платформын админ (хэрэглэгч өөрөө үүсгэсэн).
- `pnpm cloud:auth`: Site URL = `https://fitness-pi-opal-62.vercel.app`, redirect allow-list шинэчлэгдсэн.
- `pnpm cloud:demo`: 7 жишээ фитнес нийтэд харагдана (утасгүй, нэвтрэх эрхгүй менежер, туршилт 1 жил).
  Бодит фитнесүүд нэгдмэгц `pnpm cloud:demo --unpublish`.
- `.env.cloud.local`: дансны мэдээлэл түр хуурамч (`5012345678`, "Фитнес Хяналт ХХК", `77001122`) — бодит данс
  гармагц солих (Vercel-ийн хувьсагчид мөн).

- Vercel env (2026.10.11): 9-р сарын 20-нд "Secret" төрлөөр нэмсэн утгууд **хоосон** байсан (build ба runtime
  хоёуланд `NEXT_PUBLIC_SUPABASE_URL` олдохгүй). `NEXT_PUBLIC_*` гуравыг **Config** төрлөөр (утга нь харагдана)
  дахин нэмж, `SUPABASE_SECRET_KEY`-г Secret хэвээр шинэчилсэн. `PLATFORM_*` дөрөв Vercel дээр **алга**.
- Функцийн бүс `vercel.json`-д `icn1`. Өмнө нь `iad1` (Вашингтон) байсан тул `/gyms/[slug]` ~2 секунд байв.

Ажиллагааг бүрэн явуулахад дутуу (чухлаас нь):
1. **SMTP + домэйн** — Supabase-ийн анхдагч SMTP зөвхөн багийн гишүүдэд илгээдэг, `mailer_autoconfirm: false`
   тул **бодит хэрэглэгч бүртгэлээ баталгаажуулж чадахгүй**, нууц үг сэргээх, багш урих ч ажиллахгүй.
   Домэйн → Resend → Supabase SMTP → `pnpm cloud:auth` (монгол загвар). Хэрэглэгч домэйнийг "дараа шийднэ".
2. **`PLATFORM_*` (дансны мэдээлэл)** Vercel-д — эс бөгөөс `/billing` дээр данс харагдахгүй. Хэрэглэгч өөрөө оруулна.
3. **Нууцлалын бодлого, үйлчилгээний нөхцөл**, бүртгэлд зөвшөөрөл (хууль зүйн хяналттай).
4. **Бүртгэлийн spam хамгаалалт** — Supabase Auth captcha (Cloudflare Turnstile).
5. **Түлхүүр солих** — secret key, access token өмнөх чатад харагдсан. Анхаар: `.env.cloud.local`-ийн
   `SUPABASE_SECRET_KEY` (хуучин JWT `eyJ…`) ба `.env.vercel.local`-ийнх (`sb_secret_…`) **ялгаатай**
   (10:17-нд `.env.cloud.local` өөрчлөгдсөн) — аль нь хүчинтэйг шалгаж нэгтгэх.
6. **Төлбөртэй багц** — Vercel Hobby арилжааны хэрэглээг зөвшөөрдөггүй (Pro). Supabase Free: нөөцлөлтгүй,
   7 хоног идэвхгүй бол зогсдог (Pro).
7. **Нээлтийн өдөр** — `pnpm cloud:demo --unpublish`.

Үргэлжилсэн дүрэм: шинэ migration-тэй код бол эхлээд `pnpm cloud:push`, дараа нь `git push`.

## Санаж байх шийдвэрүүд

- **TypeScript 6.0.3** (7.0 биш): `typescript-eslint` TS 7-г дэмжихгүй. **ESLint 9** (10 биш): Next-ийн
  plugin-ууд дэмжээгүй. Хоёулаа дэмжигдмэгц шинэчилнэ.
- **Эрхийн хугацаа:** 09.19-нд 1 сар → 10.19 хүртэл. Идэвхтэй үед сунгавал дуусах огнооноос үргэлжилнэ.
  Тооцоо SQL-д (`app.compute_period`), TS хуулбар (`src/lib/membership.ts`) нь маягтын урьдчилсан
  харагдацад зориулагдсан. Хоёулаа `tests/fixtures/membership-cases.ts`-ээр шалгагддаг.
- **Төлөв хадгалдаггүй:** үйлчлүүлэгчийн болон платформын эрхийн төлөвийг огнооноос тооцдог (cron хэрэггүй).
- **Бичих эрх:** `client_memberships`, `payments`, `platform_payments`, `gym_subscriptions`-д зөвхөн
  `SECURITY DEFINER` RPC бичнэ. Хүснэгтэд шууд INSERT/UPDATE эрх байхгүй.
- **Багш** `payments`-ийг уншихгүй. **Админ** үйлчлүүлэгчийн хувийн мэдээллийг харахгүй.
- **Soft delete** зөвхөн: `deleted_at` / `voided_at` / `is_active`. DELETE эрх хэнд ч байхгүй.
- **Огноо:** бизнесийн огноо `YYYY-MM-DD` мөр. `new Date("YYYY-MM-DD")` хэрэглэхгүй.
  "Өнөөдөр" = `todayUB()` / `app.today_ub()`.
- **Нийлмэл FK** `(gym_id, x_id)` нь tenant хооронд холбоос үүсгэхээс хамгаална.
- **"Фитнес хайх"** (PLAN.md §7.6):
  - Нэвтрээгүй хүн зөвхөн `list_public_gyms` / `get_public_gym` RPC-ээр. Хүснэгтийг шууд уншихгүй.
  - Жагсаалтад: нийтэлсэн + **админ баталгаажуулсан** + эрх `trial`/`active`. Баталгаажуулалт одоо бодит үүрэгтэй
    (өмнө нь зөвхөн тэмдэглэл байсан).
  - Хэрэглэгчийн байршил зөвхөн хөтөч дээр (sessionStorage). Нийтийн утсыг менежер тусад нь оруулна.
  - Газрын зураг OpenStreetMap tile (`src/features/directory/components/leaflet.ts`). Ачаалал өсвөл
    арилжааны tile үйлчилгээ рүү `TILE_URL`-ийг солих.
  - Бүс (дүүрэг/аймаг), үйлчилгээний жагсаалт SQL (`app.directory_areas/amenities`) ба TS-д хоёуланд.
    Тест нийцлийг шалгадаг.

## Анхаарах онцлогууд (өмнө нь тулгарсан)

- **Имэйлийн холбоос 3 хэлбэртэй:** монгол загвар `token_hash`, анхдагч загвар PKCE `?code=`,
  админы урилга `#access_token`. Гурвууланг `/auth/confirm` ба `/auth/callback` хоёр хариуцна.
  Анхдагч загвартай үед PKCE холбоосыг хүсэлт илгээсэн ижил хөтөч дээр нээх шаардлагатай.
- **Устгагдсан хэрэглэгчийн cookie** үлдвэл `/auth/signout` руу чиглүүлж цэвэрлэдэг (redirect гогцооноос).
- **`payments.seq`** (identity) нь "хамгийн сүүлийн төлбөр"-ийг тодорхойлно; `created_at` нэг транзакцад ижил байдаг.
- **DB нууц үг солиход** pooler 1-2 минутын дараа шинэчлэгддэг.
- **Docker Desktop** анх удаа лицензийн нөхцөл зөвшөөрөх шаардлагатай, эс бөгөөс хөдөлгүүр асахгүй.
- **Docker "backend crashed … .sock: rename … cannot be accessed"** (компьютер Docker-ийг хаалгүй унтрахад).
  "Reset to factory defaults" тусалхгүй. Quit хийгээд `%LOCALAPPDATA%/Docker/run` ба
  `%LOCALAPPDATA%/docker-secrets-engine` хавтсуудын нэрийг солиод дахин асаана (socket файлыг устгах боломжгүй).
- **`supabase link`-ийн дараа** CLI cloud-ийн хувилбаруудыг `supabase/.temp/`-д бичдэг. Локал storage-api хуучин
  хэвээр бол лого/зураг оруулахад `42P10` гарна: `pnpm db:stop && pnpm db:start`.
- **`revalidatePath` + route group:** динамик хуудсыг файлын бүтцийн замаар (`/(public)/gyms`, "layout")
  шинэчилнэ. `/gyms/[slug]` гэвэл tag таарахгүй (production-д шалгасан).
- **`NEXT_PUBLIC_*`** build-ийн үед кодод шигддэг: Vercel дээр хувьсагч нэмсний дараа заавал redeploy.
- Хөтчийн хэрэгслээр Enter дарахад маягт илгээгддэггүй (хэрэгслийн онцлог, кодын алдаа биш).

## Хийгдээгүй

Мобайл апп, QPay (enum-д `qpay` утга бэлэн), SMS/Messenger сануулга, ирц бүртгэл (check-in),
үйлчлүүлэгчийн нэвтрэлт, Playwright e2e тест, бүртгэлийн rate limit/captcha.
"Фитнес хайх"-д: үнэлгээ/сэтгэгдэл, онлайн бүртгүүлэх, хичээлийн хуваарь.
