export { cn } from "cn";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Avatar-ын үсэг: "Батбаяр Ганзориг" → "БГ", нэг үгтэй бол эхний хоёр үсэг. */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
}

/** URL-ээс ирсэн id-г DB рүү явуулахаас өмнө шалгана (буруу бол 404). */
export function isUuid(value: string | null | undefined): value is string {
  return !!value && UUID.test(value);
}
