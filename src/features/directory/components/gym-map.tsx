"use client";

import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { useEffect, useRef, useState } from "react";
import { type LatLng, UB_CENTER } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { createBaseMap, gymPinIcon, loadLeaflet, userDot } from "./leaflet";

export type MapGym = { slug: string; name: string; location: LatLng; subtitle?: string | null };

/**
 * Фитнесүүдийг газрын зураг дээр харуулна. gyms-ийг эцэг компонент useMemo-оор тогтвортой байлгах
 * ёстой: массив өөрчлөгдөх бүрт тэмдэглэгээг дахин зурж, харагдах хүрээг тааруулна.
 */
export function GymMap({
  gyms,
  user,
  focus,
  linkToGym = true,
  singleZoom = 15,
  className,
}: {
  gyms: MapGym[];
  user?: LatLng | null;
  /** Харагдах хүрээг эдгээр фитнесүүд (+ хэрэглэгч) дээр тааруулна. Бусад тэмдэглэгээ ч харагдана. */
  focus?: string[];
  /** Popup-д фитнесийн хуудас руу холбоос харуулах эсэх. */
  linkToGym?: boolean;
  singleZoom?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const layerRef = useRef<Leaflet.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map: Leaflet.Map | null = null;
    let observer: ResizeObserver | null = null;
    loadLeaflet().then((L) => {
      const element = containerRef.current;
      if (cancelled || !element) return;
      map = createBaseMap(L, element, { center: [UB_CENTER.lat, UB_CENTER.lng], zoom: 12 });
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      // Нуугдсан (утсан дээрх "Жагсаалт" горим) байснаас харагдах үед хэмжээгээ шинэчилнэ.
      observer = new ResizeObserver(() => map?.invalidateSize());
      observer.observe(element);
      setReady(true);
    });
    return () => {
      cancelled = true;
      observer?.disconnect();
      map?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!ready || !map || !layer) return;
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled) return;
      layer.clearLayers();
      const points: Leaflet.LatLngTuple[] = [];
      const focusSet = focus?.length ? new Set(focus) : null;
      const icon = gymPinIcon(L);
      for (const gym of gyms) {
        const point: Leaflet.LatLngTuple = [gym.location.lat, gym.location.lng];
        const marker = L.marker(point, { icon, title: gym.name, alt: gym.name, riseOnHover: true });
        // Нэрийг textContent-оор оруулна (фитнесийн оруулсан текст тул innerHTML ашиглахгүй).
        const popup = document.createElement("div");
        popup.className = "space-y-0.5";
        const title = document.createElement(linkToGym ? "a" : "div");
        title.textContent = gym.name;
        title.className = "block text-sm font-semibold text-primary";
        if (title instanceof HTMLAnchorElement) title.href = `/gyms/${gym.slug}`;
        popup.append(title);
        if (gym.subtitle) {
          const subtitle = document.createElement("div");
          subtitle.textContent = gym.subtitle;
          subtitle.className = "text-xs text-muted-foreground";
          popup.append(subtitle);
        }
        marker.bindPopup(popup, { closeButton: false });
        marker.addTo(layer);
        if (!focusSet || focusSet.has(gym.slug)) points.push(point);
      }
      if (user) {
        userDot(L, [user.lat, user.lng]).bindTooltip("Таны байршил").addTo(layer);
        points.push([user.lat, user.lng]);
      }
      if (points.length === 1) map.setView(points[0], singleZoom);
      else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 15 });
      else map.setView([UB_CENTER.lat, UB_CENTER.lng], 12);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, gyms, user, focus, linkToGym, singleZoom]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Газрын зураг"
      className={cn("isolate z-0 h-full min-h-56 w-full overflow-hidden rounded-xl border bg-muted", className)}
    />
  );
}
