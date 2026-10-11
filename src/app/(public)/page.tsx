import { createClient } from "@supabase/supabase-js";
import { ArrowRightIcon, LocateFixedIcon } from "lucide-react";
import type { Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { PointerGlow, ScrollEffects } from "@/components/motion-effects";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { GymCard } from "@/features/directory/components/gym-card";
import { listPublicGyms } from "@/features/directory/queries";
import { DumbbellHero } from "@/features/landing/components/dumbbell-hero";
import { FeatureBento } from "@/features/landing/components/feature-bento";
import { HeroPreview } from "@/features/landing/components/hero-preview";
import { PricingPlans } from "@/features/landing/components/pricing-plans";
import { ctaDumbbell, directoryGym, heroGym } from "@/features/landing/images";
import { APP_NAME, TRIAL_DAYS } from "@/lib/config";
import { revealDelay } from "@/lib/motion";
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

// Hero-гийн мөрүүд ачаалахад дараалан гарч ирнэ (эхний дэлгэцэнд байгаа тул data-reveal биш).
const ENTER =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-700 motion-safe:ease-out motion-safe:fill-mode-backwards";

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div data-reveal className="max-w-2xl space-y-3">
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
      <ScrollEffects />
      <PointerGlow />
      <PublicHeader className="dark" />

      <main className="flex-1">
        <DumbbellHero
          background={
            <>
              <Image
                src={heroGym}
                alt=""
                fill
                priority
                placeholder="blur"
                sizes="100vw"
                className="-z-10 object-cover object-[center_40%] opacity-25 grayscale-[35%]"
              />
              <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-b from-ink/70 via-ink/85 to-ink" />
              <div aria-hidden data-spotlight className="absolute inset-0 -z-10" />
            </>
          }
        >
          <p
            className={`inline-flex items-center gap-2 rounded-full border bg-background/40 px-3 py-1 text-sm text-muted-foreground backdrop-blur ${ENTER}`}
          >
            <span className="size-2 rounded-full bg-brand" aria-hidden />
            {TRIAL_DAYS} хоног үнэгүй · Апп татах шаардлагагүй
          </p>
          <h1
            className={`mx-auto mt-5 max-w-4xl font-display text-[1.75rem] leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl ${ENTER} motion-safe:delay-100`}
          >
            Фитнесийнхээ үйлчлүүлэгч, төлбөрийг <span className="text-brand">нэг дороос</span> хянаарай
          </h1>
          <p className={`mx-auto mt-4 max-w-xl text-muted-foreground sm:text-lg ${ENTER} motion-safe:delay-200`}>
            Дэвтэр, Excel хэрэггүй. Хэний эрх хэзээ дуусахыг {APP_NAME} танд өөрөө сануулна.
          </p>
          <div className={`mt-6 flex flex-col justify-center gap-3 sm:flex-row ${ENTER} motion-safe:delay-300`}>
            <Button asChild size="lg">
              <Link href="/register">
                {TRIAL_DAYS} хоног үнэгүй туршиж үзэх
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="max-sm:hidden">
              <Link href="/login">Нэвтрэх</Link>
            </Button>
          </div>
        </DumbbellHero>

        <div className="dark bg-background px-4 pt-4 pb-16 sm:pb-24">
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
            <div data-reveal className="dark relative isolate overflow-hidden rounded-3xl bg-background text-foreground">
              <Image
                src={directoryGym}
                alt=""
                fill
                placeholder="blur"
                sizes="(min-width: 1152px) 1120px, 100vw"
                className="-z-10 object-cover object-[center_45%] opacity-60"
              />
              <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-ink via-ink/85 to-ink/20" />
              <div className="flex flex-col gap-8 px-6 py-12 sm:px-12 sm:py-16 md:flex-row md:items-end md:justify-between">
                <SectionHeading eyebrow="Фитнес хайх" title="Фитнес хайж байна уу?">
                  Ойролцоох фитнесүүдийн үнэ, цагийн хуваарь, байршил, үйлчилгээг нэг дороос харьцуулаарай.
                </SectionHeading>
                <Button asChild size="lg" className="shrink-0 self-start md:self-auto">
                  <Link href="/gyms">
                    <LocateFixedIcon />
                    Ойролцоох фитнес хайх
                  </Link>
                </Button>
              </div>
            </div>
            {gyms.length > 0 && (
              <>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gyms.map((gym, i) => (
                    <li key={gym.slug} data-reveal style={revealDelay(i)} className="flex">
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

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div
            data-reveal
            className="dark relative isolate overflow-hidden rounded-3xl bg-background px-6 py-16 text-center text-foreground sm:py-24"
          >
            <Image
              src={ctaDumbbell}
              alt=""
              fill
              placeholder="blur"
              sizes="(min-width: 1152px) 1120px, 100vw"
              className="-z-10 object-cover object-[center_55%] opacity-55"
            />
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,var(--ink)_15%,transparent_80%)] opacity-90"
            />
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
