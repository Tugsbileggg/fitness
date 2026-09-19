import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/dates";
import { membershipStatus } from "@/lib/membership";

/** Эрхийн төлөвийн тэмдэглэгээ: "5 хоног үлдсэн", "Дууссан" гэх мэт. */
export function MembershipBadge({
  endsOn,
  today,
  threshold,
  withDate = false,
}: {
  endsOn: string | null | undefined;
  today: string;
  threshold: number;
  withDate?: boolean;
}) {
  const { status, daysLeft } = membershipStatus(endsOn ?? null, today, threshold);
  const date = withDate && endsOn ? ` · ${formatDate(endsOn)}` : "";

  switch (status) {
    case "none":
      return <Badge variant="muted">Эрхгүй</Badge>;
    case "expired":
      return (
        <Badge variant="danger">
          Дууссан{withDate && endsOn ? ` · ${formatDate(endsOn)}` : ""}
        </Badge>
      );
    case "expiring":
      return (
        <Badge variant={daysLeft! <= 2 ? "danger" : "warning"}>
          {daysLeft === 0 ? "Өнөөдөр дуусна" : `${daysLeft} хоног үлдсэн`}
          {date}
        </Badge>
      );
    default:
      return (
        <Badge variant="success">
          Идэвхтэй{date}
        </Badge>
      );
  }
}
