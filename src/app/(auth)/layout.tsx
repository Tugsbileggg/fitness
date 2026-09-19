import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col items-center px-4 py-8 sm:justify-center sm:py-12">
      <Brand className="mb-6" />
      <main className="w-full max-w-md">{children}</main>
    </div>
  );
}
