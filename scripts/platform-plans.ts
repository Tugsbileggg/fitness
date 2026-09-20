// Платформын сарын ашиглалтын анхны тарифууд.
// Локал seed (`pnpm db:seed`) ба cloud (`pnpm cloud:plans`) хоёулаа эндээс уншина.
// Үүсгэсний дараа админ /admin/plans дээрээс нэр, үнэ, хязгаарыг чөлөөтэй засна.
import type { Database } from "../src/types/database.types";

type PlatformPlanInsert = Database["public"]["Tables"]["platform_plans"]["Insert"];

export const PLATFORM_PLANS: PlatformPlanInsert[] = [
  {
    name: "Эхлэл",
    description: "Шинээр нээгдсэн жижиг заалуудад",
    max_clients: 100,
    monthly_price: 49000,
    sort_order: 1,
  },
  {
    name: "Стандарт",
    description: "Ихэнх фитнесүүдэд тохиромжтой",
    max_clients: 300,
    monthly_price: 99000,
    sort_order: 2,
  },
  {
    name: "Про",
    description: "Олон багштай, том фитнес",
    max_clients: null,
    monthly_price: 149000,
    sort_order: 3,
  },
];
