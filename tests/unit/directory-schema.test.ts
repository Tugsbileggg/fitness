import { describe, expect, it } from "vitest";
import { DEFAULT_OPENING_HOURS } from "@/features/directory/hours";
import {
  type GymProfileInput,
  gymProfileSchema,
  hoursToForm,
  isValidPhotoPath,
  normalizeSocialUrl,
} from "@/features/directory/schemas";

const GYM_ID = "f38fba83-0168-4df4-8de1-f7bc2fb24c13";

const base = (): GymProfileInput => ({
  slug: "khuchit-fitnes",
  isPublished: true,
  tagline: "Товч",
  description: "",
  area: "ub_bayanzurkh",
  location: { lat: 47.9187123456, lng: 106.9612987654 },
  contactPhone: "9911-2233",
  hours: hoursToForm(DEFAULT_OPENING_HOURS),
  amenities: ["wifi", "cardio"],
  showPrices: true,
  facebookUrl: "",
  instagramUrl: "",
  photoPaths: [],
});

describe("normalizeSocialUrl", () => {
  it.each([
    ["facebook", "khuchit.fitness", "https://www.facebook.com/khuchit.fitness"],
    ["facebook", "facebook.com/khuchit", "https://www.facebook.com/khuchit"],
    ["facebook", "https://m.facebook.com/khuchit", "https://www.facebook.com/khuchit"],
    ["facebook", "https://fb.com/khuchit", "https://www.facebook.com/khuchit"],
    ["facebook", "https://www.facebook.com/profile.php?id=100012345", "https://www.facebook.com/profile.php?id=100012345"],
    ["instagram", "@khuchit_gym", "https://www.instagram.com/khuchit_gym"],
    ["instagram", "khuchit.gym", "https://www.instagram.com/khuchit.gym"],
    ["instagram", "instagram.com/khuchit", "https://www.instagram.com/khuchit"],
  ] as const)("%s: %s", (kind, input, expected) => {
    expect(normalizeSocialUrl(kind, input)).toBe(expected);
  });

  it.each([
    ["facebook", "https://evil.example.com/facebook.com/x"],
    ["facebook", "https://facebook.com.evil.mn/x"],
    ["facebook", "https://www.facebook.com/"],
    ["facebook", "javascript:alert(1)"],
    ["instagram", "https://instagram.com.evil.mn/x"],
    ["instagram", "https://user:pass@instagram.com/x"],
    ["instagram", "хаяг"],
  ] as const)("хүлээн авахгүй — %s: %s", (kind, input) => {
    expect(normalizeSocialUrl(kind, input)).toBeNull();
  });
});

describe("gymProfileSchema", () => {
  it("утгуудыг хэвшүүлнэ: утас, координат (6 орон), үйлчилгээний дараалал", () => {
    const v = gymProfileSchema.parse(base());
    expect(v.contactPhone).toBe("99112233");
    expect(v.location).toEqual({ lat: 47.918712, lng: 106.961299 });
    expect(v.amenities).toEqual(["cardio", "wifi"]);
    expect(v.description).toBeNull();
    expect(v.hours).toEqual(DEFAULT_OPENING_HOURS);
  });

  it("хаах цаг 00:00 = шөнө дунд (24:00)", () => {
    const input = base();
    input.hours.fri = { closed: false, open: "07:00", close: "00:00" };
    expect(gymProfileSchema.parse(input).hours.fri).toEqual(["07:00", "24:00"]);
  });

  it("амарна гэвэл null, цагийг шалгахгүй", () => {
    const input = base();
    input.hours.sun = { closed: true, open: "", close: "" };
    expect(gymProfileSchema.parse(input).hours.sun).toBeNull();
  });

  it("хаах цаг нээхээс өмнө байж болохгүй", () => {
    const input = base();
    input.hours.mon = { closed: false, open: "22:00", close: "07:00" };
    const result = gymProfileSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["hours", "mon", "close"]);
  });

  it("нийтлэхэд дүүрэг ба байршил заавал", () => {
    const result = gymProfileSchema.safeParse({ ...base(), area: "", location: null });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path.join("."))).toEqual(["area", "location"]);
  });

  it("ноорог үед дүүрэг, байршилгүй хадгална", () => {
    const v = gymProfileSchema.parse({ ...base(), isPublished: false, area: "", location: null });
    expect(v.area).toBeNull();
    expect(v.location).toBeNull();
  });

  it("Монголоос гадуурх байршил, буруу хаяг, буруу утас", () => {
    expect(gymProfileSchema.safeParse({ ...base(), location: { lat: 39.9, lng: 116.4 } }).success).toBe(false);
    expect(gymProfileSchema.safeParse({ ...base(), slug: "Хүчит" }).success).toBe(false);
    expect(gymProfileSchema.safeParse({ ...base(), contactPhone: "123" }).success).toBe(false);
  });
});

describe("isValidPhotoPath", () => {
  it("зөвхөн өөрийн фитнесийн хавтас", () => {
    expect(isValidPhotoPath(`${GYM_ID}/photo-17899980040332.jpg`, GYM_ID)).toBe(true);
    expect(isValidPhotoPath(`${GYM_ID}/photo-1789998004.webp`, GYM_ID)).toBe(true);
    expect(isValidPhotoPath(`00000000-0000-0000-0000-000000000000/photo-17899980040332.jpg`, GYM_ID)).toBe(false);
    expect(isValidPhotoPath(`${GYM_ID}/../photo-17899980040332.jpg`, GYM_ID)).toBe(false);
    expect(isValidPhotoPath(`${GYM_ID}/photo-17899980040332.svg`, GYM_ID)).toBe(false);
  });
});
