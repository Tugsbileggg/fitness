-- ============================================================================
-- 01. Суурь: хэрэглэгч, фитнес (tenant), ажилтан, платформын эрх, RLS туслах функцууд
-- ============================================================================

-- ── Эрхийн ерөнхий бодлого ──────────────────────────────────────────────────
-- Supabase анхдагчаар public schema-ийн шинэ хүснэгт, функц бүрт anon/authenticated-д
-- бүх эрх өгдөг. Бид үүнийг хааж, хэрэгтэй эрхийг хүснэгт бүрт тусад нь өгнө.
--   * anon: юу ч харахгүй (зөвхөн идэвхтэй тарифуудыг нүүр хуудсанд).
--   * authenticated: DELETE, TRUNCATE хэзээ ч үгүй (soft delete ашиглана).
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke delete, truncate on tables from authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon;

create schema if not exists app;
comment on schema app is 'Дотоод туслах функцууд. PostgREST-ээр ил гарахгүй.';
revoke all on schema app from public;
grant usage on schema app to authenticated, service_role;
-- RLS policy доторх app.* дуудлагууд хэрэглэгчийн эрхээр ажилладаг тул authenticated-д EXECUTE хэрэгтэй.
-- app schema API-аар ил гардаггүй тул хэрэглэгч эдгээрийг шууд дуудаж чадахгүй.
alter default privileges for role postgres in schema app revoke execute on functions from public;
alter default privileges for role postgres in schema app grant execute on functions to authenticated, service_role;

-- ── Enum-ууд ────────────────────────────────────────────────────────────────
create type public.staff_role as enum ('manager', 'trainer');
create type public.gym_subscription_status as enum ('trial', 'active', 'past_due', 'suspended');
-- 'qpay' ирээдүйн интеграцад зориулагдсан; одоогоор UI-д сонгох боломжгүй.
create type public.payment_method as enum ('cash', 'bank_transfer', 'qpay');

-- ── Ерөнхий туслах функцууд ─────────────────────────────────────────────────
create function app.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Улаанбаатарын цагаар өнөөдрийн огноо. Бүх "дууссан/идэвхтэй" тооцоо үүнийг ашиглана.
create function app.today_ub() returns date
language sql stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Ulaanbaatar')::date;
$$;

-- Эрхийн хугацааг тооцох цорын ганц дүрэм (үйлчлүүлэгч ба платформын эрхэд хоёуланд нь).
--   * Одоогийн эрх төлсөн өдөр хүчинтэй байвал (current_end >= paid_on) дуусах огнооноос үргэлжлүүлнэ.
--   * Үгүй бол төлсөн өдрөөс эхэлнэ.
--   * ends_on нь хүчинтэй сүүлийн өдөр: 2026-09-19 + 1 сар = 2026-10-19.
-- TypeScript дахь хуулбар: src/lib/membership.ts (тестээр нийцлийг шалгана).
create function app.compute_period(p_current_end date, p_paid_on date, p_months integer)
returns table (starts_on date, ends_on date)
language sql immutable
set search_path = ''
as $$
  select
    case when p_current_end is not null and p_current_end >= p_paid_on
         then p_current_end + 1 else p_paid_on end,
    (case when p_current_end is not null and p_current_end >= p_paid_on
          then p_current_end else p_paid_on end
     + make_interval(months => p_months))::date;
$$;

-- Платформын эрхийн төлөвийг огнооноос тооцоолно (хадгалдаггүй тул хэзээ ч хоцрохгүй).
create function app.subscription_status(
  p_suspended_at timestamptz,
  p_paid_until date,
  p_trial_ends_at date,
  p_today date
) returns public.gym_subscription_status
language sql immutable
set search_path = ''
as $$
  select case
    when p_suspended_at is not null then 'suspended'
    when p_paid_until is not null and p_paid_until >= p_today then 'active'
    when p_trial_ends_at >= p_today then 'trial'
    else 'past_due'
  end::public.gym_subscription_status;
$$;

-- ── Хүснэгтүүд ──────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  phone text check (phone ~ '^[1-9][0-9]{7}$'),
  -- Зөвхөн SQL эсвэл scripts/make-admin.ts-ээр тохируулна. Хэрэглэгч өөрөө өөрчилж чадахгүй.
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Системд нэвтэрдэг хүн бүрийн профайл (менежер, багш, админ).';

create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  address text not null check (char_length(btrim(address)) between 3 and 300),
  phone text not null check (phone ~ '^[1-9][0-9]{7}$'),
  logo_path text check (char_length(logo_path) <= 300),
  expiring_threshold_days smallint not null default 7
    check (expiring_threshold_days between 1 and 60),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.gyms is 'Tenant. Бусад бүх өгөгдөл gym_id-аар энэ хүснэгтэд харьяалагдана.';

-- Хэн аль фитнест ямар дүрээр нэвтрэх эрхтэйг тодорхойлох цорын ганц эх сурвалж.
create table public.gym_users (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id),
  user_id uuid not null references public.profiles (id),
  role public.staff_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gym_id, user_id)
);
create index gym_users_user_idx on public.gym_users (user_id) where is_active;

create table public.platform_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 60),
  description text check (char_length(description) <= 300),
  max_clients integer check (max_clients > 0), -- null = хязгааргүй
  monthly_price bigint not null check (monthly_price >= 0),
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.platform_plans is 'Платформын сарын ашиглалтын тарифууд (админ тохируулна).';

create table public.gym_subscriptions (
  gym_id uuid primary key references public.gyms (id),
  platform_plan_id uuid references public.platform_plans (id),
  trial_ends_at date not null,
  paid_until date,
  suspended_at timestamptz,
  suspended_reason text check (char_length(suspended_reason) <= 300),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.gym_subscriptions is
  'Фитнесийн платформын эрх. Хэрэглэгч зөвхөн уншина; зөвхөн админы RPC өөрчилнө.';

create trigger profiles_updated_at before update on public.profiles
  for each row execute function app.set_updated_at();
create trigger gyms_updated_at before update on public.gyms
  for each row execute function app.set_updated_at();
create trigger gym_users_updated_at before update on public.gym_users
  for each row execute function app.set_updated_at();
create trigger platform_plans_updated_at before update on public.platform_plans
  for each row execute function app.set_updated_at();
create trigger gym_subscriptions_updated_at before update on public.gym_subscriptions
  for each row execute function app.set_updated_at();

-- ── RLS туслах функцууд ─────────────────────────────────────────────────────
-- SECURITY DEFINER: gym_users-ийн RLS-ийг давхар шалгахгүйгээр (рекурс үүсгэхгүй) хурдан ажиллана.
-- Policy-д `gym_id in (select app.my_gym_ids(...))` хэлбэрээр хэрэглэнэ: мөр бүрт биш,
-- нэг query-д нэг л удаа тооцоологдоно.

create function app.gym_status(p_gym_id uuid) returns public.gym_subscription_status
language sql stable security definer
set search_path = ''
as $$
  select app.subscription_status(s.suspended_at, s.paid_until, s.trial_ends_at, app.today_ub())
  from public.gym_subscriptions s
  where s.gym_id = p_gym_id;
$$;

create function app.gym_is_writable(p_gym_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(app.gym_status(p_gym_id) in ('trial', 'active'), false);
$$;

-- Одоогийн хэрэглэгчийн идэвхтэй харьяалагддаг фитнесүүд.
--   p_manager_only  — зөвхөн менежер дүртэй
--   p_writable_only — зөвхөн trial/active (read-only биш) фитнесүүд
create function app.my_gym_ids(
  p_manager_only boolean default false,
  p_writable_only boolean default false
) returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select gu.gym_id
  from public.gym_users gu
  where gu.user_id = (select auth.uid())
    and gu.is_active
    and (not p_manager_only or gu.role = 'manager')
    and (not p_writable_only or app.gym_is_writable(gu.gym_id));
$$;

create function app.is_gym_member(p_gym_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from app.my_gym_ids() g where g = p_gym_id);
$$;

create function app.is_gym_manager(p_gym_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from app.my_gym_ids(true) g where g = p_gym_id);
$$;

create function app.is_platform_admin() returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_platform_admin from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

-- Нэг фитнест ажилладаг хамт олны user_id (нэр харуулахад).
create function app.colleague_user_ids() returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select distinct gu.user_id
  from public.gym_users gu
  where gu.gym_id in (select app.my_gym_ids());
$$;

-- Бичих үйлдлээр tenant солихыг хориглоно (gym_id-г өөрчлөх боломжгүй).
create function app.prevent_gym_change() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.gym_id is distinct from old.gym_id then
    raise exception 'gym_id-г өөрчлөх боломжгүй' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger gym_users_gym_immutable before update on public.gym_users
  for each row execute function app.prevent_gym_change();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.gyms enable row level security;
alter table public.gym_users enable row level security;
alter table public.platform_plans enable row level security;
alter table public.gym_subscriptions enable row level security;

-- Supabase-ийн анхдагч эрхийг хүснэгт бүрт тодорхой болгож дахин өгнө.
revoke all on public.profiles, public.gyms, public.gym_users,
  public.platform_plans, public.gym_subscriptions from anon, authenticated;

-- profiles: өөрийгөө, хамт ажилладгуудаа, админ бүгдийг харна.
-- Өөрийн нэр, утсаа л засна (is_platform_admin-ийг өөрчлөх эрх баганын түвшинд байхгүй).
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create policy profiles_select on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or id in (select app.colleague_user_ids())
    or (select app.is_platform_admin())
  );
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- gyms: гишүүд ба админ харна; менежер (бичих эрхтэй үед) үндсэн мэдээллээ засна.
grant select on public.gyms to authenticated;
grant update (name, address, phone, logo_path, expiring_threshold_days) on public.gyms to authenticated;

create policy gyms_select on public.gyms for select to authenticated
  using (id in (select app.my_gym_ids()) or (select app.is_platform_admin()));
create policy gyms_update_manager on public.gyms for update to authenticated
  using (id in (select app.my_gym_ids(true, true)))
  with check (id in (select app.my_gym_ids(true, true)));

-- gym_users: өөрийн мөр, өөрийн фитнесийн менежер, админ харна. Бичих нь зөвхөн сервер/trigger.
grant select on public.gym_users to authenticated;

create policy gym_users_select on public.gym_users for select to authenticated
  using (
    user_id = (select auth.uid())
    or gym_id in (select app.my_gym_ids(true))
    or (select app.is_platform_admin())
  );

-- gym_subscriptions: гишүүд ба админ зөвхөн уншина.
grant select on public.gym_subscriptions to authenticated;

create policy gym_subscriptions_select on public.gym_subscriptions for select to authenticated
  using (gym_id in (select app.my_gym_ids()) or (select app.is_platform_admin()));

-- platform_plans: идэвхтэй тарифуудыг хүн бүр (нүүр хуудас) харна, админ удирдана.
grant select on public.platform_plans to anon, authenticated;
grant insert, update on public.platform_plans to authenticated;

create policy platform_plans_select_public on public.platform_plans for select to anon, authenticated
  using (is_active or (select app.is_platform_admin()));
create policy platform_plans_admin_insert on public.platform_plans for insert to authenticated
  with check ((select app.is_platform_admin()));
create policy platform_plans_admin_update on public.platform_plans for update to authenticated
  using ((select app.is_platform_admin()))
  with check ((select app.is_platform_admin()));

-- ── Бүртгэлийн trigger ──────────────────────────────────────────────────────
-- auth.users-д мөр нэмэгдэхэд профайл үүсгэнэ. /register маягтаас ирсэн бол
-- (signup_type = 'gym_owner') фитнес, менежерийн эрх, 14 хоногийн туршилтыг хамт үүсгэнэ.
-- Админы эрхийг metadata-аас хэзээ ч уншихгүй.
create function app.handle_new_user() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_gym_id uuid;
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(btrim(meta ->> 'full_name'), ''), split_part(new.email, '@', 1))
  );

  if meta ->> 'signup_type' = 'gym_owner' then
    insert into public.gyms (name, address, phone, created_by)
    values (btrim(meta ->> 'gym_name'), btrim(meta ->> 'gym_address'), meta ->> 'gym_phone', new.id)
    returning id into v_gym_id;

    insert into public.gym_users (gym_id, user_id, role)
    values (v_gym_id, new.id, 'manager');

    -- Туршилтын хугацаа: src/lib/config.ts TRIAL_DAYS-тэй ижил (14 хоног).
    insert into public.gym_subscriptions (gym_id, trial_ends_at)
    values (v_gym_id, app.today_ub() + 14);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- ── Нэвтэрсэн хэрэглэгчийн контекст (layout бүр нэг удаа дуудна) ─────────────
create function public.get_my_context()
returns table (
  user_id uuid,
  full_name text,
  is_platform_admin boolean,
  gym_id uuid,
  gym_name text,
  gym_logo_path text,
  expiring_threshold_days smallint,
  role public.staff_role,
  subscription_status public.gym_subscription_status,
  trial_ends_at date,
  paid_until date,
  access_ends_on date,
  today date
)
language sql stable
set search_path = ''
as $$
  select
    p.id,
    p.full_name,
    p.is_platform_admin,
    g.id,
    g.name,
    g.logo_path,
    g.expiring_threshold_days,
    gu.role,
    app.subscription_status(s.suspended_at, s.paid_until, s.trial_ends_at, app.today_ub()),
    s.trial_ends_at,
    s.paid_until,
    greatest(s.trial_ends_at, s.paid_until),
    app.today_ub()
  from public.profiles p
  left join lateral (
    select x.gym_id, x.role
    from public.gym_users x
    where x.user_id = p.id and x.is_active
    order by x.created_at
    limit 1
  ) gu on true
  left join public.gyms g on g.id = gu.gym_id
  left join public.gym_subscriptions s on s.gym_id = g.id
  where p.id = (select auth.uid());
$$;

revoke execute on function public.get_my_context() from public, anon;
grant execute on function public.get_my_context() to authenticated;

-- ── Лого хадгалах bucket ────────────────────────────────────────────────────
-- Лого нууц мэдээлэл биш тул public bucket. SVG-г (script агуулж болох) зөвшөөрөхгүй.
-- Файлын зам: {gym_id}/logo-{timestamp}.{ext}. Менежер зөвхөн өөрийн фитнесийн хавтаст бичнэ.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gym-logos', 'gym-logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy gym_logos_manager_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'gym-logos'
    and (storage.foldername(name))[1] in (select g::text from app.my_gym_ids(true, true) g)
  );
