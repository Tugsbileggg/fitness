import { CircleAlertIcon, CircleCheckIcon, ClockIcon, EyeIcon, ExternalLinkIcon, FilePenIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ListingStatus } from "../listing";

const STATUS: Record<
  ListingStatus,
  { title: string; text: string; icon: typeof CircleCheckIcon; tone: string }
> = {
  live: {
    title: "Нийтэд харагдаж байна",
    text: "Ирээдүйн үйлчлүүлэгчид “Фитнес хайх” хэсгээс таныг олж, үнэ, цаг, байршлыг тань харна.",
    icon: CircleCheckIcon,
    tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  pending: {
    title: "Админ баталгаажуулахыг хүлээж байна",
    text: "Хуурамч бүртгэлээс сэргийлж платформын админ фитнес бүрийг шалгадаг. Баталгаажмагц “Фитнес хайх” хэсэгт автоматаар гарна.",
    icon: ClockIcon,
    tone: "border-amber-200 bg-amber-50 text-amber-900",
  },
  billing: {
    title: "Платформын эрх дууссан тул нийтэд харагдахгүй байна",
    text: "Эрхээ сунгамагц танилцуулга тань дахин харагдана.",
    icon: CircleAlertIcon,
    tone: "border-red-200 bg-red-50 text-red-900",
  },
  draft: {
    title: "Ноорог: нийтэд харагдахгүй",
    text: "Мэдээллээ бөглөөд “Нийтэд харуулах”-ыг асааж хадгална уу.",
    icon: FilePenIcon,
    tone: "border-border bg-muted/50",
  },
  new: {
    title: "Танилцуулга үүсгээгүй байна",
    text: "Доорх мэдээллийг бөглөж хадгалснаар фитнес тань “Фитнес хайх” хэсэгт гарах боломжтой болно.",
    icon: FilePenIcon,
    tone: "border-border bg-muted/50",
  },
};

export function ListingStatusCard({ status, slug }: { status: ListingStatus; slug: string | null }) {
  const s = STATUS[status];
  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between", s.tone)}>
      <div className="flex gap-3">
        <s.icon className="mt-0.5 size-5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold">{s.title}</p>
          <p className="text-sm opacity-90">{s.text}</p>
          {status === "billing" && (
            <Link href="/billing" className="text-sm font-medium underline">
              Платформын эрх
            </Link>
          )}
        </div>
      </div>
      {slug && (
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild variant="outline" className="bg-background">
            <Link href="/listing/preview">
              <EyeIcon />
              Урьдчилан харах
            </Link>
          </Button>
          {status === "live" && (
            <Button asChild variant="outline" className="bg-background">
              <a href={`/gyms/${slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon />
                Нийтийн хуудас
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
