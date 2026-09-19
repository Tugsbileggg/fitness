import { ChevronRightIcon, PlusIcon, SearchXIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClientFilters } from "@/features/clients/components/client-filters";
import { isStatusFilter, listClients } from "@/features/clients/queries";
import { ageFromBirthYear, GENDER_LABELS } from "@/features/clients/schemas";
import { MembershipBadge } from "@/features/payments/components/membership-badge";
import { trainerOptions } from "@/features/trainers/queries";
import { requireGymContext } from "@/lib/auth/context";
import { formatPhone } from "@/lib/phone";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Үйлчлүүлэгчид" };

function param(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  const { gym, today } = await requireGymContext();
  const sp = await searchParams;
  const q = param(sp.q);
  const trainer = param(sp.trainer);
  const trainerId = trainer === "none" || isUuid(trainer) ? trainer : undefined;
  const statusParam = param(sp.status);
  const status = isStatusFilter(statusParam) ? statusParam : undefined;
  const page = Number(param(sp.page)) || 1;

  const [{ rows, total, pageSize }, trainers] = await Promise.all([
    listClients(gym.id, { q, trainerId, status, page }),
    trainerOptions(gym.id),
  ]);
  const filtered = Boolean(q || trainerId || status);

  const addButton = gym.isWritable ? (
    <Button asChild>
      <Link href="/clients/new">
        <PlusIcon />
        Үйлчлүүлэгч нэмэх
      </Link>
    </Button>
  ) : null;

  return (
    <>
      <PageHeader
        title="Үйлчлүүлэгчид"
        description={total > 0 || filtered ? `Нийт ${total} үйлчлүүлэгч` : undefined}
        actions={addButton}
      />

      {(total > 0 || filtered) && <ClientFilters trainers={trainers} />}

      {rows.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={SearchXIcon}
            title="Илэрц олдсонгүй"
            description="Өөр нэр, утасны дугаараар хайж үзнэ үү."
          />
        ) : (
          <EmptyState
            icon={UsersIcon}
            title="Үйлчлүүлэгч бүртгэгдээгүй байна"
            description="Эхний үйлчлүүлэгчээ бүртгээд эрхийн төлбөрийг нь оруулаарай."
            action={addButton}
          />
        )
      ) : (
        <Card className="divide-y p-0">
          {rows.map((c) => (
            <Link
              key={c.id}
              href={`/clients/${c.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="truncate font-medium">{c.full_name}</span>
                  <MembershipBadge
                    endsOn={c.ends_on}
                    today={today}
                    threshold={gym.expiringThresholdDays}
                  />
                </div>
                <div className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                  <span>{formatPhone(c.phone)}</span>
                  <span>
                    {c.gender && GENDER_LABELS[c.gender]}, {ageFromBirthYear(c.birth_year ?? 0, today)} настай
                  </span>
                  {c.trainer_name && <span>Багш: {c.trainer_name}</span>}
                </div>
              </div>
              <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </Card>
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        basePath="/clients"
        params={{ q, trainer: trainerId, status }}
      />
    </>
  );
}
