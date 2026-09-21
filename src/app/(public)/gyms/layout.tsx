import { PublicFooter, PublicHeader } from "@/components/public-header";

export default function GymsLayout({ children }: LayoutProps<"/gyms">) {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 sm:pt-8 lg:pb-12">{children}</main>
      <PublicFooter />
    </div>
  );
}
