import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { APP_NAME, TRIAL_DAYS } from "@/lib/config";
import { BRAND_INK, BRAND_LIME, BrandGlyph } from "@/lib/brand-glyph";

export const alt = `${APP_NAME} — фитнесийн үйлчлүүлэгч, төлбөрийн бүртгэл`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const HEADLINE = ["Үйлчлүүлэгч, төлбөрөө", "нэг дороос", "хяна"];
const SUBLINE = `Эрх дуусахыг сануулна · ${TRIAL_DAYS} хоног үнэгүй`;

/**
 * next/og-ийн анхдагч фонтод кирилл үсэг байхгүй тул Montserrat-ыг build-ийн үед Google Fonts-оос
 * зөвхөн хэрэгтэй үсгүүдээр (`text=`) татна. Татаж чадаагүй бол бичвэргүй зураг гаргана (build унахгүй).
 */
async function loadMontserrat(weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Montserrat:wght@${weight}&text=${encodeURIComponent(text)}`,
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const photo = await readFile(join(process.cwd(), "public/images/hero-gym.jpg"), "base64");
  const text = [APP_NAME, ...HEADLINE, SUBLINE].join("");
  const [extraBold, medium] = await Promise.all([loadMontserrat(800, text), loadMontserrat(500, text)]);
  const fonts = [
    extraBold && { name: "Montserrat", data: extraBold, weight: 800 as const },
    medium && { name: "Montserrat", data: medium, weight: 500 as const },
  ].filter((f) => !!f);
  const withText = fonts.length === 2;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: BRAND_INK }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og зурагт next/image ажиллахгүй */}
        <img
          src={`data:image/jpeg;base64,${photo}`}
          alt=""
          width={1200}
          height={800}
          style={{ position: "absolute", top: -60, left: 0, width: 1200, height: 800, objectFit: "cover", opacity: 0.45 }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage: `linear-gradient(90deg, ${BRAND_INK} 0%, rgba(15,20,16,0.85) 55%, rgba(15,20,16,0.35) 100%)`,
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: withText ? "space-between" : "center",
            padding: "64px 72px",
            width: "100%",
            fontFamily: "Montserrat",
            color: "#f2f5ee",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: withText ? 72 : 160,
                height: withText ? 72 : 160,
                borderRadius: withText ? 20 : 44,
                background: BRAND_LIME,
              }}
            >
              <BrandGlyph size={withText ? 44 : 100} color={BRAND_INK} />
            </div>
            {withText && <div style={{ fontSize: 36, fontWeight: 800 }}>{APP_NAME}</div>}
          </div>
          {withText && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
                <span>{HEADLINE[0]}</span>
                <div style={{ display: "flex", gap: 20 }}>
                  <span style={{ color: BRAND_LIME }}>{HEADLINE[1]}</span>
                  <span>{HEADLINE[2]}</span>
                </div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 500, color: "#a9b3a6" }}>{SUBLINE}</div>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
