-- ============================================================================
-- 04. Хяналтын самбар: "Мэдэгдсэн" тэмдэглэл, үйлчлүүлэгчийн төлөвийн view, нэгтгэл
-- ============================================================================

create type public.client_membership_status as enum ('active', 'expiring', 'expired', 'none');

-- ── "Мэдэгдсэн" тэмдэглэл ───────────────────────────────────────────────────
-- Менежер/багш үйлчлүүлэгчид эрх нь дуусч байгааг биечлэн хэлснээ тэмдэглэнэ.
-- ends_on: аль эрхийн мөчлөгт хамаарах. Үйлчлүүлэгч сунгамагц шинэ мөчлөг эхэлж, тэмдэглэл "шинэчлэгдэнэ".
create table public.client_notices (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id),
  client_id uuid not null,
  ends_on date not null,
  note text check (char_length(note) <= 300),
  notified_at timestamptz not null default now(),
  notified_by uuid not null default auth.uid() references public.profiles (id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (gym_id, client_id) references public.clients (gym_id, id)
);
create index client_notices_client_idx on public.client_notices (client_id, ends_on) where deleted_at is null;

create trigger client_notices_gym_immutable before update on public.client_notices
  for each row execute function app.prevent_gym_change();

alter table public.client_notices enable row level security;
revoke all on public.client_notices from anon, authenticated;

-- notified_by нь баганын эрхгүй тул үргэлж auth.uid() (өөр хүний нэрээр тэмдэглэх боломжгүй).
grant select on public.client_notices to authenticated;
grant insert (gym_id, client_id, ends_on, note) on public.client_notices to authenticated;
grant update (note, deleted_at) on public.client_notices to authenticated;

create policy client_notices_select on public.client_notices for select to authenticated
  using (gym_id in (select app.my_gym_ids()));
create policy client_notices_insert on public.client_notices for insert to authenticated
  with check (gym_id in (select app.my_gym_ids(false, true)));
create policy client_notices_update on public.client_notices for update to authenticated
  using (gym_id in (select app.my_gym_ids(false, true)))
  with check (gym_id in (select app.my_gym_ids(false, true)));

-- ── Үйлчлүүлэгчийн төлөв (view) ─────────────────────────────────────────────
-- security_invoker: доорх хүснэгт бүрийн RLS нь view-г дуудсан хэрэглэгчид үйлчилнэ.
-- Төлөв огнооноос тооцоологддог тул хэзээ ч хоцрохгүй. Устгасан үйлчлүүлэгч орохгүй.
create view public.client_status_v
with (security_invoker = true) as
select
  c.id,
  c.gym_id,
  c.full_name,
  c.phone,
  c.gender,
  c.birth_year,
  c.assigned_trainer_id,
  t.full_name as trainer_name,
  m.starts_on,
  m.ends_on,
  m.last_plan_name,
  (m.ends_on - app.today_ub()) as days_left,
  (case
    when m.ends_on is null then 'none'
    when m.ends_on < app.today_ub() then 'expired'
    when m.ends_on <= app.today_ub() + g.expiring_threshold_days then 'expiring'
    else 'active'
  end)::public.client_membership_status as status,
  n.id as notice_id,
  n.notified_at,
  n.note as notice_note,
  np.full_name as notified_by_name
from public.clients c
join public.gyms g on g.id = c.gym_id
left join public.client_memberships m on m.client_id = c.id
left join public.trainers t on t.gym_id = c.gym_id and t.id = c.assigned_trainer_id
left join lateral (
  select x.id, x.notified_at, x.note, x.notified_by
  from public.client_notices x
  where x.client_id = c.id and x.ends_on = m.ends_on and x.deleted_at is null
  order by x.notified_at desc
  limit 1
) n on true
left join public.profiles np on np.id = n.notified_by
where c.deleted_at is null;

revoke all on public.client_status_v from anon;
grant select on public.client_status_v to authenticated;

-- ── Хяналтын самбарын нэгтгэл ───────────────────────────────────────────────
-- Тоонуудыг бүх ажилтанд, энэ сарын орлогыг ЗӨВХӨН менежерт (багшид null) буцаана.
create function public.dashboard_summary(p_gym_id uuid)
returns table (
  active_count integer,
  expiring_count integer,
  expired_count integer,
  expired_recent_count integer,
  none_count integer,
  month_new_clients integer,
  month_renewed_clients integer,
  month_revenue bigint,
  month_payment_count integer
)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_today date := app.today_ub();
  v_month_start date := date_trunc('month', v_today)::date;
  v_threshold smallint;
begin
  if not app.is_gym_member(p_gym_id) then
    raise exception 'Эрх байхгүй' using errcode = '42501';
  end if;
  select g.expiring_threshold_days into v_threshold from public.gyms g where g.id = p_gym_id;

  return query
  with statuses as (
    select m.ends_on
    from public.clients c
    left join public.client_memberships m on m.client_id = c.id
    where c.gym_id = p_gym_id and c.deleted_at is null
  ),
  month_payments as (
    select p.client_id, p.is_renewal, p.amount
    from public.payments p
    where p.gym_id = p_gym_id and p.voided_at is null
      and p.paid_on between v_month_start and v_today
  )
  select
    (select count(*) from statuses s where s.ends_on >= v_today)::integer,
    (select count(*) from statuses s where s.ends_on between v_today and v_today + v_threshold)::integer,
    (select count(*) from statuses s where s.ends_on < v_today)::integer,
    (select count(*) from statuses s where s.ends_on < v_today and s.ends_on >= v_today - 30)::integer,
    (select count(*) from statuses s where s.ends_on is null)::integer,
    (select count(distinct mp.client_id) from month_payments mp where not mp.is_renewal)::integer,
    (select count(distinct mp.client_id) from month_payments mp where mp.is_renewal)::integer,
    case when app.is_gym_manager(p_gym_id)
      then (select coalesce(sum(mp.amount), 0) from month_payments mp)::bigint end,
    case when app.is_gym_manager(p_gym_id)
      then (select count(*) from month_payments mp)::integer end;
end;
$$;

revoke execute on function public.dashboard_summary(uuid) from public, anon;
grant execute on function public.dashboard_summary(uuid) to authenticated;
