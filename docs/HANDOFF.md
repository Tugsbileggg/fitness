# Төслийн одоогийн байдал (2026.09.20)

Энэ файл нь шинэ чат/сешн ажлыг үргэлжлүүлэхэд хэрэгтэй бүх мэдээллийг агуулна.
Дэлгэрэнгүйг [README.md](../README.md), [docs/PLAN.md](PLAN.md), [docs/SUPABASE_CLOUD.md](SUPABASE_CLOUD.md)-ээс.

## Юу хийгдсэн

Төлөвлөгөөний 5 үе шат бүгд дууссан. Commit-ууд:

| Commit | Агуулга |
|---|---|
| `373585b` | Суурь: Next 16, TS 6, Tailwind 4, shadcn, Vitest, Supabase CLI, мөнгө/огноо/утасны туслахууд |
| `8aed265` | Нэвтрэлт ба multi-tenant суурь (RLS, бүртгэлийн trigger, app shell) |
| `16ddfae` | Багш (урилга) ба үйлчлүүлэгч (хайлт, soft delete) |
| `3458e35` | Эрхийн багц, төлбөр, `record_payment`/`void_payment` |
| `ef7b0b6` | Хяналтын самбар, "Мэдэгдсэн", `client_status_v`, тохиргоо |
| `c96f2cc` | Платформын төлбөр, админ самбар, "Миний бүртгэл" |
| `1df3731` | Supabase-ийн анхдагч имэйл загварын дэмжлэг, `pnpm cloud:auth` |

Тест: 56 unit + 97 DB/RLS. `pnpm check`, `pnpm test:db`, `pnpm build` бүгд давдаг.

## Локал орчин

```bash
pnpm install && pnpm db:start && pnpm db:reset && pnpm db:seed && pnpm dev
```

Туршилтын хэрэглэгчид (нууц үг `Demo12345`): `admin@demo.test`, `manager1@demo.test`,
`manager2@demo.test`, `trainer1.1@demo.test`, `trainer1.2@demo.test` (README-д бүрэн жагсаалт).
Имэйлүүд Mailpit-д: http://127.0.0.1:54324

## Supabase Cloud төлөв

Төсөл: `hflpfpamiwhxriwbngcg` ("Fitness Project", Seoul, Postgres 17.6). Тохиргоо `.env.cloud.local`-д
(git-д ордоггүй). Командууд: `pnpm cloud:check | cloud:link | cloud:push:dry | cloud:push | cloud:auth | cloud:admin`.

Хийгдсэн:
- 5 migration бүгд ажилласан. 12 хүснэгт RLS-тэй, trigger ба `gym-logos` bucket бий.
- Auth: Site URL `http://localhost:3000`, redirect allow-list, нууц үг ≥ 8, холбоос 24 цаг.
- DB нууц үгийг шинэчилж `.env.cloud.local`-д хадгалсан.

Хийгдээгүй (дараагийн ажил):
1. **Cloud админ үүсгэх:** `pnpm cloud:admin <имэйл> "<нууц үг>"`.
2. **Өөрийн SMTP** (Resend гэх мэт) тохируулаад `pnpm cloud:auth` дахин ажиллуулах. Үүнгүйгээр:
   - имэйл цагт 2 удаа, зөвхөн багийн гишүүдэд очно;
   - үнэгүй багцад имэйл загвар англиар үлдэнэ.
3. **Тарифууд:** админаар нэвтэрч `/admin/plans` дээр үүсгэх (cloud дээр seed ажиллахгүй).
4. **Vercel deploy:** README-гийн "Deploy" хэсэг. Домэйн солигдох бүрт `NEXT_PUBLIC_SITE_URL`-ийг
   шинэчлээд `pnpm cloud:auth`.
5. **Түлхүүр солих (зөвлөмж):** secret key болон access token өмнөх чатын түүхэнд харагдсан.

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

## Анхаарах онцлогууд (өмнө нь тулгарсан)

- **Имэйлийн холбоос 3 хэлбэртэй:** монгол загвар `token_hash`, анхдагч загвар PKCE `?code=`,
  админы урилга `#access_token`. Гурвууланг `/auth/confirm` ба `/auth/callback` хоёр хариуцна.
  Анхдагч загвартай үед PKCE холбоосыг хүсэлт илгээсэн ижил хөтөч дээр нээх шаардлагатай.
- **Устгагдсан хэрэглэгчийн cookie** үлдвэл `/auth/signout` руу чиглүүлж цэвэрлэдэг (redirect гогцооноос).
- **`payments.seq`** (identity) нь "хамгийн сүүлийн төлбөр"-ийг тодорхойлно; `created_at` нэг транзакцад ижил байдаг.
- **DB нууц үг солиход** pooler 1-2 минутын дараа шинэчлэгддэг.
- **Docker Desktop** анх удаа лицензийн нөхцөл зөвшөөрөх шаардлагатай, эс бөгөөс хөдөлгүүр асахгүй.
- Хөтчийн хэрэгслээр Enter дарахад маягт илгээгддэггүй (хэрэгслийн онцлог, кодын алдаа биш).

## MVP-д ороогүй

Мобайл апп, QPay (enum-д `qpay` утга бэлэн), SMS/Messenger сануулга, ирц бүртгэл (check-in),
үйлчлүүлэгчийн нэвтрэлт, Playwright e2e тест, бүртгэлийн rate limit/captcha.
