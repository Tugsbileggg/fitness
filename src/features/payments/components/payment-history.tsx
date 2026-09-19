import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/dates";
import { PAYMENT_METHOD_LABELS } from "@/lib/membership";
import { formatMNT } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { listClientPayments } from "../queries";
import { VoidPaymentDialog } from "./void-payment-dialog";

type Payment = Awaited<ReturnType<typeof listClientPayments>>[number];

/** Үйлчлүүлэгчийн төлбөрийн түүх (менежер). Зөвхөн хамгийн сүүлийн хүчинтэй төлбөрийг хүчингүй болгоно. */
export function PaymentHistory({
  payments,
  clientId,
  canVoid,
}: {
  payments: Payment[];
  clientId: string;
  canVoid: boolean;
}) {
  if (payments.length === 0) {
    return <p className="text-sm text-muted-foreground">Төлбөр бүртгэгдээгүй байна.</p>;
  }
  const latestValidId = payments.find((p) => !p.voided_at)?.id;

  return (
    <ul className="divide-y">
      {payments.map((p) => (
        <li key={p.id} className={cn("py-3 first:pt-0 last:pb-0", p.voided_at && "opacity-60")}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("font-medium", p.voided_at && "line-through")}>{p.plan_name}</span>
                <Badge variant={p.is_renewal ? "info" : "outline"}>{p.is_renewal ? "Сунгалт" : "Шинэ"}</Badge>
                {p.voided_at && <Badge variant="danger">Хүчингүй</Badge>}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(p.starts_on)} – {formatDate(p.ends_on)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(p.paid_on)}-нд · {PAYMENT_METHOD_LABELS[p.method]}
                {p.recorder && ` · ${p.recorder.full_name}`}
              </div>
              {p.discount_amount > 0 && (
                <div className="text-sm text-emerald-700">
                  Хөнгөлөлт {formatMNT(p.discount_amount)}
                  {p.discount_type === "percent" && ` (${Number(p.discount_value)}%)`}
                </div>
              )}
              {p.note && <div className="text-sm">{p.note}</div>}
              {p.voided_at && p.void_reason && (
                <div className="text-sm text-destructive">Шалтгаан: {p.void_reason}</div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={cn("font-semibold tabular-nums", p.voided_at && "line-through")}>
                {formatMNT(p.amount)}
              </span>
              {canVoid && p.id === latestValidId && (
                <VoidPaymentDialog paymentId={p.id} clientId={clientId} amount={p.amount} />
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
