export { cn } from "cn";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** URL-ээс ирсэн id-г DB рүү явуулахаас өмнө шалгана (буруу бол 404). */
export function isUuid(value: string | null | undefined): value is string {
  return !!value && UUID.test(value);
}
