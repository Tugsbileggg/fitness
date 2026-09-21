// Фитнесийн байршлын бүс: Улаанбаатарын 9 дүүрэг ба 21 аймаг.
// DB хуулбар: app.directory_areas() (supabase/migrations/20260921000100_gym_directory.sql).
// "Сүхбаатар" дүүрэг ба аймаг хоёулаа байдаг тул кодоор ялгана.

export const AREAS = [
  { code: "ub_baganuur", label: "Багануур дүүрэг", group: "ub" },
  { code: "ub_bagakhangai", label: "Багахангай дүүрэг", group: "ub" },
  { code: "ub_bayangol", label: "Баянгол дүүрэг", group: "ub" },
  { code: "ub_bayanzurkh", label: "Баянзүрх дүүрэг", group: "ub" },
  { code: "ub_nalaikh", label: "Налайх дүүрэг", group: "ub" },
  { code: "ub_songinokhairkhan", label: "Сонгинохайрхан дүүрэг", group: "ub" },
  { code: "ub_sukhbaatar", label: "Сүхбаатар дүүрэг", group: "ub" },
  { code: "ub_khan_uul", label: "Хан-Уул дүүрэг", group: "ub" },
  { code: "ub_chingeltei", label: "Чингэлтэй дүүрэг", group: "ub" },
  { code: "arkhangai", label: "Архангай аймаг", group: "aimag" },
  { code: "bayan_ulgii", label: "Баян-Өлгий аймаг", group: "aimag" },
  { code: "bayankhongor", label: "Баянхонгор аймаг", group: "aimag" },
  { code: "bulgan", label: "Булган аймаг", group: "aimag" },
  { code: "govi_altai", label: "Говь-Алтай аймаг", group: "aimag" },
  { code: "govisumber", label: "Говьсүмбэр аймаг", group: "aimag" },
  { code: "darkhan_uul", label: "Дархан-Уул аймаг", group: "aimag" },
  { code: "dornogovi", label: "Дорноговь аймаг", group: "aimag" },
  { code: "dornod", label: "Дорнод аймаг", group: "aimag" },
  { code: "dundgovi", label: "Дундговь аймаг", group: "aimag" },
  { code: "zavkhan", label: "Завхан аймаг", group: "aimag" },
  { code: "orkhon", label: "Орхон аймаг", group: "aimag" },
  { code: "uvurkhangai", label: "Өвөрхангай аймаг", group: "aimag" },
  { code: "umnugovi", label: "Өмнөговь аймаг", group: "aimag" },
  { code: "sukhbaatar", label: "Сүхбаатар аймаг", group: "aimag" },
  { code: "selenge", label: "Сэлэнгэ аймаг", group: "aimag" },
  { code: "tuv", label: "Төв аймаг", group: "aimag" },
  { code: "uvs", label: "Увс аймаг", group: "aimag" },
  { code: "khovd", label: "Ховд аймаг", group: "aimag" },
  { code: "khuvsgul", label: "Хөвсгөл аймаг", group: "aimag" },
  { code: "khentii", label: "Хэнтий аймаг", group: "aimag" },
] as const;

export type AreaCode = (typeof AREAS)[number]["code"];

export const AREA_CODES = AREAS.map((a) => a.code) as [AreaCode, ...AreaCode[]];

export const AREA_GROUPS = [
  { key: "ub", label: "Улаанбаатар" },
  { key: "aimag", label: "Орон нутаг" },
] as const;

const LABELS = new Map<string, string>(AREAS.map((a) => [a.code, a.label]));

export function isAreaCode(value: unknown): value is AreaCode {
  return typeof value === "string" && LABELS.has(value);
}

export function areaLabel(code: string | null | undefined): string | null {
  return code ? (LABELS.get(code) ?? null) : null;
}
