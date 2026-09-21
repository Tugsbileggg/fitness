// Supabase Storage-ийн public bucket-уудын URL. Server, client хоёуланд ажиллана.
import { publicEnv } from "@/lib/env";

function publicObjectUrl(bucket: string, path: string | null | undefined): string | null {
  if (!path) return null;
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export function gymLogoUrl(path: string | null | undefined): string | null {
  return publicObjectUrl("gym-logos", path);
}

export function gymPhotoUrl(path: string | null | undefined): string | null {
  return publicObjectUrl("gym-photos", path);
}
