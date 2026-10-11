import { createClient } from "@supabase/supabase-js";
import { ArrowRightIcon, LocateFixedIcon } from "lucide-react";
import type { Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { GymCard } from "@/features/directory/components/gym-card";
import { listPublicGyms } from "@/features/directory/queries";
import { FeatureBento } from "@/features/landing/components/feature-bento";
import { HeroPreview } from "@/features/landing/components/hero-preview";
import { PricingPlans } from "@/features/landing/components/pricing-plans";
import { APP_NAME, TRIAL_DAYS } from "@/lib/config";
import type { Database } from "@/types/database.types";

// Нүүр хуудсыг цагт нэг удаа шинэчилнэ (тарифын үнэ өөрчлөгдвөл).
export const revalidate = 3600;

// Толгой хэсэг бараан тул хөтчийн дээд мөр ч бас бараан (globals.css-ийн --ink).
export const viewport: Viewport = { themeColor: "#0f1410" };

async function getPlans() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  try {
    const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });
    const { data } = await supabase
      .from("platform_plans")
      .select("id, name, description, max_clients, monthly_price")
      .eq("is_active", true)
      .order("sort_order");
    return data ?? [];
  } catch {
    return [];
  }
}

/** Нүүр хуудсанд цөөн фитнес (зурагтай нь эхэнд). Алдаа гарвал хэсгийг нуух (нүүр хуудас унахгүй). */
async function getFeaturedGyms() {
  try {
    const gyms = await listPublicGyms();
    return [...gyms.filter((g) => g.coverUrl), ...gyms.filter((g) => !g.coverUrl)].slice(0, 3);
  } catch {
    return [];
  }
}

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="max-w-2xl space-y-3">
      <p className="text-sm font-semibold text-accent-foreground">{eyebrow}</p>
      <h2 className="font-display text-3xl leading-tight tracking-tight text-balance sm:text-4xl">{title}</h2>
      {children && <p className="text-lg text-muted-foreground">{children}</p>}
    </div>
  );
}

export default async function HomePage() {
  const [plans, gyms] = await Promise.all([getPlans(), getFeaturedGyms()]);

  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader className="dark" />

      <main className="flex-1">
        <section className="dark bg-background text-foreground">
          <div className="mx-auto max-w-6xl px-4 pt-16 pb-44 text-center sm:pt-24 sm:pb-60">
            <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
              <span className="size-2 rounded-full bg-brand" aria-hidden />
              {TRIAL_DAYS} хоног үнэгүй · Апп татах шаардлагагүй
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl font-display text-[2rem] leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Фитнесийнхээ үйлчлүүлэгч, төлбөрийг <span className="text-brand">нэг дороос</span> хянаарай
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Дэвтэр, Excel хэрэггүй. Хэний эрх хэзээ дуусахыг {APP_NAME} танд өөрөө сануулна.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  {TRIAL_DAYS} хоног үнэгүй туршиж үзэх
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Нэвтрэх</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="-mt-36 px-4 sm:-mt-48">
          <HeroPreview />
        </div>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-16 space-y-10 px-4 py-20 sm:py-28">
          <SectionHeading eyebrow="Боломжууд" title="Фитнесээ удирдахад хэрэгтэй бүхэн">
            Үйлчлүүлэгч бүртгэхээс эхлээд сарын орлогын тайлан хүртэл, бүгд нэг газар.
          </SectionHeading>
          <FeatureBento />
        </section>

        <section className="border-y bg-card">
          <div className="mx-auto max-w-6xl space-y-10 px-4 py-20">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading eyebrow="Фитнес хайх" title="Фитнес хайж байна уу?">
                Ойролцоох фитнесүүдийн үнэ, цагийн хуваарь, байршил, үйлчилгээг нэг дороос харьцуулаарай.
              </SectionHeading>
              <Button asChild size="lg" variant="outline" className="shrink-0">
                <Link href="/gyms">
                  <LocateFixedIcon />
                  Ойролцоох фитнес хайх
                </Link>
              </Button>
            </div>
            {gyms.length > 0 && (
              <>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gyms.map((gym) => (
                    <li key={gym.slug} className="flex">
                      <GymCard gym={gym} distance={null} />
                    </li>
                  ))}
                </ul>
                <Link href="/gyms" className="inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                  Бүх фитнесийг харах
                  <ArrowRightIcon className="size-4" />
                </Link>
              </>
            )}
          </div>
        </section>

        {plans.length > 0 && (
          <section id="pricing" className="mx-auto max-w-6xl scroll-mt-16 space-y-12 px-4 py-20 sm:py-28">
            <SectionHeading eyebrow="Үнэ" title="Энгийн, ил тод үнэ">
              Бүх багцад бүх боломж багтсан, ялгаа нь зөвхөн үйлчлүүлэгчийн тоо. {TRIAL_DAYS} хоног үнэгүй туршаад,
              дараа нь сар бүр дансаар төлнө.
            </SectionHeading>
            <PricingPlans plans={plans} />
          </section>
        )}

        <section className="px-4 pb-20">
          <div className="dark mx-auto max-w-6xl overflow-hidden rounded-3xl bg-background px-6 py-14 text-center text-foreground sm:py-20">
            <h2 className="mx-auto max-w-2xl font-display text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
              Дараагийн сунгалтыг <span className="text-brand">бүү алд</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
              Имэйлээрээ бүртгүүлээд {TRIAL_DAYS} хоногийн турш бүх боломжийг үнэгүй ашиглаарай.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/register">
                Фитнесээ бүртгүүлэх
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
