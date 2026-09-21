"use client";

import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { Loader2Icon, LocateFixedIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isInMongolia, type LatLng, roundCoord, UB_CENTER } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { getCurrentPosition } from "../browser";
import { createBaseMap, gymPinIcon, loadLeaflet } from "./leaflet";

/**
 * Менежер фитнесийнхээ байршлыг газрын зураг дээр дарж эсвэл тэмдэглэгээг чирж заана.
 * Заалдаа байгаа бол "Одоогийн байршил"-аар шууд авч болно.
 */
export function LocationPicker({
  value,
  onChange,
  disabled,
  invalid,
  id,
}: {
  value: LatLng | null;
  onChange: (value: LatLng | null) => void;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markerRef = useRef<Leaflet.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const disabledRef = useRef(disabled);
  const initialRef = useRef(value);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
    disabledRef.current = disabled;
  });

  useEffect(() => {
    let cancelled = false;
    let map: Leaflet.Map | null = null;
    loadLeaflet().then((L) => {
      const element = containerRef.current;
      if (cancelled || !element) return;
      const start = initialRef.current;
      map = createBaseMap(L, element, {
        center: start ? [start.lat, start.lng] : [UB_CENTER.lat, UB_CENTER.lng],
        zoom: start ? 16 : 12,
      });
      map.on("click", (e: Leaflet.LeafletMouseEvent) => {
        if (disabledRef.current) return;
        onChangeRef.current({ lat: roundCoord(e.latlng.lat), lng: roundCoord(e.latlng.lng) });
      });
      mapRef.current = map;
      setReady(true);
    });
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Тэмдэглэгээг утгатай нь тааруулна.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled) return;
      if (!value) {
        markerRef.current?.remove();
        markerRef.current = null;
        return;
      }
      const point: Leaflet.LatLngTuple = [value.lat, value.lng];
      if (markerRef.current) {
        markerRef.current.setLatLng(point);
      } else {
        const marker = L.marker(point, { icon: gymPinIcon(L), draggable: true, autoPan: true, title: "Фитнесийн байршил" });
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onChangeRef.current({ lat: roundCoord(pos.lat), lng: roundCoord(pos.lng) });
        });
        marker.addTo(map);
        markerRef.current = marker;
      }
      if (!map.getBounds().contains(point)) map.setView(point, Math.max(map.getZoom(), 15));
    });
    return () => {
      cancelled = true;
    };
  }, [ready, value]);

  useEffect(() => {
    const dragging = markerRef.current?.dragging;
    if (disabled) dragging?.disable();
    else dragging?.enable();
  }, [disabled, ready, value]);

  const locateMe = async () => {
    setLocating(true);
    try {
      const position = await getCurrentPosition();
      if (!isInMongolia(position)) {
        toast.error("Таны одоогийн байршил Монгол улсын гадна байна. Газрын зураг дээр гараар тэмдэглэнэ үү.");
        return;
      }
      onChange(position);
      mapRef.current?.setView([position.lat, position.lng], 17);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Байршлыг тодорхойлж чадсангүй.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        id={id}
        role="application"
        aria-label="Байршил сонгох газрын зураг"
        aria-invalid={invalid}
        className={cn(
          "isolate z-0 h-72 w-full overflow-hidden rounded-lg border bg-muted sm:h-80",
          invalid && "border-destructive ring-3 ring-destructive/20",
          disabled && "opacity-70",
        )}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={locateMe} disabled={disabled || locating}>
          {locating ? <Loader2Icon className="animate-spin" /> : <LocateFixedIcon />}
          Одоогийн байршлаа ашиглах
        </Button>
        {value ? (
          <>
            <span className="text-sm text-muted-foreground tabular-nums">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)} disabled={disabled}>
              <XIcon />
              Арилгах
            </Button>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Байршил тэмдэглээгүй</span>
        )}
      </div>
    </div>
  );
}
