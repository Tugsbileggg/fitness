"use client";

import { DumbbellIcon, ListIcon, Loader2Icon, LocateFixedIcon, MapIcon, SearchIcon, SearchXIcon, XIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { distanceMeters, formatDistance } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { AREA_GROUPS, AREAS, areaLabel } from "../areas";
import { getCurrentPosition, storeMyLocation, useMediaQuery, useMyLocation } from "../browser";
import type { PublicGymSummary } from "../types";
import { GymCard } from "./gym-card";
import { GymMap, type MapGym } from "./gym-map";

const ALL = "all";
/** "Ойролцоох" үед газрын зургийг хамгийн ойрын хэдэн фитнес дээр төвлөрүүлнэ (хот хооронд хэт холдохгүй). */
const FOCUS_COUNT = 5;
const FOCUS_RADIUS_M = 30_000;

/** Кирилл үсгийн өөр бичлэгийг (ө/о, ү/у, ё/е) ялгахгүй хайна: гар дээр Ө, Ү байхгүй хэрэглэгчид. */
function fold(value: string) {
  return value.toLowerCase().replace(/ө/g, "о").replace(/ү/g, "у").replace(/ё/g, "е").replace(/\s+/g, " ").trim();
}

/**
 * Фитнес хайх: нэр/хаягаар хайх, дүүргээр шүүх, "Ойролцоох" (хэрэглэгчийн байршлаас зайгаар эрэмбэлэх).
 * Байршлыг хөтөч дээр тооцдог тул серверт илгээхгүй.
 */
export function GymDirectory({ gyms }: { gyms: PublicGymSummary[] }) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<string>(ALL);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const myLocation = useMyLocation();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const mapRef = useRef<HTMLDivElement>(null);

  const areaOptions = useMemo(() => {
    const present = new Set(gyms.map((g) => g.area));
    return AREAS.filter((a) => present.has(a.code));
  }, [gyms]);

  const results = useMemo(() => {
    const q = fold(query);
    const matched = gyms.filter(
      (g) =>
        (area === ALL || g.area === area) &&
        (!q || fold(`${g.name} ${g.address} ${g.tagline ?? ""} ${areaLabel(g.area) ?? ""}`).includes(q)),
    );
    const withDistance = matched.map((gym) => ({
      gym,
      distance: myLocation ? distanceMeters(myLocation, gym.location) : null,
    }));
    if (myLocation) withDistance.sort((a, b) => a.distance! - b.distance!);
    return withDistance;
  }, [gyms, query, area, myLocation]);

  const mapGyms = useMemo<MapGym[]>(
    () =>
      results.map(({ gym, distance }) => ({
        slug: gym.slug,
        name: gym.name,
        location: gym.location,
        subtitle: distance !== null ? `${formatDistance(distance)} · ${areaLabel(gym.area) ?? ""}` : areaLabel(gym.area),
      })),
    [results],
  );

  const focus = useMemo(() => {
    if (!myLocation || results.length === 0) return undefined;
    const near = results.slice(0, FOCUS_COUNT).filter((r) => r.distance! <= FOCUS_RADIUS_M);
    return (near.length ? near : results.slice(0, 1)).map((r) => r.gym.slug);
  }, [myLocation, results]);

  const locate = async () => {
    setLocating(true);
    setGeoError(null);
    try {
      storeMyLocation(await getCurrentPosition());
    } catch (e) {
      setGeoError(e instanceof Error ? e.message : "Байршлыг тодорхойлж чадсангүй.");
    } finally {
      setLocating(false);
    }
  };

  const filtered = query !== "" || area !== ALL;
  const showMap = isDesktop || view === "map";

  if (gyms.length === 0) {
    return (
      <EmptyState
        icon={DumbbellIcon}
        title="Одоогоор нийтлэгдсэн фитнес алга"
        description="Фитнесүүд удахгүй нэмэгдэнэ. Фитнес эзэмшдэг бол бүртгүүлээд танилцуулгаа нийтлээрэй."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Нэр, хаягаар хайх"
            aria-label="Фитнес хайх"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger className="min-w-0 flex-1 sm:w-52" aria-label="Дүүрэг, аймаг">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Бүх байршил</SelectItem>
              {AREA_GROUPS.map((group) => {
                const items = areaOptions.filter((a) => a.group === group.key);
                if (items.length === 0) return null;
                return (
                  <SelectGroup key={group.key}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {items.map((a) => (
                      <SelectItem key={a.code} value={a.code}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                );
              })}
            </SelectContent>
          </Select>
          <Button type="button" onClick={locate} disabled={locating} variant={myLocation ? "secondary" : "default"}>
            {locating ? <Loader2Icon className="animate-spin" /> : <LocateFixedIcon />}
            Ойролцоох
          </Button>
        </div>
      </div>

      {geoError ? (
        <p role="alert" className="text-sm text-destructive">
          {geoError} Дүүрэг, аймгаар шүүж болно.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          &quot;Ойролцоох&quot; нь таны байршлыг зөвхөн энэ төхөөрөмж дээр ашиглана, хаашаа ч илгээхгүй.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">
          <span className="font-semibold">{results.length}</span> фитнес
          {myLocation && <span className="text-muted-foreground"> · танд ойр нь эхэнд</span>}
        </p>
        <div className="flex gap-1">
          {myLocation && (
            <Button type="button" variant="ghost" size="sm" onClick={() => storeMyLocation(null)}>
              <XIcon />
              Байршил арилгах
            </Button>
          )}
          {filtered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setArea(ALL);
              }}
            >
              Шүүлтүүр цэвэрлэх
            </Button>
          )}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-6">
        <div className={cn(view === "map" && "hidden lg:block")}>
          {results.length === 0 ? (
            <EmptyState
              icon={SearchXIcon}
              title="Хайлтад тохирох фитнес олдсонгүй"
              description="Өөр үгээр хайх эсвэл шүүлтүүрээ цэвэрлэж үзнэ үү."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {results.map(({ gym, distance }) => (
                <li key={gym.slug} className="flex">
                  <GymCard gym={gym} distance={distance} />
                </li>
              ))}
            </ul>
          )}
        </div>
        {showMap && (
          <div
            ref={mapRef}
            className="h-[calc(100svh-9rem)] min-h-80 scroll-mt-20 lg:sticky lg:top-20 lg:h-[calc(100svh-7rem)]"
          >
            <GymMap gyms={mapGyms} user={myLocation} focus={focus} />
          </div>
        )}
      </div>

      {/* Утсан дээр жагсаалт ба газрын зургийн хооронд шилжих товч. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 flex justify-center lg:hidden">
        <Button
          type="button"
          size="lg"
          className="pointer-events-auto rounded-full shadow-lg"
          onClick={() => {
            const next = view === "list" ? "map" : "list";
            setView(next);
            // Газрын зураг шүүлтүүрийн доор байрладаг тул харагдах хэсэгт гүйлгэнэ.
            if (next === "map") requestAnimationFrame(() => mapRef.current?.scrollIntoView({ behavior: "smooth" }));
          }}
        >
          {view === "list" ? <MapIcon /> : <ListIcon />}
          {view === "list" ? "Газрын зураг" : "Жагсаалт"}
        </Button>
      </div>
    </div>
  );
}
