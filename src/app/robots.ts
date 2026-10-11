import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import { PROTECTED_PREFIXES } from "@/lib/supabase/proxy";

/** Нэвтэрсний дараах хуудсууд хайлтын системд хэрэггүй (proxy-гийн жагсаалттай ижил). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...PROTECTED_PREFIXES, "/auth"] },
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
  };
}
