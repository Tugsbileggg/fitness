import { DesktopSidebar, MobileBottomNav, MobileHeader } from "@/components/app-shell/app-nav";
import { SubscriptionBanner } from "@/components/app-shell/subscription-banner";
import { Toaster } from "@/components/ui/toaster";
import { requireGymContext } from "@/lib/auth/context";

export default async function GymAppLayout({ children }: { children: React.ReactNode }) {
  const { gym, fullName } = await requireGymContext();
  const shell = { gymName: gym.name, logoUrl: gym.logoUrl, role: gym.role, fullName };

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <DesktopSidebar {...shell} />
      <div className="flex min-h-svh min-w-0 flex-col">
        <MobileHeader {...shell} />
        <SubscriptionBanner gym={gym} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-24 lg:px-8 lg:pt-8 lg:pb-10">
          {children}
        </main>
        <MobileBottomNav role={gym.role} />
      </div>
      <Toaster />
    </div>
  );
}
