import { slugify } from "@/lib/slug";
import type { SubscriptionStatus } from "@/lib/auth/context";
import { sortAmenities } from "./amenities";
import { isAreaCode } from "./areas";
import { DEFAULT_OPENING_HOURS, parseOpeningHours } from "./hours";
import type { MyListing } from "./queries";
import { type GymProfileInput, hoursToForm } from "./schemas";

export type ListingStatus = "live" | "pending" | "billing" | "draft" | "new";

/** Нийтэд харагдах эсэх, үгүй бол яагаад. DB-ийн app.listed_gym_ids()-тэй ижил дүрэм. */
export function listingStatus(listing: MyListing, subscription: SubscriptionStatus): ListingStatus {
  if (!listing.profile) return "new";
  if (!listing.profile.is_published) return "draft";
  if (subscription !== "trial" && subscription !== "active") return "billing";
  if (!listing.verified) return "pending";
  return "live";
}

/** Маягтын анхны утгууд. Танилцуулга байхгүй бол нэрээс хаяг, бүртгэлийн утас, түгээмэл хуваарь санал болгоно. */
export function listingFormDefaults({ profile, gym }: MyListing): GymProfileInput {
  if (!profile) {
    return {
      slug: slugify(gym.name),
      isPublished: false,
      tagline: "",
      description: "",
      area: "",
      location: null,
      contactPhone: gym.phone,
      hours: hoursToForm(DEFAULT_OPENING_HOURS),
      amenities: [],
      showPrices: true,
      facebookUrl: "",
      instagramUrl: "",
      photoPaths: [],
    };
  }
  return {
    slug: profile.slug,
    isPublished: profile.is_published,
    tagline: profile.tagline ?? "",
    description: profile.description ?? "",
    area: isAreaCode(profile.area) ? profile.area : "",
    location:
      profile.latitude != null && profile.longitude != null ? { lat: profile.latitude, lng: profile.longitude } : null,
    contactPhone: profile.contact_phone ?? "",
    hours: hoursToForm(parseOpeningHours(profile.opening_hours) ?? DEFAULT_OPENING_HOURS),
    amenities: sortAmenities(profile.amenities),
    showPrices: profile.show_prices,
    facebookUrl: profile.facebook_url ?? "",
    instagramUrl: profile.instagram_url ?? "",
    photoPaths: profile.photo_paths,
  };
}
