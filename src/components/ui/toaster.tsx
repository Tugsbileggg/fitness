"use client";

import { Toaster as Sonner } from "sonner";

/** Мэдэгдлийн (toast) контейнер. Утсан дээр дээд талд гарна. */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      toastOptions={{ classNames: { toast: "font-sans text-sm" } }}
    />
  );
}
