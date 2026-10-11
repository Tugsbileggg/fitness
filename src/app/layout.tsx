import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config";
import "./globals.css";

// Монгол кирилл үсгүүд (Ө, Ү) `cyrillic-ext` subset-д байдаг.
const onest = Onest({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  display: "swap",
});

// Том гарчгуудад (`font-display`). Өргөн үсэгтэй тул жижиг текстэд бүү хэрэглэ.
const unbounded = Unbounded({
  variable: "--font-display",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f8f4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mn" className={`${onest.variable} ${unbounded.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
