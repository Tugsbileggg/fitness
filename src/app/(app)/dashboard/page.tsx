import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireGymContext, type SubscriptionStatus } from "@/lib/auth/context";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Хяналт" };

const STATUS_BADGE: Record<SubscriptionStatus, { label: string; variant: "success" | "info" | "danger" | "warning" }> = {
  trial: { label: "Туршилт", variant: "info" },
  active: { label: "Идэвхтэй", variant: "success" },
  past_due: { label: "Хугацаа дууссан", variant: "danger" },
  suspended: { label: "Түр зогссон", variant: "danger" },
};

// 4-р үе шатанд жинхэнэ хяналтын самбараар солигдоно.
export default async function DashboardPage() {
  const { fullName, gym, today } = await requireGymContext();
  const status = STATUS_BADGE[gym.status];

  return (
    <>
      <PageHeader
        title={`Сайн байна уу, ${fullName.split(" ").at(-1)}`}
        description={`Өнөөдөр ${formatDate(today)}`}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Платформын эрх</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Badge variant={status.variant}>{status.label}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {gym.accessEndsOn ? `${formatDate(gym.accessEndsOn)} хүртэл` : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Фитнес</CardDescription>
            <CardTitle className="text-lg">{gym.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Хяналтын самбар удахгүй: хугацаа дуусах гэж буй үйлчлүүлэгчид, орлого, сунгалт.
          </CardContent>
        </Card>
      </div>
    </>
  );
}
