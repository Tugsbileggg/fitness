// Газарзүйн туслах функцууд.
// "Ойролцоох фитнес"-ийг хэрэглэгчийн хөтөч дээр тооцдог: хэрэглэгчийн байршил манай серверт очихгүй.

export type LatLng = { lat: number; lng: number };

/** Улаанбаатарын төв (Сүхбаатарын талбай). Газрын зургийн анхдагч төв. */
export const UB_CENTER: LatLng = { lat: 47.9189, lng: 106.9176 };

/** Монгол улсын нутаг дэвсгэр, ойролцоогоор. DB-ийн gym_profiles check-тэй ижил. */
export const MONGOLIA_BOUNDS = { minLat: 41.5, maxLat: 52.2, minLng: 87.7, maxLng: 120 } as const;

export function isInMongolia({ lat, lng }: LatLng): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= MONGOLIA_BOUNDS.minLat &&
    lat <= MONGOLIA_BOUNDS.maxLat &&
    lng >= MONGOLIA_BOUNDS.minLng &&
    lng <= MONGOLIA_BOUNDS.maxLng
  );
}

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Хоёр цэгийн хоорондох шулуун зай, метрээр (haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 850 → "850 м", 1234 → "1.2 км", 15600 → "16 км". */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "—";
  const rounded = Math.max(10, Math.round(meters / 10) * 10);
  if (rounded < 1000) return `${rounded} м`;
  if (meters < 9950) return `${(meters / 1000).toFixed(1)} км`;
  return `${Math.round(meters / 1000)} км`;
}

/** Google Maps-ийн чиглэл авах холбоос (утсан дээр апп нь нээгдэнэ). */
export function directionsUrl({ lat, lng }: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** Координатыг хадгалахад 6 орон (≈10 см) хангалттай. */
export function roundCoord(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
