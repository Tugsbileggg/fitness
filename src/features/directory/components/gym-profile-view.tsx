import { BadgeCheckIcon, ExternalLinkIcon, MapPinIcon, NavigationIcon, PhoneIcon } from "lucide-react";
import { GymLogo } from "@/components/app-shell/gym-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { directionsUrl } from "@/lib/geo";
import { formatMNT } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { areaLabel } from "../areas";
import type { PublicGym } from "../types";
import { AmenityList } from "./amenity-icons";
import { GymCover } from "./gym-cover";
import { GymMap } from "./gym-map";
import { HoursTable, OpenNowBadge } from "./open-now";

function monthsLabel(months: number) {
  return months % 12 === 0 ? `${months / 12} жил` : `${months} сар`;
}

function PhotoGallery({ photos, name }: { photos: string[]; name: string }) {
  if (photos.length === 0) {
    return (
      <div className="aspect-[16/9] overflow-hidden rounded-2xl sm:aspect-[21/9]">
        <GymCover src={null} alt={name} />
      </div>
    );
  }
  if (photos.length === 1) {
    return (
      <div className="aspect-[4/3] overflow-hidden rounded-2xl sm:aspect-[21/9]">
        <GymCover src={photos[0]} alt={name} priority />
      </div>
    );
  }
  // Утсан дээр хажуу тийш гүйлгэдэг цомог. Компьютер дээр: 2 → хоёр тэнцүү, 3 → 1 том + 2,
  // 4 → 1 том + 1 өргөн + 2, 5+ → 1 том + 4 (үлдсэнийг "+N"-ээр).
  const count = photos.length;
  const grid = count === 2 ? "sm:grid-cols-2" : count === 3 ? "sm:grid-cols-3 sm:grid-rows-2" : "sm:grid-cols-4 sm:grid-rows-2";
  const tile = (i: number) =>
    count === 2 ? "" : i === 0 ? "sm:col-span-2 sm:row-span-2" : count === 4 && i === 1 ? "sm:col-span-2" : i > 4 ? "sm:hidden" : "";
  return (
    <div
      className={cn(
        "-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:grid sm:h-[26rem] sm:overflow-hidden sm:rounded-2xl sm:px-0 [&::-webkit-scrollbar]:hidden",
        grid,
      )}
      aria-label="Зургууд"
    >
      {photos.map((src, i) => (
        <div
          key={src}
          className={cn(
            "relative aspect-[4/3] w-[85%] shrink-0 snap-center overflow-hidden rounded-xl sm:aspect-auto sm:w-auto sm:rounded-none",
            tile(i),
          )}
        >
          <GymCover src={src} alt={`${name} — зураг ${i + 1}`} priority={i === 0} />
          {i === 4 && count > 5 && (
            <span className="absolute inset-0 hidden items-center justify-center bg-black/45 text-2xl font-semibold text-white sm:flex">
              +{count - 5}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/** Фитнесийн нийтийн хуудас. /gyms/[slug] болон менежерийн урьдчилан харахад ашиглана. */
export function GymProfileView({ gym, verified }: { gym: PublicGym; verified: boolean }) {
  const area = areaLabel(gym.area);
  // Хаягт дүүрэг/аймгийн нэр аль хэдийн байвал давтахгүй.
  const showArea = area && !gym.address.includes(area.replace(/ (дүүрэг|аймаг)$/, ""));
  const socials = [
    gym.facebookUrl && { href: gym.facebookUrl, label: "Facebook" },
    gym.instagramUrl && { href: gym.instagramUrl, label: "Instagram" },
  ].filter(Boolean) as Array<{ href: string; label: string }>;

  return (
    <article className="space-y-6">
      <PhotoGallery photos={gym.photos} name={gym.name} />

      <header className="flex items-start gap-4">
        <GymLogo name={gym.name} logoUrl={gym.logoUrl} className="size-14 text-xl sm:size-16" />
        <div className="min-w-0 space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{gym.name}</h1>
          {verified && (
            <Badge variant="success">
              <BadgeCheckIcon />
              Платформд баталгаажсан
            </Badge>
          )}
          {gym.tagline && <p className="text-muted-foreground">{gym.tagline}</p>}
          {gym.hours && <OpenNowBadge hours={gym.hours} />}
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {gym.phone && (
          <Button asChild size="lg">
            <a href={`tel:${gym.phone}`}>
              <PhoneIcon />
              {formatPhone(gym.phone)}
            </a>
          </Button>
        )}
        {gym.location && (
          <Button asChild size="lg" variant="outline">
            <a href={directionsUrl(gym.location)} target="_blank" rel="noopener noreferrer">
              <NavigationIcon />
              Чиглэл авах
            </a>
          </Button>
        )}
        {socials.map((s) => (
          <Button key={s.label} asChild size="lg" variant="outline">
            <a href={s.href} target="_blank" rel="noopener noreferrer nofollow">
              <ExternalLinkIcon />
              {s.label}
            </a>
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          {gym.description && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Танилцуулга</h2>
              <p className="leading-relaxed whitespace-pre-line">{gym.description}</p>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Үнэ</h2>
            {gym.showPrices && gym.plans.length > 0 ? (
              <ul className="divide-y rounded-xl border bg-card">
                {gym.plans.map((plan, i) => (
                  <li key={`${plan.name}-${i}`} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span>
                      <span className="font-medium">{plan.name}</span>
                      {plan.name.trim() !== monthsLabel(plan.months) && (
                        <span className="text-sm text-muted-foreground"> · {monthsLabel(plan.months)}</span>
                      )}
                    </span>
                    <span className="font-semibold tabular-nums">{formatMNT(plan.price)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                Үнийн мэдээллийг {gym.phone ? `${formatPhone(gym.phone)} утсаар` : "фитнесээс"} лавлана уу.
              </p>
            )}
          </section>

          {gym.amenities.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Үйлчилгээ</h2>
              <AmenityList amenities={gym.amenities} />
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {gym.hours && (
            <section className="space-y-2 rounded-xl border bg-card p-4">
              <h2 className="font-semibold">Цагийн хуваарь</h2>
              <HoursTable hours={gym.hours} />
            </section>
          )}
          <section className="space-y-3 rounded-xl border bg-card p-4">
            <h2 className="font-semibold">Байршил</h2>
            <p className="flex items-start gap-2 text-sm">
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>
                {showArea && <span className="font-medium">{area}. </span>}
                {gym.address}
              </span>
            </p>
            {gym.location && (
              <div className="h-60">
                <GymMap
                  gyms={[{ slug: gym.slug, name: gym.name, location: gym.location, subtitle: gym.address }]}
                  linkToGym={false}
                  singleZoom={16}
                />
              </div>
            )}
          </section>
        </aside>
      </div>

      <p className="text-xs text-muted-foreground">
        Мэдээллийг фитнес өөрөө оруулсан. Сүүлд шинэчилсэн: {formatDate(gym.updatedAt)}.
      </p>
    </article>
  );
}
