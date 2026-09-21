import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Нийтийн "Фитнес хайх" хуудсуудын ISR кэшийг шинэчилнэ. Жагсаалтад нөлөөлөх өөрчлөлт бүрийн дараа
 * (танилцуулга, нэр/хаяг/лого, үнэ, баталгаажуулалт, платформын эрх) дуудна. Үгүй бол өөрчлөлт
 * revalidate хугацааны (5 минут) дараа л харагдана.
 */
export function revalidateDirectory() {
  revalidatePath("/"); // нүүр хуудсанд цөөн фитнес харагддаг
  // Файлын бүтцийн зам (route group-тэй): /gyms ба бүх /gyms/[slug] хуудсыг нэг дор хамарна.
  // "/gyms/[slug]" гэж бичвэл Next-ийн implicit tag (/(public)/gyms/[slug]/page)-тэй таарахгүй.
  revalidatePath("/(public)/gyms", "layout");
}
