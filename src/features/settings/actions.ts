"use server";

import { revalidatePath } from "next/cache";
import { dbErrorMessage, gymActionContext } from "@/lib/auth/action-context";
import { type ActionResult, fail, fromZodError, ok } from "@/lib/validation";
import { gymSettingsSchema, isValidLogoPath, type GymSettingsInput } from "./schemas";

export async function updateGymSettings(input: GymSettingsInput): Promise<ActionResult> {
  const auth = await gymActionContext({ managerOnly: true });
  if (!auth.ok) return auth;
  const parsed = gymSettingsSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const { data, error } = await auth.supabase
    .from("gyms")
    .update({
      name: parsed.data.name,
      address: parsed.data.address,
      phone: parsed.data.phone,
      expiring_threshold_days: parsed.data.expiringThresholdDays,
    })
    .eq("id", auth.ctx.gym.id)
    .select("id");
  if (error) return fail(dbErrorMessage(error));
  if (!data?.length) return fail("Фитнесийн мэдээлэл хадгалагдсангүй");

  // Нэр, лого, хоног нь бүх хуудсанд (layout, dashboard) нөлөөлнө.
  revalidatePath("/", "layout");
  return ok(undefined, "Тохиргоо хадгалагдлаа");
}

/** Browser-оос Storage руу (RLS: зөвхөн өөрийн фитнесийн хавтас) байршуулсны дараа замыг хадгална. */
export async function setGymLogo(path: string | null): Promise<ActionResult> {
  const auth = await gymActionContext({ managerOnly: true });
  if (!auth.ok) return auth;
  if (path !== null && !isValidLogoPath(path, auth.ctx.gym.id)) return fail("Логоны файл буруу байна");

  const { error } = await auth.supabase.from("gyms").update({ logo_path: path }).eq("id", auth.ctx.gym.id);
  if (error) return fail(dbErrorMessage(error));

  revalidatePath("/", "layout");
  return ok(undefined, path ? "Лого шинэчлэгдлээ" : "Лого хасагдлаа");
}
