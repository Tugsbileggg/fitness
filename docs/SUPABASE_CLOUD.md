# Supabase Cloud төсөлтэй холбох заавар

Хөгжүүлэлт локал Supabase (Docker) дээр явагдана (`pnpm dev` → `.env.local`).
Cloud төслийн тохиргоо тусдаа `.env.cloud.local` файлд байх тул хоёулаа зэрэг ажиллана.
Энэ файл git-д орохгүй.

## 1. `.env.cloud.local`-ийг бөглөх

| Хувьсагч | Хаанаас авах |
|---|---|
| `SUPABASE_PROJECT_REF` | Dashboard URL: `supabase.com/dashboard/project/<ref>` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys → Publishable key (`sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | Project Settings → API Keys → Secret keys (`sb_secret_…`) |
| `SUPABASE_DB_PASSWORD` | Төсөл үүсгэхэд өгсөн нууц үг. Мартсан бол Project Settings → Database → Reset database password |
| `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens → Generate new token (`sbp_…`) |

Бөглөсний дараа зөв эсэхийг шалгана:

```bash
pnpm cloud:check
```

## 2. Төсөлтэй холбож, өгөгдлийн сангийн бүтцийг үүсгэх

```bash
pnpm cloud:link          # нэг удаа
pnpm cloud:push:dry      # ямар migration ажиллахыг урьдчилан харна (юу ч өөрчлөхгүй)
pnpm cloud:push          # migration-уудыг cloud DB-д ажиллуулна
```

`SUPABASE_ACCESS_TOKEN`-ийг хоосон орхисон бол эхлээд `pnpm exec supabase login` командаар нэвтэрнэ.
Шинэ үе шат бүрт migration нэмэгдэх тул тухай бүр `pnpm cloud:push`-ийг дахин ажиллуулна.
**Шинэ migration-тэй кодыг GitHub руу push хийхээс өмнө** ажиллуулна: Vercel build-ийн үед `/gyms` хуудас
cloud DB-ээс уншдаг тул migration дутуу бол build унана.

`pnpm cloud:link`-ийн дараа CLI нь cloud-ийн үйлчилгээний хувилбаруудыг `supabase/.temp/`-д бичиж, локал стекийг
тэдгээртэй ижил болгодог. Локал стек link хийхээс өмнө ассан бол `pnpm db:stop && pnpm db:start` хийнэ
(эс бөгөөс локал дээр лого/зураг оруулахад `42P10` алдаа гарна).
`supabase/migrations` доторх бүх файл нэг удаа л ажиллана, Supabase аль нь ажилласныг өөрөө хянадаг.

## 3. Auth тохиргоо

```bash
pnpm cloud:auth
```

Энэ команд Management API-аар дараах тохиргоог хийнэ:
- Site URL: `.env.cloud.local` дахь `NEXT_PUBLIC_SITE_URL`.
- Redirect URL-ууд.
- Нууц үгийн доод урт 8.
- Имэйлийн холбоос 24 цаг хүчинтэй.
- Имэйл баталгаажуулалт асаалттай.

Deploy хийгээд домэйн солигдох бүрт `NEXT_PUBLIC_SITE_URL`-ийг шинэчлээд дахин ажиллуулна.

**Имэйл ба SMTP.** Supabase-ийн анхдагч SMTP-д хоёр хязгаарлалт бий:
- Цагт 2 имэйл, зөвхөн төслийн багийн гишүүдийн хаяг руу илгээнэ. Бусад фитнес, багшид имэйл хүрэхгүй.
- Үнэгүй багцад өөрийн SMTP-гүй бол имэйл загварыг өөрчлөх боломжгүй. Иймд имэйлүүд англиар очно.

Жинхэнэ хэрэглэгчидтэй ажиллахын өмнө:
1. **Authentication → Emails → SMTP Settings** хэсэгт өөрийн SMTP-г (Resend, Mailgun гэх мэт) тохируулна.
2. `pnpm cloud:auth`-ийг дахин ажиллуулна. SMTP тохируулагдсан бол монгол загварууд (`supabase/templates/`) автоматаар орно.
3. **Authentication → Rate Limits** хэсэгт имэйлийн хязгаарыг нэмэгдүүлнэ.

Апп анхдагч англи загвартай ч ажиллана:
- Бүртгэл баталгаажуулах болон нууц үг сэргээх холбоос `/auth/confirm?code=…` руу очно.
- Багшийн урилга `/auth/callback` руу очно.
- Анхдагч загвар ашиглаж байгаа үед бүртгүүлсэн эсвэл нууц үг сэргээх хүсэлт илгээсэн **ижил хөтөч** дээр холбоосыг нээх шаардлагатай. Өөр төхөөрөмж дээр нээвэл имэйл баталгаажна, гэхдээ хэрэглэгч өөрөө нэвтэрнэ. Монгол загварт ийм хязгаарлалт байхгүй.

## 4. Платформын админ үүсгэх

```bash
pnpm cloud:admin admin@таны-домэйн.mn "Хүчтэй-Нууц-Үг-123"
```

## 5. Тарифууд үүсгэх

```bash
pnpm cloud:plans --dry-run   # юу үүсэхийг харна, юу ч бичихгүй
pnpm cloud:plans             # үүсгэнэ
```

Багцууд `scripts/platform-plans.ts`-д байна (локал seed мөн эндээс уншина). Нэрээр нь тааруулдаг тул
дахин ажиллуулахад давхардахгүй, зөвхөн шинэчлэгдэнэ. Дараа нь админ `/admin/plans` дээрээс засна.

**Тариф заавал хэрэгтэй:** нүүр хуудасны "Үнийн санал" хэсэг `platform_plans`-аас уншдаг тул
тарифгүй бол хоосон гарна.

## 6. Жишээ фитнесүүд ("Фитнес хайх", заавал биш)

```bash
pnpm cloud:demo --dry-run    # юу үүсэхийг харна
pnpm cloud:demo              # 7 зохиомол фитнес (УБ, Дархан, Эрдэнэт)
pnpm cloud:demo --unpublish  # бодит фитнесүүд нэгдмэгц нуух (устгахгүй)
```

Жишээ фитнесүүдийн менежер нууц үггүй (нэвтрэх боломжгүй), нийтэд утас харагдахгүй. Туршилтын хугацааг 1 жил
болгодог (эс бөгөөс 14 хоногийн дараа жагсаалтаас алга болно).

## 7. Аппыг cloud өгөгдлийн сантай ажиллуулах

```bash
pnpm dev:cloud     # http://localhost:3000, гэхдээ cloud Supabase-тэй
```

`pnpm db:seed` нь зөвхөн локал дээр ажиллана. Cloud-д туршилтын өгөгдөл санамсаргүй орохгүй.

## Анхаарах зүйл

- `SUPABASE_SECRET_KEY` нь RLS-ийг тойрдог. Browser, git, чат руу хэзээ ч бүү гарга.
- Cloud түлхүүрийг `.env.local`-д бүү хий. `pnpm dev` локал Supabase-тэй ажилласаар байх ёстой.
- Vercel-д deploy хийх заавар: README.md-ийн "Deploy" хэсэг.
