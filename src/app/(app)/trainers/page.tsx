import { ChevronRightIcon, PhoneIcon, PlusIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrainerAccountBadge } from "@/features/trainers/components/trainer-badges";
import { listTrainers } from "@/features/trainers/queries";
import { requireGymContext } from "@/lib/auth/context";
import { formatPhone } from "@/lib/phone";

export const metadata: Metadata = { title: "Багш нар" };

export default async function TrainersPage() {
  const { gym } = await requireGymContext({ managerOnly: true });
  const trainers = await listTrainers(gym.id, true);

  const addButton = gym.isWritable ? (
    <Button asChild>
      <Link href="/trainers/new">
        <PlusIcon />
        Багш нэмэх
      </Link>
    </Button>
  ) : null;

  return (
    <>
      <PageHeader
        title="Багш нар"
        description="Багш нарын бүртгэл ба системд нэвтрэх эрх"
        actions={trainers.length > 0 ? addButton : null}
      />

      {trainers.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="Багш бүртгэгдээгүй байна"
          description="Багш нараа бүртгээд, хүсвэл имэйлээр урьж системд нэвтрүүлээрэй."
          action={addButton}
        />
      ) : (
        <Card className="divide-y p-0">
          {trainers.map((t) => (
            <Link
              key={t.id}
              href={`/trainers/${t.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={t.is_active ? "font-medium" : "font-medium text-muted-foreground"}>
                    {t.full_name}
                  </span>
                  <TrainerAccountBadge account={t.account} isActive={t.is_active} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <PhoneIcon className="size-3.5" />
                    {formatPhone(t.phone)}
                  </span>
                  {t.specialization && <span>{t.specialization}</span>}
                </div>
              </div>
              <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
