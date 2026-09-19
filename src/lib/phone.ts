// Монгол утасны дугаар: 8 оронтой, 0-ээр эхлэхгүй.

const PHONE = /^[1-9]\d{7}$/;

/**
 * Хэрэглэгчийн оруулсан дугаарыг 8 оронтой хэлбэрт оруулна.
 * "9911-2233", "9911 2233", "+976 99112233" → "99112233". Буруу бол null.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = input.replace(/[\s\-(). ]/g, "");
  if (digits.startsWith("+976")) digits = digits.slice(4);
  else if (digits.startsWith("00976")) digits = digits.slice(5);
  else if (digits.startsWith("976") && digits.length === 11) digits = digits.slice(3);
  return PHONE.test(digits) ? digits : null;
}

export function isValidPhone(input: string | null | undefined): boolean {
  return normalizePhone(input) !== null;
}

/** "99112233" → "9911 2233" */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  return /^\d{8}$/.test(phone) ? `${phone.slice(0, 4)} ${phone.slice(4)}` : phone;
}
