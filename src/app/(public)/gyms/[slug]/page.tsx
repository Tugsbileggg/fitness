import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GymProfileView } from "@/features/directory/components/gym-profile-view";
import { getPublicGym } from "@/features/directory/queries";

// Хуудас анх хандахад үүсч, 5 минут кэшлэгдэнэ (ISR). Менежер засахад шууд шинэчлэгдэнэ.
export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/gyms/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const gym = await getPublicGym(slug);
  if (!gym) return { title: "Фитнес олдсонгүй" };
  const description = gym.tagline ?? gym.description?.slice(0, 160) ?? gym.address;
  return {
    title: gym.name,
    description,
    openGraph: {
      title: gym.name,
      description,
      type: "website",
      images: gym.photos[0] ? [{ url: gym.photos[0] }] : undefined,
    },
  };
}

export default async function GymPage({ params }: PageProps<"/gyms/[slug]">) {
  const { slug } = await params;
  const gym = await getPublicGym(slug);
  if (!gym) notFound();

  return (
    <div className="space-y-4">
      <Link href="/gyms" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" />
        Бүх фитнес
      </Link>
      {/* Жагсаалтад зөвхөн админ баталгаажуулсан фитнес гардаг. */}
      <GymProfileView gym={gym} verified />
    </div>
  );
}
