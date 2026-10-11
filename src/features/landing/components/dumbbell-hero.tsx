"use client";

import { createScope, createTimeline, onScroll, stagger, type Scope } from "animejs";
import { BellRingIcon, CalendarClockIcon, UsersIcon, WalletIcon } from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Гүйлгэх бүрт гантилын эргэн тойронд нэг нэгээр гарч ирэх мэдээлэл.
const STEPS = [
  {
    icon: BellRingIcon,
    title: "Эрх дуусахыг анзаарна",
    text: "Хэний эрх хэзээ дуусах нь өнгөөр ялгагдаж, нэг дор харагдана.",
  },
  {
    icon: CalendarClockIcon,
    title: "Сунгалт автоматаар",
    text: "Төлбөр бүртгэхэд дуусах огноо өөрөө бодогдоно.",
  },
  {
    icon: WalletIcon,
    title: "Орлогоо хянана",
    text: "Бэлэн, дансны төлбөр, энэ сарын орлого нэг дор.",
  },
  {
    icon: UsersIcon,
    title: "Багш нартайгаа хамт",
    text: "Багш нар үйлчлүүлэгч бүртгэж, төлбөр авна. Тайлан зөвхөн танд.",
  },
] as const;

// Өргөн дэлгэцэд картууд гантилын дөрвөн буланд байрлана.
const CORNERS = [
  "md:motion-safe:top-[8%] md:motion-safe:left-0",
  "md:motion-safe:top-[8%] md:motion-safe:right-0",
  "md:motion-safe:bottom-[6%] md:motion-safe:left-0",
  "md:motion-safe:bottom-[6%] md:motion-safe:right-0",
];

/*
 * CSS 3D гантил. Хэмжээ бүгд em-ээр тул root-ын font-size-аар томруулна.
 * Хавтан бүр нь тэнхлэгийн дагуу давхарласан нимгэн дугуйнуудаас бүтнэ: аль ч өнцгөөс зузаан харагдана.
 */
type Plate = { size: number; width: number; face: string; edge: string };

const PLATES: Plate[] = [
  // Дотор талаас гадагш: том хавтан, жижиг хавтан, түгжээ.
  {
    size: 19,
    width: 3.6,
    face: "radial-gradient(circle, #2b302c 0 17%, #0c0f0d 18% 21%, #1d221e 22% 64%, var(--brand) 65% 69%, #1d221e 70% 92%, #0c0f0d 93%)",
    edge: "#121513",
  },
  {
    size: 14,
    width: 2.6,
    face: "radial-gradient(circle, #2b302c 0 22%, #0c0f0d 23% 27%, var(--brand) 28% 90%, #6f8a13 91%)",
    edge: "#7f9c18",
  },
  {
    size: 6,
    width: 1.6,
    face: "radial-gradient(circle, #f2f4f1 0 30%, #a9b0ab 60%, #6f7672 100%)",
    edge: "#8d948f",
  },
];

const HANDLE = 22; // бариулын урт (em)
const HANDLE_R = 1.4; // бариулын радиус (em)
const HANDLE_FACES = 10;
const LAYER_GAP = 0.16; // хавтангийн давхрага хоорондын зай (em)

function plateLayers() {
  const layers: { x: number; size: number; background: string }[] = [];
  for (const side of [-1, 1]) {
    let offset = HANDLE / 2 - 3.2; // хавтангууд бариулын үзүүрээс бага зэрэг дотогш эхэлнэ
    for (const plate of PLATES) {
      const count = Math.max(2, Math.round(plate.width / LAYER_GAP));
      for (let i = 0; i < count; i++) {
        const outer = i === 0 || i === count - 1;
        layers.push({
          x: side * (offset + (i / (count - 1)) * plate.width),
          size: plate.size,
          background: outer ? plate.face : plate.edge,
        });
      }
      offset += plate.width + 0.15;
    }
  }
  return layers;
}

const LAYERS = plateLayers();
const FACET = 2 * HANDLE_R * Math.tan(Math.PI / HANDLE_FACES);

function Dumbbell() {
  return (
    <div className="relative size-0 [transform-style:preserve-3d]">
      {Array.from({ length: HANDLE_FACES }, (_, i) => {
        const light = Math.round(55 + 30 * Math.cos((i / HANDLE_FACES) * Math.PI * 2 - 0.6));
        return (
          <span
            key={`h${i}`}
            className="absolute"
            style={{
              width: `${HANDLE}em`,
              height: `${FACET + 0.05}em`,
              margin: `${-(FACET + 0.05) / 2}em 0 0 ${-HANDLE / 2}em`,
              transform: `rotateX(${(360 / HANDLE_FACES) * i}deg) translateZ(${HANDLE_R}em)`,
              background: `repeating-linear-gradient(90deg, hsl(140 4% ${light}%) 0 0.18em, hsl(140 4% ${light - 14}%) 0.18em 0.3em)`,
            }}
          />
        );
      })}
      {LAYERS.map((layer, i) => (
        <span
          key={`p${i}`}
          className="absolute rounded-full"
          style={{
            width: `${layer.size}em`,
            height: `${layer.size}em`,
            margin: `${-layer.size / 2}em 0 0 ${-layer.size / 2}em`,
            transform: `translateX(${layer.x}em) rotateY(90deg)`,
            background: layer.background,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Нүүр хуудасны эхний хэсэг. Доош гүйлгэхэд дэлгэцэнд тогтож, гантил эргэлдэн мэдээллийн картууд
 * нэг нэгээр гарч ирнэ (anime.js `onScroll`, гүйлгэлттэй sync).
 * Хөдөлгөөн багасгах тохиргоотой эсвэл JS ажиллахгүй бол бүх агуулга энгийн, хөдөлгөөнгүй харагдана.
 */
export function DumbbellHero({ children, background }: { children: ReactNode; background?: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const scope = useRef<Scope>(null);

  useEffect(() => {
    scope.current = createScope({
      root,
      mediaQueries: { reduce: "(prefers-reduced-motion: reduce)", wide: "(min-width: 768px)" },
    }).add((self) => {
      if (!self || self.matches.reduce) return;
      const wide = self.matches.wide;

      // Ачаалахад: гантил эргэлдэн том болж орж ирнэ (гүйлгэлтээс тусдаа давхарга дээр).
      createTimeline({ defaults: { ease: "out(4)" } }).add("[data-db-enter]", {
        opacity: [0, 1],
        scale: [0.55, 1],
        rotateZ: [-40, 0],
        duration: 1600,
        delay: 250,
      });

      // Гүйлгэлттэй холбогдсон гол timeline (0..1000 нь хэсгийн эхнээс төгсгөл хүртэл).
      const tl = createTimeline({
        defaults: { ease: "linear" },
        autoplay: onScroll({ target: root.current!, enter: "top top", leave: "bottom bottom", sync: 0.15 }),
      });

      // Эхэндээ гантил гарчгийн доорх сул зайд багтана, дараа нь төв рүү шилжиж томорно.
      const intro = self.root.querySelector<HTMLElement>("[data-db-intro]")!;
      const stage = self.root.querySelector<HTMLElement>("[data-db-move]")!;
      const freeSpace = () => stage.offsetHeight - (intro.offsetTop + intro.offsetHeight);
      const startY = () => stage.offsetHeight / 2 - freeSpace() / 2;
      const startScale = () => {
        const height = parseFloat(getComputedStyle(stage).fontSize) * PLATES[0].size * 1.2;
        return Math.min(0.85, Math.max(0.35, freeSpace() / height));
      };

      tl.add("[data-db-intro]", { opacity: [1, 0], y: [0, -60], filter: ["blur(0px)", "blur(6px)"], duration: 140, ease: "in(2)" }, 0)
        .add(stage, { y: [startY, 0], scale: [startScale, 1], duration: 160, ease: "inOut(2)" }, 20)
        .add(
          "[data-db-spin]",
          {
            rotateY: [-30, 690],
            rotateX: [-16, 10, -22, 8, -16],
            rotateZ: [-14, 6, -6, 10, 0],
            duration: 1000,
          },
          0,
        );

      const cards = self.root.querySelectorAll<HTMLElement>("[data-db-step]");
      cards.forEach((card, i) => {
        const at = 200 + i * 190;
        const fromX = wide ? (i % 2 ? 60 : -60) : 0;
        tl.add(card, { opacity: [0, 1], x: [fromX, 0], y: [40, 0], scale: [0.9, 1], duration: 90, ease: "out(3)" }, at)
          .add(card.querySelectorAll("[data-db-line]"), { opacity: [0, 1], x: [-12, 0], duration: 70, delay: stagger(20) }, at + 30);
        // Утсан дээр нэг карт л харагдана: дараагийнх нь гарахад өмнөх нь алга болно.
        if (!wide && i < cards.length - 1) {
          tl.add(card, { opacity: [1, 0], y: [0, -30], duration: 60, ease: "in(2)" }, at + 160);
        }
      });
      tl.add("[data-db-glow]", { opacity: [0.35, 0.9], scale: [0.8, 1.15], duration: 1000 }, 0);

      const onResize = () => tl.refresh();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    });

    return () => scope.current?.revert();
  }, []);

  return (
    <section
      ref={root}
      data-db
      className="dark relative isolate bg-background text-foreground motion-safe:h-[420svh]"
      aria-label="Танилцуулга"
    >
      {/* JS байхгүй үед картууд нуугдахгүй, хуудас энгийн урттай. */}
      <noscript>
        <style>{`[data-db]{height:auto!important}[data-db-step],[data-db-enter]{opacity:1!important}`}</style>
      </noscript>

      <div className="overflow-hidden motion-safe:sticky motion-safe:top-16 motion-safe:h-[calc(100svh-4rem)]">
        {background}

        <div className="relative mx-auto flex h-full max-w-6xl flex-col px-4">
          <div data-db-intro className="relative z-10 pt-12 text-center sm:pt-16">
            {children}
          </div>

          {/* Гантил */}
          <div
            aria-hidden
            data-db-move
            className="pointer-events-none absolute inset-0 flex items-center justify-center motion-reduce:static motion-reduce:h-80"
            style={{ fontSize: "clamp(6px, min(2vw, 1.45svh), 13px)", perspective: "90em" } as CSSProperties}
          >
            <div data-db-glow className="absolute size-[36em] rounded-full bg-brand/25 opacity-40 blur-[6em]" />
            <div data-db-enter className="[transform-style:preserve-3d] motion-safe:opacity-0">
              <div
                data-db-spin
                className="[transform-style:preserve-3d]"
                style={{ transform: "rotateX(-16deg) rotateY(-30deg) rotateZ(-14deg)" }}
              >
                <Dumbbell />
              </div>
            </div>
          </div>

          {/* Мэдээллийн картууд */}
          <ol className="relative z-10 grid gap-3 pb-12 sm:grid-cols-2 motion-safe:absolute motion-safe:inset-x-4 motion-safe:top-0 motion-safe:bottom-0 motion-safe:block motion-safe:pb-0">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                data-db-step
                className={cn(
                  "rounded-2xl border bg-card/70 p-5 shadow-2xl shadow-black/40 backdrop-blur-md",
                  "motion-safe:absolute motion-safe:inset-x-0 motion-safe:bottom-8 motion-safe:opacity-0 md:motion-safe:inset-x-auto md:motion-safe:bottom-auto md:motion-safe:w-72 lg:motion-safe:w-80",
                  CORNERS[i],
                )}
              >
                <div data-db-line className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <step.icon className="size-5" />
                  </span>
                  <span className="font-display text-sm text-brand tabular-nums">0{i + 1}</span>
                </div>
                <h2 data-db-line className="mt-3 text-lg font-semibold tracking-tight">
                  {step.title}
                </h2>
                <p data-db-line className="mt-1 text-sm text-muted-foreground">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
