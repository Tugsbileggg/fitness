@AGENTS.md

# Төслийн дүрэм

- Төлөвлөгөө: `docs/PLAN.md`. Үе шатаар хөгжүүлж байгаа.
- UI бүхэлдээ монгол хэлээр (кирилл). Мөнгө: `formatMNT` (`src/lib/money.ts`) → `1,250,000₮`. Огноо: `formatDate` (`src/lib/dates.ts`) → `2026.09.19`.
- Бизнесийн огноо нь `YYYY-MM-DD` мөр; `new Date("YYYY-MM-DD")` бүү ашигла. "Өнөөдөр" = `todayUB()` / SQL `app.today_ub()`.
- Multi-tenant: бүх хүснэгтэд `gym_id`, хамгаалалт нь RLS. Өөр хүснэгт рүү заах FK нь `(gym_id, x_id)` нийлмэл.
- Hard delete хийхгүй: `deleted_at` / `voided_at` / `is_active`.
- Secret key (`SUPABASE_SECRET_KEY`) зөвхөн `src/lib/supabase/admin.ts`-д, `server-only`.
