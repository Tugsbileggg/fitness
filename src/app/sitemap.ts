import type { MetadataRoute } from "next";
import { listPublicGyms } from "@/features/directory/queries";
import { publicEnv } from "@/lib/env";

// Шинэ фитнес нийтлэгдэхэд цагийн дотор орно.
export const revalidate = 3600;

/** Нийтийн хуудсууд ба "Фитнес хайх"-д харагдах фитнес бүр. DB уншиж чадахгүй бол үндсэн хуудсууд л. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = publicEnv.siteUrl;
  const pages: MetadataRoute.Sitemap = [
    { url: `${site}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/gyms`, changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/register`, changeFrequency: "monthly", priority: 0.5 },
  ];
  try {
    const gyms = await listPublicGyms();
    return [
      ...pages,
      ...gyms.map((gym) => ({ url: `${site}/gyms/${gym.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ];
  } catch {
    return pages;
  }
}
