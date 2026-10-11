import { ImageResponse } from "next/og";
import { BRAND_INK, BrandGlyph } from "@/lib/brand-glyph";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iPhone-ы "Home Screen-д нэмэх" icon. iOS булангуудыг өөрөө дугуйлна. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND_INK }}>
        <BrandGlyph size={112} />
      </div>
    ),
    size,
  );
}
