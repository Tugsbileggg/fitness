// Seed-ийн туслах өгөгдөл: тогтмол үртэй санамсаргүй тоо, монгол нэрс, утасны дугаар.

/** Тогтмол үртэй (deterministic) санамсаргүй тоо: seed бүрт ижил өгөгдөл гарна. */
export function createRng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]) => items[Math.floor(next() * items.length)],
    chance: (p: number) => next() < p,
  };
}
export type Rng = ReturnType<typeof createRng>;

const FATHER_NAMES = [
  "Батбаяр", "Ганбаатар", "Дорж", "Энхбат", "Мөнхбат", "Цэрэн", "Баатар", "Отгонбаяр",
  "Пүрэв", "Сүхбаатар", "Төмөр", "Жаргал", "Лхагва", "Нямдорж", "Очир", "Ганзориг",
  "Эрдэнэ", "Батсайхан", "Болд", "Хүрэлбаатар",
];

const MALE_NAMES = [
  "Батболд", "Тэмүүлэн", "Билгүүн", "Эрдэнэбат", "Ганбат", "Мөнх-Эрдэнэ", "Төгөлдөр", "Анар",
  "Бат-Очир", "Хулан-Эрдэнэ", "Сүх-Очир", "Энхтүвшин", "Тэмүүжин", "Ариунболд", "Өлзийбаяр",
  "Мягмар", "Цогтбаяр", "Үүрцайх",
];

const FEMALE_NAMES = [
  "Энхжин", "Номин", "Сарангэрэл", "Анужин", "Мишээл", "Хулан", "Солонго", "Оюунчимэг",
  "Нарангэрэл", "Уянга", "Мөнхзул", "Цэцэгмаа", "Өнөржаргал", "Ариунаа", "Гэрэлмаа",
  "Золзаяа", "Үүрийнтуяа", "Дөлгөөн",
];

const PHONE_PREFIXES = ["99", "95", "94", "88", "89", "86", "80", "91", "96", "85"];

const CLIENT_NOTES = [
  "Өвдөгний хуучин бэртэлтэй, суултын дасгалд болгоомжтой.",
  "Жин хасах зорилготой.",
  "Өглөө 7 цагт ирдэг.",
  "Нурууны өвдөлттэй, эмчийн зөвлөгөөтэй.",
  "Тэмцээнд бэлтгэж байгаа.",
  "Анх удаа фитнест явж байгаа.",
];

export function mongolianName(rng: Rng, gender: "male" | "female") {
  const father = rng.pick(FATHER_NAMES);
  const given = rng.pick(gender === "male" ? MALE_NAMES : FEMALE_NAMES);
  return `${father} ${given}`;
}

export function phoneNumber(rng: Rng, used: Set<string>) {
  for (;;) {
    const phone = `${rng.pick(PHONE_PREFIXES)}${String(rng.int(0, 999999)).padStart(6, "0")}`;
    if (!used.has(phone)) {
      used.add(phone);
      return phone;
    }
  }
}

export function clientNote(rng: Rng) {
  return rng.chance(0.2) ? rng.pick(CLIENT_NOTES) : null;
}

export const TRAINER_PROFILES = [
  { name: "Ганбаатар Тэмүүлэн", specialization: "Хүндийн өргөлт, бодибилдинг" },
  { name: "Цэрэн Номин", specialization: "Йог, сунгалт" },
  { name: "Болд Анар", specialization: "Кроссфит, функциональ дасгал" },
  { name: "Лхагва Солонго", specialization: "Аэробик, зумба" },
  { name: "Эрдэнэ Билгүүн", specialization: "Бокс, кардио" },
  { name: "Очир Уянга", specialization: "Пилатес, нөхөн сэргээх дасгал" },
];
