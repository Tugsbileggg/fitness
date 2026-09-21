// Фитнесийн үйлчилгээ, тоног төхөөрөмж. DB хуулбар: app.directory_amenities().
// Icon-ууд components/amenity-icons.tsx-д (скриптүүд React-гүйгээр энэ файлыг ашиглана).

export const AMENITIES = [
  { code: "cardio", label: "Кардио" },
  { code: "free_weights", label: "Чөлөөт жин" },
  { code: "machines", label: "Тренажер" },
  { code: "group_classes", label: "Групп хичээл" },
  { code: "personal_training", label: "Хувийн дасгалжуулагч" },
  { code: "yoga", label: "Йог" },
  { code: "martial_arts", label: "Бокс, тулааны урлаг" },
  { code: "crossfit", label: "Кроссфит" },
  { code: "sauna", label: "Саун" },
  { code: "shower", label: "Шүршүүр" },
  { code: "lockers", label: "Хувцасны шүүгээ" },
  { code: "parking", label: "Зогсоол" },
  { code: "women_only", label: "Эмэгтэйчүүдийн заал" },
  { code: "kids", label: "Хүүхдийн хичээл" },
  { code: "wifi", label: "Wi-Fi" },
  { code: "massage", label: "Массаж" },
  { code: "pool", label: "Усан бассейн" },
  { code: "cafe", label: "Кафе, ундаа" },
] as const;

export type AmenityCode = (typeof AMENITIES)[number]["code"];

export const AMENITY_CODES = AMENITIES.map((a) => a.code) as [AmenityCode, ...AmenityCode[]];

const LABELS = new Map<string, string>(AMENITIES.map((a) => [a.code, a.label]));

export function amenityLabel(code: string): string {
  return LABELS.get(code) ?? code;
}

/** DB-ээс ирсэн жагсаалтыг тогтмол дараалалд оруулж, танигдахгүй утгыг хасна. */
export function sortAmenities(codes: readonly string[] | null | undefined): AmenityCode[] {
  const set = new Set(codes ?? []);
  return AMENITY_CODES.filter((c) => set.has(c));
}
