import { createClient } from "@supabase/supabase-js";
import {
  ArrowRightIcon,
  BellRingIcon,
  CalendarClockIcon,
  CheckIcon,
  LocateFixedIcon,
  SmartphoneIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GymCard } from "@/features/directory/components/gym-card";
import { listPublicGyms } from "@/features/directory/queries";
import { APP_NAME, TRIAL_DAYS } from "@/lib/config";
import { formatMNT } from "@/lib/money";
import type { Database } from "@/types/database.types";

// Нүүр хуудсыг цагт нэг удаа шинэчилнэ (тарифын үнэ өөрчлөгдвөл).
export const revalidate = 3600;

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

const FEATURES = [
  {
    icon: BellRingIcon,
    title: "Эрх дуусахыг анзаарна",
    text: "Хэдэн хоногийн дараа эрх нь дуусах үйлчлүүлэгчид өнгөөр ялгагдаж, нэг дор харагдана.",
  },
  {
    icon: CalendarClockIcon,
    title: "Сунгалт автоматаар",
    text: "Төлбөр бүртгэхэд дуусах огноо өөрөө бодогдоно. Хугацаа дуусаагүй бол үргэлжлүүлж сунгана.",
  },
  {
    icon: WalletIcon,
    title: "Орлогоо хянана",
    text: "Бэлэн болон дансны төлбөр, хөнгөлөлт, энэ сарын орлого, шинэ ба сунгасан үйлчлүүлэгчид.",
  },
  {
    icon: UsersIcon,
    title: "Багш нартайгаа хамт",
    text: "Багш нарыг имэйлээр урьж нэвтрүүлнэ. Орлогын тайлан зөвхөн танд харагдана.",
  },
  {
    icon: SmartphoneIcon,
    title: "Утсан дээр бүрэн ажиллана",
    text: "Апп татах шаардлагагүй. Утас, таблет, компьютерийн хөтчөөс шууд ашиглана.",
  },
];

export default async function HomePage() {
  const [plans, gyms] = await Promise.all([getPlans(), getFeaturedGyms()]);

  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
              Фитнесийнхээ үйлчлүүлэгч, төлбөрийг нэг дороос хянаарай
            </h1>
            <p className="text-lg text-muted-foreground">
              Дэвтэр, Excel хэрэггүй. Хэний эрх хэзээ дуусахыг {APP_NAME} танд өөрөө сануулна.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">{TRIAL_DAYS} хоног үнэгүй туршиж үзэх</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Нэвтрэх</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t bg-accent/40">
          <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">Фитнес хайж байна уу?</h2>
                <p className="text-muted-foreground">
                  Ойролцоох фитнесүүдийн үнэ, цагийн хуваарь, байршил, үйлчилгээг нэг дороос харьцуулаарай.
                </p>
              </div>
              <Button asChild size="lg">
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
                <Link href="/gyms" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  Бүх фитнесийг харах
                  <ArrowRightIcon className="size-4" />
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="border-y bg-card">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="space-y-2">
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <feature.icon className="size-5" />
                </div>
                <h2 className="font-semibold">{feature.title}</h2>
                <p className="text-sm text-muted-foreground">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        {plans.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="mb-2 text-2xl font-semibold tracking-tight">Үнийн санал</h2>
            <p className="mb-8 text-muted-foreground">
              Бүх багцад {TRIAL_DAYS} хоногийн үнэгүй туршилт багтсан. Сар бүр дансаар төлнө.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.description && <CardDescription>{plan.description}</CardDescription>}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p>
                      <span className="text-3xl font-semibold">{formatMNT(plan.monthly_price)}</span>
                      <span className="text-muted-foreground"> / сар</span>
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <CheckIcon className="size-4 text-primary" />
                      {plan.max_clients
                        ? `${plan.max_clients} хүртэл үйлчлүүлэгч`
                        : "Хязгааргүй үйлчлүүлэгч"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
