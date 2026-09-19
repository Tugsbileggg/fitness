-- ============================================================================
-- 05. Платформын ашиглалтын төлбөр ба админ
-- ============================================================================

-- ── Платформын төлбөр ───────────────────────────────────────────────────────
-- Фитнес дансаар шилжүүлсний дараа админ гараар бүртгэнэ. Зөвхөн админы RPC бичнэ.
create table public.platform_payments (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,
  gym_id uuid not null references public.gyms (id),
  platform_plan_id uuid not null references public.platform_plans (id),
  plan_name text not null,
  months smallint not null check (months between 1 and 24),
  amount bigint not null check (amount between 0 and 100000000),
  paid_on date not null,
  method public.payment_method not null,
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  note text check (char_length(note) <= 500),
  recorded_by uuid not null references public.profiles (id),
  voided_at timestamptz,
  voided_by uuid references public.profiles (id),
  void_reason text check (char_length(void_reason) <= 300),
  created_at timestamptz not null default now()
);
create index platform_payments_gym_idx on public.platform_payments (gym_id, seq desc);
create index platform_payments_paid_idx on public.platform_payments (paid_on) where voided_at is null;

alter table public.platform_payments enable row level security;
revoke all on public.platform_payments from anon, authenticated;
grant select on public.platform_payments to authenticated;

-- Фитнесийн менежер өөрийн төлбөрийн түүхийг, админ бүгдийг харна. Багш харахгүй.
create policy platform_payments_select on public.platform_payments for select to authenticated
  using (gym_id in (select app.my_gym_ids(true)) or (select app.is_platform_admin()));

-- ── Админы туслах ───────────────────────────────────────────────────────────
create function app.require_platform_admin() returns void
language plpgsql stable
set search_path = ''
as $$
begin
  if not app.is_platform_admin() then
    raise exception 'Зөвхөн платформын админ' using errcode = '42501';
  end if;
end;
$$;

-- ── Платформын төлбөр бүртгэх ───────────────────────────────────────────────
-- Эрхийг туршилт эсвэл өмнөх төлбөрийн төгсгөлөөс (хүчинтэй бол) үргэлжлүүлнэ, үгүй бол төлсөн өдрөөс.
create function public.admin_record_platform_payment(
  p_gym_id uuid,
  p_plan_id uuid,
  p_months integer,
  p_amount bigint,
  p_paid_on date,
  p_method public.payment_method,
  p_note text default null
)
returns table (payment_id uuid, period_start date, period_end date)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_sub public.gym_subscriptions%rowtype;
  v_plan public.platform_plans%rowtype;
  v_access_end date;
  v_start date;
  v_end date;
  v_id uuid;
begin
  perform app.require_platform_admin();

  select * into v_sub from public.gym_subscriptions where gym_id = p_gym_id for update;
  if v_sub.gym_id is null then
    raise exception 'Фитнес олдсонгүй' using errcode = 'P0002';
  end if;
  select * into v_plan from public.platform_plans where id = p_plan_id;
  if v_plan.id is null then
    raise exception 'Тариф олдсонгүй' using errcode = 'P0002';
  end if;
  if p_months is null or p_months < 1 or p_months > 24 then
    raise exception 'Сарын тоо 1-24 байна' using errcode = '22023';
  end if;
  if p_amount is null or p_amount < 0 then
    raise exception 'Дүн буруу байна' using errcode = '22023';
  end if;
  if p_paid_on is null or p_paid_on > app.today_ub() then
    raise exception 'Төлсөн огноо ирээдүйд байж болохгүй' using errcode = '22023';
  end if;
  if p_method = 'qpay' then
    raise exception 'QPay одоогоор боломжгүй' using errcode = '22023';
  end if;

  v_access_end := greatest(v_sub.trial_ends_at, v_sub.paid_until);
  select cp.starts_on, cp.ends_on into v_start, v_end
  from app.compute_period(v_access_end, p_paid_on, p_months) cp;

  insert into public.platform_payments (
    gym_id, platform_plan_id, plan_name, months, amount, paid_on, method,
    period_start, period_end, note, recorded_by
  ) values (
    p_gym_id, v_plan.id, v_plan.name, p_months, p_amount, p_paid_on, p_method,
    v_start, v_end, nullif(btrim(p_note), ''), (select auth.uid())
  )
  returning id into v_id;

  update public.gym_subscriptions
     set paid_until = v_end, platform_plan_id = v_plan.id
   where gym_id = p_gym_id;

  return query select v_id, v_start, v_end;
end;
$$;

-- ── Платформын төлбөр хүчингүй болгох (зөвхөн хамгийн сүүлийнх) ─────────────
create function public.admin_void_platform_payment(p_payment_id uuid, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_payment public.platform_payments%rowtype;
  v_latest uuid;
  v_prev public.platform_payments%rowtype;
begin
  perform app.require_platform_admin();

  select * into v_payment from public.platform_payments where id = p_payment_id;
  if v_payment.id is null then
    raise exception 'Төлбөр олдсонгүй' using errcode = 'P0002';
  end if;
  if v_payment.voided_at is not null then
    raise exception 'Төлбөр аль хэдийн хүчингүй болсон' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Шалтгааныг бичнэ үү' using errcode = '22023';
  end if;

  perform 1 from public.gym_subscriptions where gym_id = v_payment.gym_id for update;

  select id into v_latest from public.platform_payments
  where gym_id = v_payment.gym_id and voided_at is null
  order by seq desc limit 1;
  if v_latest is distinct from v_payment.id then
    raise exception 'Зөвхөн хамгийн сүүлийн төлбөрийг хүчингүй болгоно' using errcode = '22023';
  end if;

  update public.platform_payments
     set voided_at = now(), voided_by = (select auth.uid()), void_reason = btrim(p_reason)
   where id = v_payment.id;

  select * into v_prev from public.platform_payments
  where gym_id = v_payment.gym_id and voided_at is null
  order by seq desc limit 1;

  update public.gym_subscriptions
     set paid_until = v_prev.period_end,
         platform_plan_id = coalesce(v_prev.platform_plan_id, platform_plan_id)
   where gym_id = v_payment.gym_id;
end;
$$;

-- ── Фитнесийг түр зогсоох / сэргээх ─────────────────────────────────────────
create function public.admin_set_gym_suspended(p_gym_id uuid, p_suspended boolean, p_reason text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform app.require_platform_admin();
  if p_suspended and char_length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Түр зогсоох шалтгааныг бичнэ үү' using errcode = '22023';
  end if;
  update public.gym_subscriptions
     set suspended_at = case when p_suspended then coalesce(suspended_at, now()) end,
         suspended_reason = case when p_suspended then btrim(p_reason) end
   where gym_id = p_gym_id;
  if not found then
    raise exception 'Фитнес олдсонгүй' using errcode = 'P0002';
  end if;
end;
$$;

-- ── Баталгаажуулах (фитнесийн ажиллагааг хаадаггүй, зөвхөн тэмдэглэл) ───────
create function public.admin_set_gym_verified(p_gym_id uuid, p_verified boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform app.require_platform_admin();
  update public.gym_subscriptions
     set verified_at = case when p_verified then coalesce(verified_at, now()) end
   where gym_id = p_gym_id;
  if not found then
    raise exception 'Фитнес олдсонгүй' using errcode = 'P0002';
  end if;
end;
$$;

-- ── Туршилтыг сунгах ────────────────────────────────────────────────────────
create function public.admin_extend_trial(p_gym_id uuid, p_days integer)
returns date
language plpgsql security definer
set search_path = ''
as $$
declare
  v_new date;
begin
  perform app.require_platform_admin();
  if p_days is null or p_days < 1 or p_days > 60 then
    raise exception 'Хоног 1-60 байна' using errcode = '22023';
  end if;
  update public.gym_subscriptions
     set trial_ends_at = greatest(trial_ends_at, app.today_ub() - 1) + p_days
   where gym_id = p_gym_id
  returning trial_ends_at into v_new;
  if v_new is null then
    raise exception 'Фитнес олдсонгүй' using errcode = 'P0002';
  end if;
  return v_new;
end;
$$;

-- ── Админы жагсаалт: фитнес бүрийн төлөв ба ТООН үзүүлэлт ───────────────────
-- Үйлчлүүлэгчийн хувийн мэдээлэл БУЦААХГҮЙ (админ clients хүснэгтийг уншдаггүй).
create function public.admin_gym_overview()
returns table (
  gym_id uuid,
  name text,
  address text,
  phone text,
  created_at timestamptz,
  manager_name text,
  manager_email text,
  status public.gym_subscription_status,
  trial_ends_at date,
  paid_until date,
  access_ends_on date,
  days_left integer,
  verified_at timestamptz,
  suspended_at timestamptz,
  suspended_reason text,
  plan_id uuid,
  plan_name text,
  plan_max_clients integer,
  plan_monthly_price bigint,
  client_count integer,
  active_client_count integer,
  staff_count integer,
  last_payment_on date
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.require_platform_admin();
  return query
  select
    g.id, g.name, g.address, g.phone, g.created_at,
    mp.full_name, mu.email::text,
    app.subscription_status(s.suspended_at, s.paid_until, s.trial_ends_at, app.today_ub()),
    s.trial_ends_at, s.paid_until,
    greatest(s.trial_ends_at, s.paid_until),
    (greatest(s.trial_ends_at, s.paid_until) - app.today_ub())::integer,
    s.verified_at, s.suspended_at, s.suspended_reason,
    pp.id, pp.name, pp.max_clients, pp.monthly_price,
    (select count(*) from public.clients c where c.gym_id = g.id and c.deleted_at is null)::integer,
    (select count(*) from public.clients c
       join public.client_memberships m on m.client_id = c.id
      where c.gym_id = g.id and c.deleted_at is null and m.ends_on >= app.today_ub())::integer,
    (select count(*) from public.gym_users gu where gu.gym_id = g.id and gu.is_active)::integer,
    (select max(p.paid_on) from public.platform_payments p where p.gym_id = g.id and p.voided_at is null)
  from public.gyms g
  join public.gym_subscriptions s on s.gym_id = g.id
  left join public.platform_plans pp on pp.id = s.platform_plan_id
  left join lateral (
    select gu.user_id from public.gym_users gu
    where gu.gym_id = g.id and gu.role = 'manager' and gu.is_active
    order by gu.created_at limit 1
  ) m on true
  left join public.profiles mp on mp.id = m.user_id
  left join auth.users mu on mu.id = m.user_id
  order by g.created_at desc;
end;
$$;

-- ── Платформын нэгтгэл ──────────────────────────────────────────────────────
create function public.admin_platform_summary()
returns table (
  gym_count integer,
  trial_count integer,
  active_count integer,
  past_due_count integer,
  suspended_count integer,
  expiring_soon_count integer,
  month_revenue bigint,
  month_payment_count integer,
  mrr bigint
)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_today date := app.today_ub();
begin
  perform app.require_platform_admin();
  return query
  with subs as (
    select s.*, app.subscription_status(s.suspended_at, s.paid_until, s.trial_ends_at, v_today) as st,
           greatest(s.trial_ends_at, s.paid_until) as access_end
    from public.gym_subscriptions s
  )
  select
    (select count(*) from subs)::integer,
    (select count(*) from subs where st = 'trial')::integer,
    (select count(*) from subs where st = 'active')::integer,
    (select count(*) from subs where st = 'past_due')::integer,
    (select count(*) from subs where st = 'suspended')::integer,
    (select count(*) from subs where st in ('trial', 'active') and access_end - v_today <= 5)::integer,
    (select coalesce(sum(p.amount), 0) from public.platform_payments p
      where p.voided_at is null and p.paid_on between date_trunc('month', v_today)::date and v_today)::bigint,
    (select count(*) from public.platform_payments p
      where p.voided_at is null and p.paid_on between date_trunc('month', v_today)::date and v_today)::integer,
    (select coalesce(sum(pp.monthly_price), 0) from subs
       join public.platform_plans pp on pp.id = subs.platform_plan_id
      where subs.st = 'active')::bigint;
end;
$$;

-- ── Менежерт: үйлчлүүлэгчийн тоо ба тарифын хязгаар ────────────────────────
create function public.gym_usage(p_gym_id uuid)
returns table (client_count integer, plan_name text, max_clients integer, monthly_price bigint)
language sql stable security definer
set search_path = ''
as $$
  select
    (select count(*) from public.clients c where c.gym_id = p_gym_id and c.deleted_at is null)::integer,
    pp.name, pp.max_clients, pp.monthly_price
  from public.gym_subscriptions s
  left join public.platform_plans pp on pp.id = s.platform_plan_id
  where s.gym_id = p_gym_id and app.is_gym_manager(p_gym_id);
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.admin_record_platform_payment(uuid, uuid, integer, bigint, date, public.payment_method, text)',
    'public.admin_void_platform_payment(uuid, text)',
    'public.admin_set_gym_suspended(uuid, boolean, text)',
    'public.admin_set_gym_verified(uuid, boolean)',
    'public.admin_extend_trial(uuid, integer)',
    'public.admin_gym_overview()',
    'public.admin_platform_summary()',
    'public.gym_usage(uuid)'
  ] loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$$;
