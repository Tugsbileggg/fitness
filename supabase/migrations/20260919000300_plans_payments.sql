-- ============================================================================
-- 03. Эрхийн багц ба төлбөр
-- ============================================================================

create type public.discount_type as enum ('none', 'amount', 'percent');

-- ── Эрхийн багц ─────────────────────────────────────────────────────────────
create table public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  duration_months smallint not null check (duration_months between 1 and 36),
  price bigint not null check (price between 0 and 100000000),
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gym_id, id)
);
create index membership_plans_gym_idx on public.membership_plans (gym_id, sort_order) where deleted_at is null;

-- ── Төлбөр ──────────────────────────────────────────────────────────────────
-- Багцын нэр, хугацаа, үнийг тухайн үеийнхээр хадгална (дараа нь багц өөрчлөгдсөн ч түүх хэвээр).
-- Зөвхөн record_payment / void_payment RPC бичнэ.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  -- Бүртгэсэн дараалал. created_at нэг транзакцад ижил байж болох тул "сүүлийн төлбөр"-ийг үүгээр тодорхойлно.
  seq bigint generated always as identity,
  gym_id uuid not null references public.gyms (id),
  client_id uuid not null,
  plan_id uuid not null,
  plan_name text not null,
  duration_months smallint not null,
  list_price bigint not null check (list_price >= 0),
  discount_type public.discount_type not null default 'none',
  discount_value numeric(12, 2) not null default 0 check (discount_value >= 0),
  discount_amount bigint not null default 0 check (discount_amount between 0 and list_price),
  amount bigint not null check (amount = list_price - discount_amount),
  paid_on date not null,
  method public.payment_method not null,
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on),
  is_renewal boolean not null,
  note text check (char_length(note) <= 500),
  recorded_by uuid not null references public.profiles (id),
  voided_at timestamptz,
  voided_by uuid references public.profiles (id),
  void_reason text check (char_length(void_reason) <= 300),
  created_at timestamptz not null default now(),
  unique (gym_id, id),
  foreign key (gym_id, client_id) references public.clients (gym_id, id),
  foreign key (gym_id, plan_id) references public.membership_plans (gym_id, id)
);
create index payments_gym_paid_idx on public.payments (gym_id, paid_on) where voided_at is null;
create index payments_client_idx on public.payments (client_id, seq desc);

-- ── Үйлчлүүлэгчийн одоогийн эрх (төлбөрөөс тооцсон кэш) ─────────────────────
-- Хэрэглэгч зөвхөн уншина. Багш payments-ийг харахгүй ч эрхийн хугацааг эндээс харна.
-- Хүчингүй болгосны дараа төлбөр үлдээгүй бол ends_on = null (эрхгүй).
create table public.client_memberships (
  client_id uuid primary key,
  gym_id uuid not null,
  starts_on date,
  ends_on date,
  last_payment_id uuid,
  last_plan_name text,
  updated_at timestamptz not null default now(),
  foreign key (gym_id, client_id) references public.clients (gym_id, id),
  foreign key (gym_id, last_payment_id) references public.payments (gym_id, id)
);
create index client_memberships_gym_ends_idx on public.client_memberships (gym_id, ends_on);

create trigger membership_plans_updated_at before update on public.membership_plans
  for each row execute function app.set_updated_at();
create trigger membership_plans_gym_immutable before update on public.membership_plans
  for each row execute function app.prevent_gym_change();

-- ── Хөнгөлөлтийн тооцоо ─────────────────────────────────────────────────────
-- Дүнгээр: бүхэл ₮, үнээс хэтрэхгүй. Хувиар: бүхэл 0–100, ₮-өөр бүхэлтгэнэ (0.5-аас дээш).
-- TypeScript дахь хуулбар: src/lib/membership.ts
create function app.compute_discount(p_price bigint, p_type public.discount_type, p_value numeric)
returns bigint
language plpgsql immutable
set search_path = ''
as $$
begin
  if p_type = 'none' then
    return 0;
  end if;
  if p_value is null or p_value < 0 or p_value <> trunc(p_value) then
    raise exception 'Хөнгөлөлтийн утга буруу байна' using errcode = '22023';
  end if;
  if p_type = 'amount' then
    if p_value > p_price then
      raise exception 'Хөнгөлөлт багцын үнээс их байж болохгүй' using errcode = '22023';
    end if;
    return p_value::bigint;
  end if;
  if p_value > 100 then
    raise exception 'Хөнгөлөлтийн хувь 100-аас их байж болохгүй' using errcode = '22023';
  end if;
  return round(p_price * p_value / 100)::bigint;
end;
$$;

-- ── Төлбөр бүртгэх ──────────────────────────────────────────────────────────
-- Менежер ба багш дуудна. Үйлчлүүлэгчийн мөрийг түгжиж, эрхийн хугацааг app.compute_period-оор
-- тооцоод payments ба client_memberships-ийг нэг транзакцаар бичнэ.
create function public.record_payment(
  p_client_id uuid,
  p_plan_id uuid,
  p_paid_on date,
  p_method public.payment_method,
  p_discount_type public.discount_type default 'none',
  p_discount_value numeric default 0,
  p_note text default null
)
returns table (payment_id uuid, starts_on date, ends_on date, amount bigint, is_renewal boolean)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_gym_id uuid;
  v_plan public.membership_plans%rowtype;
  v_current_end date;
  v_has_previous boolean;
  v_discount bigint;
  v_starts date;
  v_ends date;
  v_payment_id uuid;
  v_today date := app.today_ub();
begin
  select c.gym_id into v_gym_id
  from public.clients c
  where c.id = p_client_id and c.deleted_at is null
  for update;
  if v_gym_id is null or not app.is_gym_member(v_gym_id) then
    raise exception 'Үйлчлүүлэгч олдсонгүй' using errcode = 'P0002';
  end if;
  if not app.gym_is_writable(v_gym_id) then
    raise exception 'Платформын эрх дууссан тул төлбөр бүртгэх боломжгүй' using errcode = '42501';
  end if;

  select * into v_plan
  from public.membership_plans mp
  where mp.id = p_plan_id and mp.gym_id = v_gym_id and mp.is_active and mp.deleted_at is null;
  if v_plan.id is null then
    raise exception 'Багц олдсонгүй эсвэл идэвхгүй байна' using errcode = 'P0002';
  end if;

  if p_method = 'qpay' then
    raise exception 'QPay төлбөр одоогоор боломжгүй' using errcode = '22023';
  end if;
  if p_paid_on is null or p_paid_on > v_today then
    raise exception 'Төлсөн огноо ирээдүйд байж болохгүй' using errcode = '22023';
  end if;
  if p_paid_on < v_today - 366 then
    raise exception 'Нэг жилээс өмнөх огноогоор бүртгэх боломжгүй' using errcode = '22023';
  end if;

  v_discount := app.compute_discount(v_plan.price, coalesce(p_discount_type, 'none'), coalesce(p_discount_value, 0));

  select m.ends_on into v_current_end
  from public.client_memberships m
  where m.client_id = p_client_id;

  v_has_previous := exists (
    select 1 from public.payments p where p.client_id = p_client_id and p.voided_at is null
  );

  select cp.starts_on, cp.ends_on into v_starts, v_ends
  from app.compute_period(v_current_end, p_paid_on, v_plan.duration_months) cp;

  insert into public.payments (
    gym_id, client_id, plan_id, plan_name, duration_months, list_price,
    discount_type, discount_value, discount_amount, amount,
    paid_on, method, starts_on, ends_on, is_renewal, note, recorded_by
  ) values (
    v_gym_id, p_client_id, v_plan.id, v_plan.name, v_plan.duration_months, v_plan.price,
    coalesce(p_discount_type, 'none'),
    case when coalesce(p_discount_type, 'none') = 'none' then 0 else p_discount_value end,
    v_discount, v_plan.price - v_discount,
    p_paid_on, p_method, v_starts, v_ends, v_has_previous,
    nullif(btrim(p_note), ''), (select auth.uid())
  )
  returning id into v_payment_id;

  insert into public.client_memberships (client_id, gym_id, starts_on, ends_on, last_payment_id, last_plan_name)
  values (p_client_id, v_gym_id, v_starts, v_ends, v_payment_id, v_plan.name)
  on conflict (client_id) do update
    set starts_on = excluded.starts_on,
        ends_on = excluded.ends_on,
        last_payment_id = excluded.last_payment_id,
        last_plan_name = excluded.last_plan_name,
        updated_at = now();

  return query select v_payment_id, v_starts, v_ends, v_plan.price - v_discount, v_has_previous;
end;
$$;

-- ── Төлбөрийг хүчингүй болгох (зөвхөн менежер, зөвхөн хамгийн сүүлийнх) ──────
-- Эрхийн хугацаа гинжин тооцоологддог тул дундах төлбөрийг хүчингүй болгохгүй.
-- Эрхийг өмнөх хүчинтэй төлбөрөөр сэргээнэ.
create function public.void_payment(p_payment_id uuid, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_latest uuid;
  v_prev public.payments%rowtype;
begin
  select * into v_payment from public.payments where id = p_payment_id;
  if v_payment.id is null or not app.is_gym_manager(v_payment.gym_id) then
    raise exception 'Төлбөр олдсонгүй' using errcode = 'P0002';
  end if;
  if not app.gym_is_writable(v_payment.gym_id) then
    raise exception 'Платформын эрх дууссан тул өөрчлөх боломжгүй' using errcode = '42501';
  end if;
  if v_payment.voided_at is not null then
    raise exception 'Төлбөр аль хэдийн хүчингүй болсон байна' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Хүчингүй болгох шалтгааныг бичнэ үү' using errcode = '22023';
  end if;

  -- Үйлчлүүлэгчийг түгжиж, зэрэг бүртгэлээс хамгаална.
  perform 1 from public.clients where id = v_payment.client_id for update;

  select p.id into v_latest
  from public.payments p
  where p.client_id = v_payment.client_id and p.voided_at is null
  order by p.seq desc
  limit 1;
  if v_latest is distinct from v_payment.id then
    raise exception 'Зөвхөн хамгийн сүүлийн төлбөрийг хүчингүй болгох боломжтой' using errcode = '22023';
  end if;

  update public.payments
     set voided_at = now(), voided_by = (select auth.uid()), void_reason = btrim(p_reason)
   where id = v_payment.id;

  select * into v_prev
  from public.payments p
  where p.client_id = v_payment.client_id and p.voided_at is null
  order by p.seq desc
  limit 1;

  update public.client_memberships
     set starts_on = v_prev.starts_on,
         ends_on = v_prev.ends_on,
         last_payment_id = v_prev.id,
         last_plan_name = v_prev.plan_name,
         updated_at = now()
   where client_id = v_payment.client_id;
end;
$$;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.membership_plans enable row level security;
alter table public.payments enable row level security;
alter table public.client_memberships enable row level security;

revoke all on public.membership_plans, public.payments, public.client_memberships from anon, authenticated;

-- membership_plans: бүх ажилтан харна (төлбөр бүртгэхэд), менежер удирдана.
grant select on public.membership_plans to authenticated;
grant insert (gym_id, name, duration_months, price, is_active, sort_order) on public.membership_plans to authenticated;
grant update (name, duration_months, price, is_active, sort_order, deleted_at) on public.membership_plans to authenticated;

create policy membership_plans_select on public.membership_plans for select to authenticated
  using (gym_id in (select app.my_gym_ids()));
create policy membership_plans_insert on public.membership_plans for insert to authenticated
  with check (gym_id in (select app.my_gym_ids(true, true)));
create policy membership_plans_update on public.membership_plans for update to authenticated
  using (gym_id in (select app.my_gym_ids(true, true)))
  with check (gym_id in (select app.my_gym_ids(true, true)));

-- payments: ЗӨВХӨН менежер уншина (багш орлогын мэдээлэл харахгүй). Бичих нь зөвхөн RPC.
grant select on public.payments to authenticated;

create policy payments_select_manager on public.payments for select to authenticated
  using (gym_id in (select app.my_gym_ids(true)));

-- client_memberships: бүх ажилтан уншина. Бичих нь зөвхөн RPC.
grant select on public.client_memberships to authenticated;

create policy client_memberships_select on public.client_memberships for select to authenticated
  using (gym_id in (select app.my_gym_ids()));

revoke execute on function public.record_payment(uuid, uuid, date, public.payment_method, public.discount_type, numeric, text) from public, anon;
revoke execute on function public.void_payment(uuid, text) from public, anon;
grant execute on function public.record_payment(uuid, uuid, date, public.payment_method, public.discount_type, numeric, text) to authenticated;
grant execute on function public.void_payment(uuid, text) to authenticated;
