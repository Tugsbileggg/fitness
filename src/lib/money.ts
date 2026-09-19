// Мөнгөн дүнг бүхэл төгрөгөөр (₮) хадгалж, "1,250,000₮" хэлбэрээр харуулна.

const groupFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

/** 1250000 → "1,250,000₮". Хоосон утгад "—" буцаана. */
export function formatMNT(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return `${groupFormatter.format(amount)}₮`;
}

/** Бичих явцад харуулах: "1250000" → "1,250,000" (₮ тэмдэггүй). */
export function formatMNTInput(input: string): string {
  const digits = input.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Хэрэглэгчийн оруулсан дүнг тоо болгоно: "1,250,000", "1 250 000₮", "1.250.000" → 1250000.
 * Бутархай, сөрөг эсвэл буруу утгад null буцаана.
 */
export function parseMNT(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  if (typeof input === "number") {
    return Number.isSafeInteger(input) && input >= 0 ? input : null;
  }
  const cleaned = input.trim().replace(/[\s,.'₮ ]/g, "");
  if (!/^\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isSafeInteger(value) ? value : null;
}
