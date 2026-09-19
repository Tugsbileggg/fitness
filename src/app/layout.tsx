import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config";
import "./globals.css";

// Монгол кирилл үсгүүд (Ө, Ү) `cyrillic-ext` subset-д байдаг.
const inter = Inter({
  variable: "--font-sans",
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
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mn" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
