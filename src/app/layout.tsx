import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config";
import "./globals.css";

// Монгол кирилл үсгүүд (Ө, Ү) `cyrillic-ext`-д, төгрөгийн тэмдэг (₮, U+20AE) `latin-ext`-д байдаг.
// Subset байгаа нь фонтод тэр үсэг байна гэсэн үг биш: Unbounded, Onest, Golos зэрэгт Ө/Ү эсвэл ₮ алга.
// Фонт солихоосоо өмнө "Ө ө Ү ү ₮" бүгдийг хөтөч дээр шалгана.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  display: "swap",
});

// Том гарчиг, тоонд (`font-display`, globals.css-д ExtraBold). Жижиг текстэд бүү хэрэглэ.
const montserrat = Montserrat({
  variable: "--font-display",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
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
    <html lang="mn" className={`${inter.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
