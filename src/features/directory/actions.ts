"use server";

import { revalidatePath } from "next/cache";
import { dbErrorMessage, gymActionContext } from "@/lib/auth/action-context";
import { type ActionResult, fail, fromZodError, ok } from "@/lib/validation";
import { revalidateDirectory } from "./revalidate";
import { type GymProfileInput, gymProfileSchema, isValidPhotoPath } from "./schemas";

/** Фитнесийн нийтийн танилцуулгыг үүсгэх / засах (зөвхөн менежер, бичих эрхтэй үед). */
export async function saveGymProfile(input: GymProfileInput): Promise<ActionResult<{ slug: string }>> {
  const auth = await gymActionContext({ managerOnly: true });
  if (!auth.ok) return auth;
  const parsed = gymProfileSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const v = parsed.data;
  const gymId = auth.ctx.gym.id;

  if (v.photoPaths.some((path) => !isValidPhotoPath(path, gymId)) || new Set(v.photoPaths).size !== v.photoPaths.length) {
    return fail("Зургийн файл буруу байна. Хуудсаа сэргээгээд дахин оролдоно уу.");
  }

  const row = {
    slug: v.slug,
    is_published: v.isPublished,
    tagline: v.tagline,
    description: v.description,
    area: v.area,
    latitude: v.location?.lat ?? null,
    longitude: v.location?.lng ?? null,
    contact_phone: v.contactPhone,
    opening_hours: v.hours,
    amenities: v.amenities,
    show_prices: v.showPrices,
    facebook_url: v.facebookUrl,
    instagram_url: v.instagramUrl,
    photo_paths: v.photoPaths,
  };

  const { data: existing, error: readError } = await auth.supabase
    .from("gym_profiles")
    .select("gym_id")
    .eq("gym_id", gymId)
    .maybeSingle();
  if (readError) return fail(dbErrorMessage(readError));

  const { data, error } = existing
    ? await auth.supabase.from("gym_profiles").update(row).eq("gym_id", gymId).select("gym_id")
    : await auth.supabase.from("gym_profiles").insert({ gym_id: gymId, ...row }).select("gym_id");
  if (error) {
    if (error.code === "23505" && error.message.includes("slug")) {
      return fail("Энэ хаягийг өөр фитнес ашиглаж байна", { slug: "Энэ хаяг бүртгэлтэй байна. Өөр хаяг сонгоно уу." });
    }
    return fail(dbErrorMessage(error));
  }
  if (!data?.length) return fail("Танилцуулга хадгалагдсангүй. Хуудсаа сэргээгээд дахин оролдоно уу.");

  revalidateDirectory();
  revalidatePath("/listing");
  return ok({ slug: v.slug }, v.isPublished ? "Хадгалагдлаа" : "Ноорог хадгалагдлаа");
}
