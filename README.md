# Фитнес Хяналт

Монголын жижиг фитнесүүдэд зориулсан бүртгэл, хяналтын multi-tenant SaaS платформ (MVP).
Бүтээх төлөвлөгөө: [docs/PLAN.md](docs/PLAN.md).

> Энэ README-г үе шат бүрт шинэчилнэ. Deploy-ийн бүрэн заавар 5-р үе шатанд нэмэгдэнэ.

## Шаардлагатай программууд

| Программ | Хувилбар | Тайлбар |
|---|---|---|
| Node.js | 24 LTS (≥22) | https://nodejs.org |
| pnpm | 11 | `corepack enable` эсвэл `npm i -g pnpm` |
| Docker Desktop | сүүлийн хувилбар | Локал Supabase-д хэрэгтэй (Windows дээр WSL2 идэвхжүүлнэ) |

Supabase CLI нь төслийн devDependency тул тусад нь суулгах шаардлагагүй (`pnpm exec supabase ...`).

## Локал орчинд ажиллуулах

```bash
pnpm install
cp .env.example .env.local        # Windows PowerShell: Copy-Item .env.example .env.local
pnpm db:start                     # Docker дээр Postgres, Auth, Studio, Mailpit асна (анх удаа удаан)
pnpm db:status                    # Publishable/Secret key-г .env.local-д хуулна
pnpm dev                          # http://localhost:3000
```

Локал хаягууд:

- Апп: http://localhost:3000
- Supabase Studio (өгөгдлийн сан харах): http://127.0.0.1:54323
- Mailpit (илгээсэн имэйлүүд): http://127.0.0.1:54324

## Скриптүүд

| Команд | Үйлдэл |
|---|---|
| `pnpm dev` | Хөгжүүлэлтийн сервер |
| `pnpm build` / `pnpm start` | Production build ба ажиллуулах |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript шалгалт |
| `pnpm test` | Unit тестүүд (Docker шаардлагагүй) |
| `pnpm test:db` | Өгөгдлийн сан ба RLS тестүүд (локал Supabase асаалттай байх ёстой) |
| `pnpm check` | lint + typecheck + unit тест |
| `pnpm db:start` / `pnpm db:stop` | Локал Supabase асаах/унтраах |
| `pnpm db:reset` | Өгөгдлийн санг цэвэрлэж, бүх migration-ийг дахин ажиллуулах |
| `pnpm db:types` | Өгөгдлийн сангаас TypeScript төрлүүд үүсгэх |

## Технологи

Next.js 16 (App Router), React 19, TypeScript 6, Tailwind CSS 4, shadcn/ui (Radix),
Supabase (Postgres 17, Auth, Storage, RLS), Zod 4, Vitest 5.

TypeScript 7.0 гарсан ч JS compiler API-гүй тул `typescript-eslint` (улмаар `eslint-config-next`)
дэмжихгүй байна. Иймд 6.0.3-ыг ашиглаж, дэмжлэг гармагц шилжинэ. ESLint мөн адил шалтгаанаар 9.x дээр байна
(`eslint-plugin-react`, `-import`, `-jsx-a11y` нь ESLint 10-ыг хараахан дэмжээгүй).
