// Үйлчлүүлэгч хайх текстийг тайлбарлана: тоо бол утсаар, үгүй бол нэрээр.

export type ClientSearch =
  | { kind: "phone"; pattern: string }
  | { kind: "name"; pattern: string }
  | null;

/** LIKE-ийн тусгай тэмдэгтүүдийг (\ % _) escape хийнэ. */
export function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function parseClientSearch(input: string | null | undefined): ClientSearch {
  const q = (input ?? "").trim().replace(/\s+/g, " ").slice(0, 100);
  if (!q) return null;

  if (/^[+\d\s\-()]+$/.test(q)) {
    let digits = q.replace(/\D/g, "");
    if (digits.length > 8 && digits.startsWith("976")) digits = digits.slice(3);
    if (!digits) return null;
    return { kind: "phone", pattern: `%${digits}%` };
  }
  return { kind: "name", pattern: `%${escapeLike(q)}%` };
}
