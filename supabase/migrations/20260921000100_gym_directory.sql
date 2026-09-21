-- ============================================================================
-- 06. Фитнесийн нийтийн танилцуулга ба хайлт
-- ============================================================================
-- Фитнес бүр өөрийн танилцуулга, байршил, цагийн хуваарь, үйлчилгээ, зургаа оруулна.
-- Нэвтрээгүй хүн (ирээдүйн үйлчлүүлэгч) хүснэгтийг шууд уншихгүй. Зөвхөн доорх хоёр RPC-ээр,
-- зөвхөн нийтийн талбаруудыг харна:
--   public.list_public_gyms()      — жагсаалт (хайлт, "ойролцоох" эрэмбэ нь хөтөч дээр)
--   public.get_public_gym(slug)    — нэг фитнесийн хуудас
-- Жагсаалтад гарах нөхцөл (app.listed_gym_ids):
--   * менежер "нийтлэх"-ийг асаасан,
--   * админ фитнесийг баталгаажуулсан (verified_at) — хуурамч бүртгэлээс хамгаална,
--   * платформын эрх trial эсвэл active (past_due / suspended бол нуугдана).

-- ── Утгын жагсаалтууд (TS хуулбар: src/features/directory/areas.ts, amenities.ts) ──
-- Шинэ утга нэмэх бол энд болон TS талд хоёуланд нь нэмнэ. tests/db/directory.test.ts нийцлийг шалгана.
create function app.directory_areas() returns text[]
language sql immutable
set search_path = ''
as $$
  select array[
    -- Улаанбаатарын дүүргүүд
    'ub_baganuur', 'ub_bagakhangai', 'ub_bayangol', 'ub_bayanzurkh', 'ub_nalaikh',
    'ub_songinokhairkhan', 'ub_sukhbaatar', 'ub_khan_uul', 'ub_chingeltei',
    -- Аймгууд
    'arkhangai', 'bayan_ulgii', 'bayankhongor', 'bulgan', 'govi_altai', 'govisumber',
    'darkhan_uul', 'dornogovi', 'dornod', 'dundgovi', 'zavkhan', 'orkhon', 'uvurkhangai',
    'umnugovi', 'sukhbaatar', 'selenge', 'tuv', 'uvs', 'khovd', 'khuvsgul', 'khentii'
  ];
$$;

create function app.directory_amenities() returns text[]
language sql immutable
set search_path = ''
as $$
  select array[
    'cardio', 'free_weights', 'machines', 'group_classes', 'personal_training', 'yoga',
    'martial_arts', 'crossfit', 'sauna', 'shower', 'lockers', 'parking', 'women_only',
    'kids', 'wifi', 'massage', 'pool', 'cafe'
  ];
$$;

create function app.valid_amenities(p_amenities text[]) returns boolean
language sql immutable
set search_path = ''
as $$
  select p_amenities is not null
     and p_amenities <@ app.directory_amenities()
     and cardinality(p_amenities) = (select count(distinct a) from unnest(p_amenities) a);
$$;

-- Цагийн хуваарь: 7 өдөр бүгд байна. Өдөр бүр null (амарна) эсвэл ["07:00", "22:00"].
-- Хаах цаг "24:00" байж болно. Шөнө дундыг дамнасан хуваарь дэмжихгүй (нээх < хаах).
create function app.valid_opening_hours(p_hours jsonb) returns boolean
language plpgsql immutable
set search_path = ''
as $$
declare
  v_day text;
  v_value jsonb;
  v_open text;
  v_close text;
begin
  if p_hours is null then
    return true;
  end if;
  if jsonb_typeof(p_hours) <> 'object' then
    return false;
  end if;
  if (select count(*) from jsonb_object_keys(p_hours)) <> 7 then
    return false;
  end if;
  for v_day, v_value in select e.key, e.value from jsonb_each(p_hours) e loop
    if v_day not in ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun') then
      return false;
    end if;
    continue when jsonb_typeof(v_value) = 'null';
    if jsonb_typeof(v_value) <> 'array' or jsonb_array_length(v_value) <> 2
       or jsonb_typeof(v_value -> 0) <> 'string' or jsonb_typeof(v_value -> 1) <> 'string' then
      return false;
    end if;
    v_open := v_value ->> 0;
    v_close := v_value ->> 1;
    if v_open !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       or v_close !~ '^(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)$'
       or v_open collate "C" >= v_close collate "C" then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

-- Зураг: {gym_id}/photo-{timestamp}.{ext}, 8 хүртэл, давхардалгүй. Өөр фитнесийн файлыг заахаас хамгаална.
create function app.valid_gym_photo_paths(p_gym_id uuid, p_paths text[]) returns boolean
language sql immutable
set search_path = ''
as $$
  select p_paths is not null
     and cardinality(p_paths) <= 8
     and not exists (
       select 1 from unnest(p_paths) as t(path)
       where t.path is null
          or t.path !~ ('^' || p_gym_id::text || '/photo-[0-9]{10,16}\.(jpg|png|webp)$')
     )
     and cardinality(p_paths) = (select count(distinct x) from unnest(p_paths) x);
$$;

-- ── Хүснэгт ─────────────────────────────────────────────────────────────────
create table public.gym_profiles (
  gym_id uuid primary key references public.gyms (id),
  -- Нийтийн хаяг: /gyms/{slug}. Латин жижиг үсэг, тоо, зураас.
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  is_published boolean not null default false,
  tagline text check (char_length(tagline) <= 120),
  description text check (char_length(description) <= 2000),
  area text check (area = any (app.directory_areas())),
  -- Монгол улсын нутаг дэвсгэр (ойролцоогоор).
  latitude double precision check (latitude between 41.5 and 52.2),
  longitude double precision check (longitude between 87.7 and 120.0),
  -- Нийтэд харагдах утас. Бүртгэлийн утсыг (gyms.phone) менежерийн зөвшөөрөлгүйгээр ил гаргахгүй.
  contact_phone text check (contact_phone ~ '^[1-9][0-9]{7}$'),
  opening_hours jsonb check (app.valid_opening_hours(opening_hours)),
  amenities text[] not null default '{}' check (app.valid_amenities(amenities)),
  show_prices boolean not null default true,
  facebook_url text check (
    char_length(facebook_url) <= 200
    and facebook_url ~ '^https://([a-z]+\.)?(facebook\.com|fb\.com)/[^[:space:]]+$'
  ),
  instagram_url text check (
    char_length(instagram_url) <= 200
    and instagram_url ~ '^https://(www\.)?instagram\.com/[^[:space:]]+$'
  ),
  photo_paths text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gym_profiles_location_pair check ((latitude is null) = (longitude is null)),
  constraint gym_profiles_publish_requires_location
    check (not is_published or (area is not null and latitude is not null)),
  constraint gym_profiles_photo_paths check (app.valid_gym_photo_paths(gym_id, photo_paths))
);
comment on table public.gym_profiles is
  'Фитнесийн нийтийн танилцуулга. Нэвтрээгүй хүн зөвхөн list_public_gyms / get_public_gym RPC-ээр харна.';

create trigger gym_profiles_updated_at before update on public.gym_profiles
  for each row execute function app.set_updated_at();
create trigger gym_profiles_gym_immutable before update on public.gym_profiles
  for each row execute function app.prevent_gym_change();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.gym_profiles enable row level security;
revoke all on public.gym_profiles from anon, authenticated;

grant select on public.gym_profiles to authenticated;
grant insert (
  gym_id, slug, is_published, tagline, description, area, latitude, longitude, contact_phone,
  opening_hours, amenities, show_prices, facebook_url, instagram_url, photo_paths
) on public.gym_profiles to authenticated;
grant update (
  slug, is_published, tagline, description, area, latitude, longitude, contact_phone,
  opening_hours, amenities, show_prices, facebook_url, instagram_url, photo_paths
) on public.gym_profiles to authenticated;

-- Фитнесийн ажилтнууд ба админ уншина. Менежер (бичих эрхтэй үед) үүсгэж, засна.
create policy gym_profiles_select on public.gym_profiles for select to authenticated
  using (gym_id in (select app.my_gym_ids()) or (select app.is_platform_admin()));
create policy gym_profiles_insert_manager on public.gym_profiles for insert to authenticated
  with check (gym_id in (select app.my_gym_ids(true, true)));
create policy gym_profiles_update_manager on public.gym_profiles for update to authenticated
  using (gym_id in (select app.my_gym_ids(true, true)))
  with check (gym_id in (select app.my_gym_ids(true, true)));

-- ── Нийтийн жагсаалт ────────────────────────────────────────────────────────
create function app.listed_gym_ids() returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select p.gym_id
  from public.gym_profiles p
  join public.gym_subscriptions s on s.gym_id = p.gym_id
  where p.is_published
    and s.verified_at is not null
    and app.subscription_status(s.suspended_at, s.paid_until, s.trial_ends_at, app.today_ub())
        in ('trial', 'active');
$$;

-- Жагсаалтын карт: үнэ нь идэвхтэй 1 сарын багцуудын хамгийн бага нь (фитнес нуугаагүй бол).
-- Үйлчлүүлэгч, ажилтан, орлого зэрэг дотоод мэдээлэл БУЦААХГҮЙ.
create function public.list_public_gyms()
returns table (
  slug text,
  name text,
  tagline text,
  area text,
  address text,
  latitude double precision,
  longitude double precision,
  logo_path text,
  cover_path text,
  amenities text[],
  opening_hours jsonb,
  price_from bigint
)
language sql stable security definer
set search_path = ''
as $$
  select
    p.slug, g.name, p.tagline, p.area, g.address, p.latitude, p.longitude,
    g.logo_path, p.photo_paths[1], p.amenities, p.opening_hours,
    case when p.show_prices then (
      select min(mp.price) from public.membership_plans mp
      where mp.gym_id = p.gym_id and mp.is_active and mp.deleted_at is null and mp.duration_months = 1
    ) end
  from public.gym_profiles p
  join public.gyms g on g.id = p.gym_id
  where p.gym_id in (select app.listed_gym_ids())
  order by g.name;
$$;

create function public.get_public_gym(p_slug text)
returns table (
  slug text,
  name text,
  tagline text,
  description text,
  area text,
  address text,
  contact_phone text,
  latitude double precision,
  longitude double precision,
  logo_path text,
  photo_paths text[],
  amenities text[],
  opening_hours jsonb,
  facebook_url text,
  instagram_url text,
  show_prices boolean,
  plans jsonb,
  updated_at timestamptz
)
language sql stable security definer
set search_path = ''
as $$
  select
    p.slug, g.name, p.tagline, p.description, p.area, g.address, p.contact_phone,
    p.latitude, p.longitude, g.logo_path, p.photo_paths, p.amenities, p.opening_hours,
    p.facebook_url, p.instagram_url, p.show_prices,
    case when p.show_prices then coalesce((
      select jsonb_agg(
               jsonb_build_object('name', mp.name, 'duration_months', mp.duration_months, 'price', mp.price)
               order by mp.sort_order, mp.duration_months, mp.price)
      from public.membership_plans mp
      where mp.gym_id = p.gym_id and mp.is_active and mp.deleted_at is null
    ), '[]'::jsonb) else '[]'::jsonb end,
    greatest(p.updated_at, g.updated_at)
  from public.gym_profiles p
  join public.gyms g on g.id = p.gym_id
  where p.slug = p_slug
    and p.gym_id in (select app.listed_gym_ids());
$$;

revoke execute on function public.list_public_gyms() from public;
revoke execute on function public.get_public_gym(text) from public;
grant execute on function public.list_public_gyms() to anon, authenticated;
grant execute on function public.get_public_gym(text) to anon, authenticated;

-- ── Зургийн bucket ──────────────────────────────────────────────────────────
-- Лого шиг public bucket (URL-ээр уншина, жагсаалт авах эрх байхгүй). SVG зөвшөөрөхгүй.
-- Зургийг хөтөч дээр 1600px болгож багасгаад байршуулдаг тул ихэнх нь 0.5MB-аас бага.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gym-photos', 'gym-photos', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy gym_photos_manager_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'gym-photos'
    and (storage.foldername(name))[1] in (select g::text from app.my_gym_ids(true, true) g)
  );
