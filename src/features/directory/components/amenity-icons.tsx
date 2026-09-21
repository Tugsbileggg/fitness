import {
  ActivityIcon,
  BabyIcon,
  CoffeeIcon,
  DumbbellIcon,
  FlameIcon,
  Flower2Icon,
  HandIcon,
  HeartPulseIcon,
  LockIcon,
  type LucideIcon,
  ShowerHeadIcon,
  SquareParkingIcon,
  SwordsIcon,
  UserCheckIcon,
  UsersIcon,
  VenusIcon,
  WavesIcon,
  WeightIcon,
  WifiIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AMENITIES, type AmenityCode } from "../amenities";

export const AMENITY_ICONS: Record<AmenityCode, LucideIcon> = {
  cardio: HeartPulseIcon,
  free_weights: DumbbellIcon,
  machines: WeightIcon,
  group_classes: UsersIcon,
  personal_training: UserCheckIcon,
  yoga: Flower2Icon,
  martial_arts: SwordsIcon,
  crossfit: ActivityIcon,
  sauna: FlameIcon,
  shower: ShowerHeadIcon,
  lockers: LockIcon,
  parking: SquareParkingIcon,
  women_only: VenusIcon,
  kids: BabyIcon,
  wifi: WifiIcon,
  massage: HandIcon,
  pool: WavesIcon,
  cafe: CoffeeIcon,
};

const LABELS = new Map<string, string>(AMENITIES.map((a) => [a.code, a.label]));

/** Үйлчилгээнүүд: icon + нэр (фитнесийн хуудас). */
export function AmenityList({ amenities, className }: { amenities: AmenityCode[]; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3", className)}>
      {amenities.map((code) => {
        const Icon = AMENITY_ICONS[code];
        return (
          <li key={code} className="flex items-center gap-2 text-sm">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-4" />
            </span>
            {LABELS.get(code)}
          </li>
        );
      })}
    </ul>
  );
}

/** Картанд: эхний хэдэн үйлчилгээ жижиг шошгоор. */
export function AmenityChips({ amenities, max = 3 }: { amenities: AmenityCode[]; max?: number }) {
  if (amenities.length === 0) return null;
  const shown = amenities.slice(0, max);
  const rest = amenities.length - shown.length;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Үйлчилгээ">
      {shown.map((code) => {
        const Icon = AMENITY_ICONS[code];
        return (
          <li key={code} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
            <Icon className="size-3.5 text-muted-foreground" />
            {LABELS.get(code)}
          </li>
        );
      })}
      {rest > 0 && <li className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">+{rest}</li>}
    </ul>
  );
}
