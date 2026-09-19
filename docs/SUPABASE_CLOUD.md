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
`supabase/migrations` доторх бүх файл нэг удаа л ажиллана, Supabase аль нь ажилласныг өөрөө хянадаг.

## 3. Dashboard дээрх Auth тохиргоо

Эдгээр тохиргоо migration-д ордоггүй тул гараар хийнэ.

1. **Authentication → URL Configuration**
   - *Site URL*: одоохондоо `http://localhost:3000`. Deploy хийсний дараа production домэйн болгоно.
   - *Redirect URLs*: `http://localhost:3000/**`. Дараа нь `https://<домэйн>/**`-ийг нэмнэ.
2. **Authentication → Sign In / Providers → Email**
   - *Confirm email*: асаалттай.
   - *Minimum password length*: `8`.
   - *Email OTP Expiration*: `86400` (урилгын холбоос 24 цаг хүчинтэй).
3. **Authentication → Emails → Templates**. `supabase/templates/`-ээс хуулна:

   | Загвар | Subject | Файл |
   |---|---|---|
   | Confirm signup | Имэйл хаягаа баталгаажуулна уу | `confirmation.html` |
   | Invite user | Таныг фитнесийн системд урьж байна | `invite.html` |
   | Reset password | Нууц үг сэргээх | `recovery.html` |

4. **Authentication → Emails → SMTP Settings.** Өөрийн SMTP-г (жишээ нь Resend, Mailgun) заавал тохируулна.
   Supabase-ийн анхдагч SMTP нь цагт хэдхэн имэйл илгээдэг. Мөн зөвхөн төслийн багийн гишүүдийн хаяг руу илгээдэг тул багшид урилга хүрэхгүй.

## 4. Платформын админ үүсгэх

```bash
pnpm cloud:admin admin@таны-домэйн.mn "Хүчтэй-Нууц-Үг-123"
```

## 5. Аппыг cloud өгөгдлийн сантай ажиллуулах

```bash
pnpm dev:cloud     # http://localhost:3000, гэхдээ cloud Supabase-тэй
```

`pnpm db:seed` нь зөвхөн локал дээр ажиллана. Cloud-д туршилтын өгөгдөл санамсаргүй орохгүй.

## Анхаарах зүйл

- `SUPABASE_SECRET_KEY` нь RLS-ийг тойрдог. Browser, git, чат руу хэзээ ч бүү гарга.
- Cloud түлхүүрийг `.env.local`-д бүү хий. `pnpm dev` локал Supabase-тэй ажилласаар байх ёстой.
- Vercel-д deploy хийх заавар 5-р үе шатанд README-д нэмэгдэнэ.
