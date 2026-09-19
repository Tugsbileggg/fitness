-- ============================================================================
-- 02. Багш ба үйлчлүүлэгч
-- ============================================================================

create type public.gender as enum ('male', 'female');

-- ── Багш ────────────────────────────────────────────────────────────────────
-- Багшийн бүртгэл. Нэвтрэх эрх (user_id) нь менежер урилга илгээхэд холбогдоно.
-- Устгахгүй: is_active = false болгоход нэвтрэх эрх нь автоматаар хаагдана.
create table public.trainers (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  phone text not null check (phone ~ '^[1-9][0-9]{7}$'),
  specialization text check (char_length(specialization) <= 200),
  notes text check (char_length(notes) <= 1000),
  email text check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  user_id uuid references public.profiles (id),
  invited_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gym_id, id),
  unique (gym_id, user_id)
);
create index trainers_gym_idx on public.trainers (gym_id, is_active, full_name);

-- ── Үйлчлүүлэгч ─────────────────────────────────────────────────────────────
-- Үйлчлүүлэгч системд нэвтрэхгүй; зөвхөн бүртгэлийн өгөгдөл.
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  phone text not null check (phone ~ '^[1-9][0-9]{7}$'),
  gender public.gender not null,
  birth_year smallint not null check (birth_year between 1920 and 2100),
  assigned_trainer_id uuid,
  notes text check (char_length(notes) <= 1000),
  created_by uuid references public.profiles (id) default auth.uid(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gym_id, id),
  -- Нийлмэл FK: хариуцсан багш заавал ИЖИЛ фитнесийнх байна.
  foreign key (gym_id, assigned_trainer_id) references public.trainers (gym_id, id)
);
create index clients_gym_active_idx on public.clients (gym_id, created_at desc) where deleted_at is null;
create index clients_gym_phone_idx on public.clients (gym_id, phone);
create index clients_trainer_idx on public.clients (gym_id, assigned_trainer_id);

-- ── Trigger-ууд ─────────────────────────────────────────────────────────────
create trigger trainers_updated_at before update on public.trainers
  for each row execute function app.set_updated_at();
create trigger clients_updated_at before update on public.clients
  for each row execute function app.set_updated_at();
create trigger trainers_gym_immutable before update on public.trainers
  for each row execute function app.prevent_gym_change();
create trigger clients_gym_immutable before update on public.clients
  for each row execute function app.prevent_gym_change();

-- Үйлчлүүлэгчийг зөвхөн менежер устгана (soft delete) эсвэл сэргээнэ.
create function app.guard_client_delete() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.deleted_at is distinct from old.deleted_at then
    -- auth.uid() хоосон = сервер/seed (secret key эсвэл postgres).
    if (select auth.uid()) is not null and not app.is_gym_manager(new.gym_id) then
      raise exception 'Үйлчлүүлэгчийг зөвхөн менежер устгана' using errcode = '42501';
    end if;
    new.deleted_by := case when new.deleted_at is null then null else (select auth.uid()) end;
  end if;
  return new;
end;
$$;

create trigger clients_guard_delete before update on public.clients
  for each row execute function app.guard_client_delete();

-- Багшийг идэвхгүй/идэвхтэй болгоход нэвтрэх эрхийг нь дагуулж өөрчилнө.
-- Менежер gym_users-д шууд бичих эрхгүй тул SECURITY DEFINER.
create function app.sync_trainer_access() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.user_id is not null
     and (new.is_active is distinct from old.is_active or new.user_id is distinct from old.user_id) then
    update public.gym_users
       set is_active = new.is_active
     where gym_id = new.gym_id and user_id = new.user_id and role = 'trainer';
  end if;
  return new;
end;
$$;

create trigger trainers_sync_access after update on public.trainers
  for each row execute function app.sync_trainer_access();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.trainers enable row level security;
alter table public.clients enable row level security;

revoke all on public.trainers, public.clients from anon, authenticated;

-- trainers: фитнесийн бүх ажилтан харна (хариуцсан багш сонгоход), зөвхөн менежер бичнэ.
-- user_id, invited_at-г зөвхөн сервер (урилга илгээх үед) тохируулна: баганын эрх олгохгүй.
grant select on public.trainers to authenticated;
grant insert (gym_id, full_name, phone, specialization, notes, email) on public.trainers to authenticated;
grant update (full_name, phone, specialization, notes, email, is_active) on public.trainers to authenticated;

create policy trainers_select on public.trainers for select to authenticated
  using (gym_id in (select app.my_gym_ids()));
create policy trainers_insert on public.trainers for insert to authenticated
  with check (gym_id in (select app.my_gym_ids(true, true)));
create policy trainers_update on public.trainers for update to authenticated
  using (gym_id in (select app.my_gym_ids(true, true)))
  with check (gym_id in (select app.my_gym_ids(true, true)));

-- clients: менежер ба багш харна, нэмнэ, засна (бичих эрхтэй үед). Устгах = менежер (trigger).
-- RLS устгагдсан мөрийг нуудаггүй (tenant тусгаарлалт л хамгаалалт); хуудаснууд deleted_at is null-оор шүүнэ.
grant select on public.clients to authenticated;
grant insert (gym_id, full_name, phone, gender, birth_year, assigned_trainer_id, notes)
  on public.clients to authenticated;
grant update (full_name, phone, gender, birth_year, assigned_trainer_id, notes, deleted_at)
  on public.clients to authenticated;

create policy clients_select on public.clients for select to authenticated
  using (gym_id in (select app.my_gym_ids()));
create policy clients_insert on public.clients for insert to authenticated
  with check (gym_id in (select app.my_gym_ids(false, true)));
create policy clients_update on public.clients for update to authenticated
  using (gym_id in (select app.my_gym_ids(false, true)))
  with check (gym_id in (select app.my_gym_ids(false, true)));

-- ── Багшийн нэвтрэх эрхийн төлөв (менежерт) ────────────────────────────────
-- auth.users-ийг зөвхөн SECURITY DEFINER-ээр уншина; зөвхөн тухайн фитнесийн менежер дуудна.
create function public.trainer_accounts(p_gym_id uuid)
returns table (trainer_id uuid, email_confirmed boolean, last_sign_in_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select t.id, u.email_confirmed_at is not null, u.last_sign_in_at
  from public.trainers t
  join auth.users u on u.id = t.user_id
  where t.gym_id = p_gym_id
    and app.is_gym_manager(p_gym_id);
$$;

revoke execute on function public.trainer_accounts(uuid) from public, anon;
grant execute on function public.trainer_accounts(uuid) to authenticated;
