import type { LatLng } from "@/lib/geo";
import type { AmenityCode } from "./amenities";
import type { OpeningHours } from "./hours";

/** Жагсаалтын карт. Хэрэглэгчийн хөтөч рүү бүтнээрээ очдог тул зөвхөн нийтийн мэдээлэл. */
export type PublicGymSummary = {
  slug: string;
  name: string;
  tagline: string | null;
  area: string | null;
  address: string;
  location: LatLng;
  logoUrl: string | null;
  coverUrl: string | null;
  amenities: AmenityCode[];
  hours: OpeningHours | null;
  /** Хамгийн хямд 1 сарын эрх. Фитнес үнээ нуусан эсвэл 1 сарын багцгүй бол null. */
  priceFrom: number | null;
};

export type PublicGymPlan = { name: string; months: number; price: number };

/** Фитнесийн нийтийн хуудас. Урьдчилан харахад (нийтлээгүй үед) байршил байхгүй байж болно. */
export type PublicGym = {
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  area: string | null;
  address: string;
  phone: string | null;
  location: LatLng | null;
  logoUrl: string | null;
  photos: string[];
  amenities: AmenityCode[];
  hours: OpeningHours | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  showPrices: boolean;
  plans: PublicGymPlan[];
  updatedAt: string;
};
