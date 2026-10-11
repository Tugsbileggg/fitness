import { PlusIcon, SearchXIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { ClientFilters } from "@/features/clients/components/client-filters";
import { ClientList } from "@/features/clients/components/client-list";
import { StatusTabs } from "@/features/clients/components/status-tabs";
import { countClientsByStatus, isStatusFilter, listClients } from "@/features/clients/queries";
import { trainerOptions } from "@/features/trainers/queries";
import { requireGymContext } from "@/lib/auth/context";
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

  const [{ rows, total, pageSize }, counts, trainers] = await Promise.all([
    listClients(gym.id, { q, trainerId, status, page }),
    countClientsByStatus(gym.id, { q, trainerId }),
    trainerOptions(gym.id),
  ]);
  const filtered = Boolean(q || trainerId || status);
  // Хайлт, шүүлтгүй үед ч үйлчлүүлэгч байхгүй бол шүүлтүүрүүдийг нуух.
  const hasAny = counts.all > 0 || Boolean(q || trainerId);

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
        description={hasAny ? `Нийт ${counts.all} үйлчлүүлэгч` : undefined}
        actions={addButton}
      />

      {hasAny && (
        <div className="mb-4 flex flex-col gap-3">
          <StatusTabs current={status} counts={counts} params={{ q, trainer: trainerId }} />
          <ClientFilters trainers={trainers} />
        </div>
      )}

      {rows.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={SearchXIcon}
            title="Илэрц олдсонгүй"
            description="Өөр нэр, утасны дугаараар хайж эсвэл өөр төлөв сонгож үзнэ үү."
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
        <ClientList rows={rows} today={today} threshold={gym.expiringThresholdDays} />
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
