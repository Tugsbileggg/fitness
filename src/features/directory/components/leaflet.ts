"use client";

// Leaflet-ийг зөвхөн хөтөч дээр, газрын зураг анх харагдах үед ачаална (import үед window шаарддаг).
// Tile: OpenStreetMap (API түлхүүргүй). Хэрэглээ өсвөл MapTiler, Stadia зэрэг арилжааны
// үйлчилгээ рүү TILE_URL-ийг солиход хангалттай (OSM-ийн tile бодлого: хүнд ачаалал хориотой).
import type * as Leaflet from "leaflet";

export type L = typeof Leaflet;

export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

let leafletPromise: Promise<L> | null = null;

export function loadLeaflet(): Promise<L> {
  leafletPromise ??= import("leaflet").then((m) => ((m as { default?: L }).default ?? m) as L);
  return leafletPromise;
}

export function createBaseMap(L: L, element: HTMLElement, options: Leaflet.MapOptions = {}) {
  const map = L.map(element, { scrollWheelZoom: false, ...options });
  map.attributionControl.setPrefix(false);
  L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
  return map;
}

/** Фитнесийн тэмдэглэгээ: үндсэн өнгөтэй дусал хэлбэр (зураг файлгүй, bundler-ийн асуудалгүй). */
export function gymPinIcon(L: L) {
  return L.divIcon({
    className: "",
    html:
      '<svg width="30" height="42" viewBox="0 0 30 42" aria-hidden="true" style="display:block;filter:drop-shadow(0 1px 2px rgb(0 0 0 / .35))">' +
      '<path d="M15 1C7.3 1 1 7.2 1 14.9 1 25.3 15 41 15 41s14-15.7 14-26.1C29 7.2 22.7 1 15 1z" style="fill:var(--primary)" stroke="#fff" stroke-width="2"/>' +
      '<circle cx="15" cy="15" r="5.5" fill="#fff"/></svg>',
    iconSize: [30, 42],
    iconAnchor: [15, 41],
    popupAnchor: [0, -36],
    tooltipAnchor: [0, -36],
  });
}

/** Хэрэглэгчийн байршил: цэнхэр цэг. */
export function userDot(L: L, latlng: Leaflet.LatLngExpression) {
  return L.circleMarker(latlng, {
    radius: 8,
    color: "#fff",
    weight: 3,
    fillColor: "#2563eb",
    fillOpacity: 1,
  });
}
