"use client";

// Хөтчийн туслахууд: байршил, зураг багасгах, Улаанбаатарын цаг.
// Хэрэглэгчийн байршил зөвхөн энэ төхөөрөмж дээр (sessionStorage) хадгалагдана, серверт очихгүй.
import { useCallback, useSyncExternalStore } from "react";
import { isInMongolia, type LatLng, roundCoord } from "@/lib/geo";

// ── Байршил ─────────────────────────────────────────────────────────────────
export function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Таны хөтөч байршил тодорхойлохыг дэмжихгүй байна."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: roundCoord(pos.coords.latitude), lng: roundCoord(pos.coords.longitude) }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Байршил тодорхойлох зөвшөөрөл өгөөгүй байна. Хөтчийн тохиргооноос зөвшөөрнө үү."
              : err.code === err.TIMEOUT
                ? "Байршил тодорхойлоход хэт удлаа. Дахин оролдоно уу."
                : "Байршлыг тодорхойлж чадсангүй. Дахин оролдоно уу.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  });
}

const LOCATION_KEY = "fitness:my-location";
const locationListeners = new Set<() => void>();
let storedLocation: LatLng | null | undefined;

function readStoredLocation(): LatLng | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(LOCATION_KEY) ?? "null");
    return value && typeof value.lat === "number" && typeof value.lng === "number" && isInMongolia(value)
      ? { lat: value.lat, lng: value.lng }
      : null;
  } catch {
    return null;
  }
}

/** Хэрэглэгчийн байршлыг энэ таб дотор санана (хуудас хооронд шилжихэд эрэмбэ алдагдахгүй). */
export function storeMyLocation(value: LatLng | null) {
  storedLocation = value;
  try {
    if (value) sessionStorage.setItem(LOCATION_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(LOCATION_KEY);
  } catch {
    // Хувийн горимд sessionStorage байхгүй байж болно: зөвхөн санах ойд хадгална.
  }
  for (const listener of locationListeners) listener();
}

export function useMyLocation(): LatLng | null {
  return useSyncExternalStore(
    (onChange) => {
      locationListeners.add(onChange);
      return () => locationListeners.delete(onChange);
    },
    () => {
      if (storedLocation === undefined) storedLocation = readStoredLocation();
      return storedLocation;
    },
    () => null,
  );
}

// ── Media query ─────────────────────────────────────────────────────────────
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// ── Цаг ─────────────────────────────────────────────────────────────────────
function subscribeMinute(onChange: () => void) {
  const timer = setInterval(onChange, 30_000);
  return () => clearInterval(timer);
}

/**
 * Одоогийн минут (Date). Сервер дээр null тул "Одоо нээлттэй" зэргийг hydration-ийн дараа л тооцно
 * (ISR-ээр кэшлэгдсэн HTML-д хуучин цаг үлдэхгүй).
 */
export function useNowMinute(): Date | null {
  const minute = useSyncExternalStore(
    subscribeMinute,
    () => Math.floor(Date.now() / 60_000),
    () => null,
  );
  return minute === null ? null : new Date(minute * 60_000);
}

// ── Зураг ───────────────────────────────────────────────────────────────────
/**
 * Зургийг хөтөч дээр багасгаж JPEG болгоно (урт тал нь ≤ maxSize). Утасны 5–10MB зураг ~300KB болж,
 * утсаар үзэх хүмүүст хурдан ачаална. EXIF-ийн эргэлтийг тооцно.
 */
export async function resizeImage(file: File, maxSize = 1600, quality = 0.82): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Энэ зургийг уншиж чадсангүй. JPG эсвэл PNG зураг сонгоно уу.");
  }
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Зураг боловсруулж чадсангүй.");
  ctx.fillStyle = "#fff"; // PNG-ийн тунгалаг хэсэг хар болохоос сэргийлнэ.
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Зураг боловсруулж чадсангүй.");
  return blob;
}
