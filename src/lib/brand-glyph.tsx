// Брэндийн гантель (lucide "dumbbell"). app/icon.svg-тэй ижил; next/og-ийн зурагт (apple-icon, OG) хэрэглэнэ.
const PATHS = [
  "M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z",
  "m2.5 21.5 1.4-1.4",
  "m20.1 3.9 1.4-1.4",
  "M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z",
  "m9.6 14.4 4.8-4.8",
];

export const BRAND_INK = "#0f1410";
export const BRAND_LIME = "#d2fc4a";

export function BrandGlyph({ size, color = BRAND_LIME }: { size: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
      {PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
