import { z } from "zod";
import { isInMongolia, roundCoord } from "@/lib/geo";
import { normalizePhone } from "@/lib/phone";
import { isValidSlug, SLUG_MAX, SLUG_MIN } from "@/lib/slug";
import { optionalText } from "@/lib/validation";
import { AMENITY_CODES } from "./amenities";
import { AREA_CODES } from "./areas";
import { CLOSE_TIME, OPEN_TIME, type OpeningHours, WEEKDAYS, type Weekday } from "./hours";

export const MAX_PHOTOS = 8;

// ── Цагийн хуваарь ──────────────────────────────────────────────────────────
// Маягт дээр өдөр бүр: "амарна" эсвэл нээх/хаах цаг (<input type="time">).
// time input "24:00"-ийг дэмждэггүй тул хаах цаг "00:00" = шөнө дунд (24:00) гэж ойлгоно.

const dayFormSchema = z
  .object({ closed: z.boolean(), open: z.string(), close: z.string() })
  .superRefine((day, ctx) => {
    if (day.closed) return;
    const close = day.close === "00:00" ? "24:00" : day.close;
    if (!OPEN_TIME.test(day.open)) {
      ctx.addIssue({ code: "custom", path: ["open"], message: "Нээх цагаа оруулна уу" });
    } else if (!CLOSE_TIME.test(close)) {
      ctx.addIssue({ code: "custom", path: ["close"], message: "Хаах цагаа оруулна уу" });
    } else if (day.open >= close) {
      ctx.addIssue({ code: "custom", path: ["close"], message: "Хаах цаг нээх цагаас хойш байна" });
    }
  });

export type DayForm = z.input<typeof dayFormSchema>;
export type HoursForm = Record<Weekday, DayForm>;

const hoursFormSchema = z
  .object(Object.fromEntries(WEEKDAYS.map((d) => [d, dayFormSchema])) as Record<Weekday, typeof dayFormSchema>)
  .transform(
    (form) =>
      Object.fromEntries(
        WEEKDAYS.map((d) => {
          const day = form[d];
          return [d, day.closed ? null : [day.open, day.close === "00:00" ? "24:00" : day.close]];
        }),
      ) as OpeningHours,
  );

export function hoursToForm(hours: OpeningHours): HoursForm {
  return Object.fromEntries(
    WEEKDAYS.map((d) => {
      const day = hours[d];
      return [
        d,
        day
          ? { closed: false, open: day[0], close: day[1] === "24:00" ? "00:00" : day[1] }
          : { closed: true, open: "09:00", close: "18:00" },
      ];
    }),
  ) as HoursForm;
}

// ── Сошиал холбоос ─────────────────────────────────────────────────────────
/**
 * "facebook.com/khuchit", "https://m.facebook.com/khuchit", "khuchit" → "https://www.facebook.com/khuchit".
 * Instagram: "@khuchit", "instagram.com/khuchit" → "https://www.instagram.com/khuchit". Буруу бол null.
 */
export function normalizeSocialUrl(kind: "facebook" | "instagram", input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (kind === "instagram" && /^@?[A-Za-z0-9._]{1,30}$/.test(value)) {
    return `https://www.instagram.com/${value.replace(/^@/, "")}`;
  }
  if (kind === "facebook" && /^[A-Za-z0-9.-]{2,80}$/.test(value) && !/\.(com|mn)$/i.test(value)) {
    return `https://www.facebook.com/${value}`;
  }

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const allowed =
    kind === "facebook"
      ? /^([a-z]+\.)?(facebook\.com|fb\.com)$/.test(host)
      : /^(www\.)?instagram\.com$/.test(host);
  if (!allowed || url.pathname.length <= 1 || url.username || url.password) return null;

  const canonical = `https://www.${kind}.com${url.pathname}${url.search}`;
  return canonical.length <= 200 && !/\s/.test(canonical) ? canonical : null;
}

const socialUrl = (kind: "facebook" | "instagram") =>
  z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return null;
      const url = normalizeSocialUrl(kind, value);
      if (!url) {
        ctx.addIssue({
          code: "custom",
          message: kind === "facebook" ? "Facebook хуудасныхаа холбоосыг оруулна уу" : "Instagram хаягаа оруулна уу",
        });
        return z.NEVER;
      }
      return url;
    });

// ── Танилцуулгын маягт ─────────────────────────────────────────────────────
export const gymProfileSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .refine(isValidSlug, `${SLUG_MIN}–${SLUG_MAX} тэмдэгт: латин жижиг үсэг, тоо, зураас (-)`),
    isPublished: z.boolean(),
    tagline: optionalText("Товч тайлбар", 120),
    description: optionalText("Танилцуулга", 2000),
    area: z
      .union([z.literal(""), z.enum(AREA_CODES)], { error: "Дүүрэг, аймгаа сонгоно уу" })
      .transform((v) => v || null),
    location: z
      .object({ lat: z.number(), lng: z.number() })
      .nullable()
      .refine((v) => v === null || isInMongolia(v), "Байршил Монгол улсын нутагт байх ёстой")
      .transform((v) => (v ? { lat: roundCoord(v.lat), lng: roundCoord(v.lng) } : null)),
    contactPhone: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || normalizePhone(v) !== null, "Утасны дугаар 8 оронтой байх ёстой")
      .transform((v) => (v ? normalizePhone(v) : null)),
    hours: hoursFormSchema,
    amenities: z
      .array(z.enum(AMENITY_CODES))
      .transform((codes) => AMENITY_CODES.filter((c) => codes.includes(c))),
    showPrices: z.boolean(),
    facebookUrl: socialUrl("facebook"),
    instagramUrl: socialUrl("instagram"),
    photoPaths: z.array(z.string()).max(MAX_PHOTOS, `${MAX_PHOTOS} хүртэл зураг оруулна`),
  })
  .superRefine((v, ctx) => {
    if (!v.isPublished) return;
    if (!v.area) {
      ctx.addIssue({ code: "custom", path: ["area"], message: "Нийтлэхийн тулд дүүрэг, аймгаа сонгоно уу" });
    }
    if (!v.location) {
      ctx.addIssue({
        code: "custom",
        path: ["location"],
        message: "Нийтлэхийн тулд газрын зураг дээр байршлаа тэмдэглэнэ үү",
      });
    }
  });

export type GymProfileInput = z.input<typeof gymProfileSchema>;
export type GymProfileValues = z.output<typeof gymProfileSchema>;

/** Storage-д байршуулсан зургийн зам: {gym_id}/photo-{timestamp}.{ext}. DB-ийн шалгалттай ижил. */
export function isValidPhotoPath(path: string, gymId: string): boolean {
  return new RegExp(`^${gymId}/photo-\\d{10,16}\\.(jpg|png|webp)$`).test(path);
}
