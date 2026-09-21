// Нийтийн хуудасны хаяг (slug): "Хүчит фитнес" → "khuchit-fitnes".
// Монгол кириллийг латинаар (паспортын хэлбэрт ойр: х→kh, ө/ү→u, ц→ts) бичнэ.

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", ө: "u", п: "p", р: "r", с: "s", т: "t", у: "u",
  ү: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "y", ь: "i",
  э: "e", ю: "yu", я: "ya",
};

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MIN = 3;
export const SLUG_MAX = 60;

export function isValidSlug(value: string): boolean {
  return value.length >= SLUG_MIN && value.length <= SLUG_MAX && SLUG_PATTERN.test(value);
}

/** Нэрээс slug үүсгэнэ. Үр дүн үргэлж isValidSlug-ийг хангана. */
export function slugify(input: string): string {
  let out = "";
  for (const ch of input.toLowerCase()) {
    if (/[a-z0-9]/.test(ch)) out += ch;
    else if (ch in CYRILLIC_TO_LATIN) out += CYRILLIC_TO_LATIN[ch];
    else out += "-";
  }
  out = out.replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (out.length > SLUG_MAX) {
    out = out.slice(0, SLUG_MAX);
    // Үгийн дундуур тасрахаас сэргийлнэ.
    const cut = out.lastIndexOf("-");
    if (cut >= SLUG_MIN) out = out.slice(0, cut);
    out = out.replace(/-$/, "");
  }
  if (!out) return "fitnes";
  return out.length < SLUG_MIN ? `${out}-fitnes` : out;
}
