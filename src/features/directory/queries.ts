import "server-only";
import { cache } from "react";
import { isValidSlug } from "@/lib/slug";
import { gymLogoUrl, gymPhotoUrl } from "@/lib/storage";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { sortAmenities } from "./amenities";
import { parseOpeningHours } from "./hours";
import type { PublicGym, PublicGymPlan, PublicGymSummary } from "./types";

// RPC-ийн гаралтын баганууд null байж болно (Supabase-ийн үүсгэсэн төрөл үүнийг заадаггүй).
type SummaryRow = {
  slug: string;
  name: string;
  tagline: string | null;
  area: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  logo_path: string | null;
  cover_path: string | null;
  amenities: string[] | null;
  opening_hours: unknown;
  price_from: number | null;
};

type DetailRow = {
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  area: string | null;
  address: string;
  contact_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  logo_path: string | null;
  photo_paths: string[] | null;
  amenities: string[] | null;
  opening_hours: unknown;
  facebook_url: string | null;
  instagram_url: string | null;
  show_prices: boolean;
  plans: unknown;
  updated_at: string;
};

function parsePlans(value: unknown): PublicGymPlan[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((p) =>
    p && typeof p.name === "string" && Number.isFinite(p.duration_months) && Number.isFinite(p.price)
      ? [{ name: p.name, months: Number(p.duration_months), price: Number(p.price) }]
      : [],
  );
}

function toDetail(row: DetailRow): PublicGym {
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    area: row.area,
    address: row.address,
    phone: row.contact_phone,
    location: row.latitude != null && row.longitude != null ? { lat: row.latitude, lng: row.longitude } : null,
    logoUrl: gymLogoUrl(row.logo_path),
    photos: (row.photo_paths ?? []).flatMap((p) => gymPhotoUrl(p) ?? []),
    amenities: sortAmenities(row.amenities),
    hours: parseOpeningHours(row.opening_hours),
    facebookUrl: row.facebook_url,
    instagramUrl: row.instagram_url,
    showPrices: row.show_prices,
    plans: parsePlans(row.plans),
    updatedAt: row.updated_at,
  };
}

/** Нийтэд харагдах бүх фитнес. Алдааг нуухгүй: ISR хуучин хуудсаа үргэлжлүүлэн үзүүлнэ. */
export async function listPublicGyms(): Promise<PublicGymSummary[]> {
  const { data, error } = await createPublicClient().rpc("list_public_gyms");
  if (error) throw new Error(`Фитнесийн жагсаалт уншихад алдаа гарлаа: ${error.message}`);
  return (data as SummaryRow[]).flatMap((row) =>
    row.latitude == null || row.longitude == null
      ? []
      : [
          {
            slug: row.slug,
            name: row.name,
            tagline: row.tagline,
            area: row.area,
            address: row.address,
            location: { lat: row.latitude, lng: row.longitude },
            logoUrl: gymLogoUrl(row.logo_path),
            coverUrl: gymPhotoUrl(row.cover_path),
            amenities: sortAmenities(row.amenities),
            hours: parseOpeningHours(row.opening_hours),
            priceFrom: row.price_from,
          },
        ],
  );
}

/** Нэг хүсэлтэд (generateMetadata + page) нэг л удаа уншина. */
export const getPublicGym = cache(async (slug: string): Promise<PublicGym | null> => {
  if (!isValidSlug(slug)) return null;
  const { data, error } = await createPublicClient().rpc("get_public_gym", { p_slug: slug }).maybeSingle();
  if (error) throw new Error(`Фитнесийн мэдээлэл уншихад алдаа гарлаа: ${error.message}`);
  return data ? toDetail(data as DetailRow) : null;
});

/**
 * Менежерт: өөрийн танилцуулга (RLS), фитнесийн үндсэн мэдээлэл, баталгаажуулалт, идэвхтэй багцууд.
 * Танилцуулга үүсгээгүй бол profile = null.
 */
export async function getMyListing(gymId: string) {
  const supabase = await createClient();
  const [profile, gym, subscription, plans] = await Promise.all([
    supabase.from("gym_profiles").select("*").eq("gym_id", gymId).maybeSingle(),
    supabase.from("gyms").select("name, address, phone, logo_path, updated_at").eq("id", gymId).single(),
    supabase.from("gym_subscriptions").select("verified_at").eq("gym_id", gymId).single(),
    supabase
      .from("membership_plans")
      .select("name, duration_months, price")
      .eq("gym_id", gymId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("sort_order")
      .order("duration_months"),
  ]);
  for (const res of [profile, gym, subscription, plans]) {
    if (res.error) throw new Error(`Танилцуулга уншихад алдаа гарлаа: ${res.error.message}`);
  }
  return {
    profile: profile.data,
    gym: gym.data!,
    verified: Boolean(subscription.data?.verified_at),
    plans: (plans.data ?? []).map((p) => ({ name: p.name, months: p.duration_months, price: p.price })),
  };
}

export type MyListing = Awaited<ReturnType<typeof getMyListing>>;

/** Менежерийн урьдчилан харах: өөрийн өгөгдлөөс нийтийн хуудасны хэлбэрийг үүсгэнэ. */
export function listingToPublicGym({ profile, gym, plans }: MyListing): PublicGym | null {
  if (!profile) return null;
  return toDetail({
    ...profile,
    name: gym.name,
    address: gym.address,
    logo_path: gym.logo_path,
    // Нийтийн RPC-тэй адил: үнээ нуусан бол багц харуулахгүй.
    plans: profile.show_prices ? plans.map((p) => ({ name: p.name, duration_months: p.months, price: p.price })) : [],
    updated_at: profile.updated_at > gym.updated_at ? profile.updated_at : gym.updated_at,
  });
}

/** Админд: фитнес бүрийн танилцуулгын хаяг ба нийтлэсэн эсэх (RLS: админ бүгдийг уншина). */
export async function listProfileFlags(): Promise<Map<string, { slug: string; isPublished: boolean }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("gym_profiles").select("gym_id, slug, is_published");
  if (error) throw new Error(`Танилцуулга уншихад алдаа гарлаа: ${error.message}`);
  return new Map(data.map((p) => [p.gym_id, { slug: p.slug, isPublished: p.is_published }]));
}
