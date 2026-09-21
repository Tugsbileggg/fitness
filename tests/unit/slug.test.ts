import { describe, expect, it } from "vitest";
import { isValidSlug, slugify } from "@/lib/slug";

describe("slugify", () => {
  it.each([
    ["Хүчит фитнес", "khuchit-fitnes"],
    ["Эрч хүч спорт клуб", "erch-khuch-sport-klub"],
    ["Өдөр шөнө 24/7 жим", "udur-shunu-24-7-jim"],
    ["Цэцэг йог студи", "tsetseg-iog-studi"],
    ["Power Gym", "power-gym"],
    ["  --Шинэ   заал--  ", "shine-zaal"],
    ["Дархан-Уул", "darkhan-uul"],
    ["Ёроол Юу Яах", "yorool-yuu-yaakh"],
  ])("%s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("хэт богино бол нөхнө", () => {
    expect(slugify("Би")).toBe("bi-fitnes");
    expect(slugify("")).toBe("fitnes");
    expect(slugify("!!!")).toBe("fitnes");
  });

  it("60 тэмдэгтээс хэтрэхгүй, үгийн дундуур тасрахгүй", () => {
    const slug = slugify("Улаанбаатар хотын Баянзүрх дүүргийн хамгийн том фитнес спорт цогцолбор");
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
    expect(isValidSlug(slug)).toBe(true);
  });

  it("үр дүн үргэлж хүчинтэй", () => {
    for (const name of ["Хүчит фитнес", "A", "Ъ", "Фитнес №1", "ЖИМ & СПА"]) {
      expect(isValidSlug(slugify(name))).toBe(true);
    }
  });
});

describe("isValidSlug", () => {
  it.each(["abc", "khuchit-fitnes", "gym-24", "a1b2c3"])("%s хүчинтэй", (slug) => {
    expect(isValidSlug(slug)).toBe(true);
  });

  it.each(["ab", "Khuchit", "khuchit_fitnes", "-gym", "gym-", "gym--24", "хүчит", "a".repeat(61)])(
    "%s хүчингүй",
    (slug) => {
      expect(isValidSlug(slug)).toBe(false);
    },
  );
});
