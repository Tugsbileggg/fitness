import { MapPinIcon } from "lucide-react";
import Link from "next/link";
import { GymLogo } from "@/components/app-shell/gym-logo";
import { formatDistance } from "@/lib/geo";
import { formatMNT } from "@/lib/money";
import { areaLabel } from "../areas";
import type { PublicGymSummary } from "../types";
import { AmenityChips } from "./amenity-icons";
import { GymCover } from "./gym-cover";
import { OpenNowBadge } from "./open-now";

export function GymCard({ gym, distance }: { gym: PublicGymSummary; distance: number | null }) {
  const area = areaLabel(gym.area);
  return (
    <Link
      href={`/gyms/${gym.slug}`}
      className="group flex w-full flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <GymCover src={gym.coverUrl} alt={gym.name} className="transition-transform duration-300 group-hover:scale-[1.02]" />
        {distance !== null && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-xs font-semibold shadow-sm">
            <MapPinIcon className="size-3.5 text-primary" />
            {formatDistance(distance)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start gap-3">
          <GymLogo name={gym.name} logoUrl={gym.logoUrl} className="size-10" />
          <div className="min-w-0">
            <h2 className="leading-snug font-semibold group-hover:text-primary">{gym.name}</h2>
            <p className="truncate text-sm text-muted-foreground">{area ?? gym.address}</p>
          </div>
        </div>
        {gym.tagline && <p className="line-clamp-2 text-sm">{gym.tagline}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-1">
          {gym.hours ? <OpenNowBadge hours={gym.hours} /> : <span />}
          {gym.priceFrom !== null && (
            <span className="text-sm">
              <span className="font-semibold">{formatMNT(gym.priceFrom)}</span>
              <span className="text-muted-foreground"> / сар</span>
            </span>
          )}
        </div>
        <AmenityChips amenities={gym.amenities} />
      </div>
    </Link>
  );
}
