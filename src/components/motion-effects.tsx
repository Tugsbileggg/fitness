"use client";

import { useEffect } from "react";

// Хөдөлгөөнүүд зөвхөн data-* шинж ба CSS хувьсагч өөрчилнө; харагдах байдал нь globals.css-д.
// Сервер дээр зурсан HTML хэвээр харагдана: JS ажиллахгүй эсвэл хөдөлгөөн багасгах тохиргоотой бол
// бүх агуулга ердийнхөөрөө, хөдөлгөөнгүй гарна.

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Mouse-ийг дагах гэрэл. `data-glow` карт дээр (--gx, --gy) болон `data-spotlight` давхарга дээр
 * (--sx, --sy). Хүрэлтээр удирддаг төхөөрөмжид ажиллахгүй.
 */
export function PointerGlow() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion()) return;
    let frame = 0;
    let last: PointerEvent | null = null;

    const update = () => {
      frame = 0;
      if (!last) return;
      const { clientX: x, clientY: y } = last;
      const card = last.target instanceof Element ? last.target.closest<HTMLElement>("[data-glow]") : null;
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--gx", `${x - r.left}px`);
        card.style.setProperty("--gy", `${y - r.top}px`);
      }
      for (const el of document.querySelectorAll<HTMLElement>("[data-spotlight]")) {
        const r = el.getBoundingClientRect();
        if (y < r.top || y > r.bottom) continue;
        el.style.setProperty("--sx", `${x - r.left}px`);
        el.style.setProperty("--sy", `${y - r.top}px`);
      }
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}

/**
 * Гүйлгэлттэй холбоотой хөдөлгөөн:
 * - `data-reveal`: дэлгэцэнд орж ирэхэд доороос гарч ирнэ (эхний дэлгэцэнд байгаа нь шууд харагдана).
 *   `--reveal-delay` style-аар дараалал өгнө.
 * - `data-tilt`: доош гүйлгэхэд налуугаас тэгширч, mouse-ийн зүгт бага зэрэг хазайна.
 * - `data-parallax="0.3"`: эцэг элементээсээ удаан гүйлгэгдэнэ (арын зураг).
 */
export function ScrollEffects() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-reveal", "shown");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    for (const el of document.querySelectorAll("[data-reveal]")) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.92) {
        el.setAttribute("data-reveal", "hidden");
        io.observe(el);
      }
    }

    const tilts = [...document.querySelectorAll<HTMLElement>("[data-tilt]")];
    const layers = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    let px = 0;
    let py = 0;
    let frame = 0;

    const render = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const el of tilts) {
        const top = el.getBoundingClientRect().top;
        const progress = Math.min(1, Math.max(0, (vh * 0.85 - top) / (vh * 0.6)));
        const rotateX = (1 - progress) * 14 - py * 3;
        const rotateY = px * 4;
        const scale = 0.94 + 0.06 * progress;
        el.style.transform = `perspective(1600px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      }
      for (const el of layers) {
        const r = el.parentElement?.getBoundingClientRect();
        if (!r || r.bottom < 0 || r.top > vh) continue;
        el.style.transform = `translate3d(0, ${(-r.top * Number(el.dataset.parallax)).toFixed(1)}px, 0)`;
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX / window.innerWidth - 0.5;
      py = e.clientY / window.innerHeight - 0.5;
      schedule();
    };

    render();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    if (finePointer) window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
