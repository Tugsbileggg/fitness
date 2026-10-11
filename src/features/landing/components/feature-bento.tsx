import { BellRingIcon, CalendarClockIcon, SmartphoneIcon, UsersIcon, WalletIcon } from "lucide-react";
import type { ReactNode } from "react";
import { addMonthsISO, formatDate, todayUB } from "@/lib/dates";
import { formatMNT } from "@/lib/money";
import { revealDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";

function Tile({
  icon: Icon,
  title,
  text,
  index,
  children,
  className,
}: {
  icon: typeof BellRingIcon;
  title: string;
  text: string;
  index: number;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-reveal
      data-glow
      style={revealDelay(index)}
      className={cn("flex flex-col gap-5 overflow-hidden rounded-3xl border bg-card p-6 text-card-foreground", className)}
    >
      <div className="space-y-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
        <h3 className="pt-2 text-lg font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
      {children && <div className="mt-auto">{children}</div>}
    </div>
  );
}

const STATUS_ROWS = [
  { name: "Э. Номин", label: "Идэвхтэй", tone: "bg-emerald-100 text-emerald-800", bar: "bg-emerald-500" },
  { name: "Г. Тэмүүлэн", label: "2 хоног үлдсэн", tone: "bg-red-100 text-red-800", bar: "bg-red-500" },
  { name: "Н. Ану", label: "4 хоног үлдсэн", tone: "bg-amber-100 text-amber-900", bar: "bg-amber-400" },
];

/** Нүүр хуудасны боломжуудын bento grid. Жижиг дүрслэлүүд нь чимэглэл (aria-hidden). */
export function FeatureBento() {
  const today = todayUB();
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Tile
        icon={BellRingIcon}
        index={0}
        title="Эрх дуусахыг анзаарна"
        text="Хэдэн хоногийн дараа эрх нь дуусах үйлчлүүлэгчид өнгөөр ялгагдаж, нэг дор харагдана. Утасдсан эсэхээ ч тэмдэглэнэ."
        className="lg:col-span-2"
      >
        <ul aria-hidden className="divide-y rounded-2xl border bg-background px-4">
          {STATUS_ROWS.map((row) => (
            <li key={row.name} className="relative flex items-center justify-between gap-3 py-3 pl-3.5">
              <span className={cn("absolute top-3 bottom-3 left-0 w-1 rounded-full", row.bar)} />
              <span className="text-sm font-medium">{row.name}</span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", row.tone)}>{row.label}</span>
            </li>
          ))}
        </ul>
      </Tile>

      <Tile
        icon={CalendarClockIcon}
        index={1}
        title="Сунгалт автоматаар"
        text="Төлбөр бүртгэхэд дуусах огноо өөрөө бодогдоно. Хугацаа нь дуусаагүй бол үргэлжлүүлж сунгана."
      >
        <div aria-hidden className="flex items-center justify-between gap-2 rounded-2xl border bg-background p-4 text-sm">
          <span className="font-medium">{formatDate(today)}</span>
          <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-medium text-brand">+1 сар</span>
          <span className="font-medium">{formatDate(addMonthsISO(today, 1))}</span>
        </div>
      </Tile>

      <div
        data-reveal
        data-glow
        style={revealDelay(2)}
        className="dark flex flex-col gap-5 overflow-hidden rounded-3xl bg-background p-6 text-foreground"
      >
        <div className="space-y-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <WalletIcon className="size-5" />
          </span>
          <h3 className="pt-2 text-lg font-semibold tracking-tight">Орлогоо хянана</h3>
          <p className="text-sm text-muted-foreground">
            Бэлэн болон дансны төлбөр, хөнгөлөлт, энэ сарын орлого, шинэ ба сунгасан үйлчлүүлэгчид.
          </p>
        </div>
        <div aria-hidden className="mt-auto space-y-3">
          <p className="font-display text-2xl text-brand">{formatMNT(12_450_000)}</p>
          <div className="flex h-16 items-end gap-1.5">
            {[40, 55, 48, 66, 78, 100].map((h, i) => (
              <span key={i} className={cn("flex-1 rounded-sm", i === 5 ? "bg-brand" : "bg-white/15")} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>

      <Tile
        icon={UsersIcon}
        index={3}
        title="Багш нартайгаа хамт"
        text="Багш нарыг имэйлээр урьж нэвтрүүлнэ. Тэд үйлчлүүлэгч бүртгэж, төлбөр авна. Орлогын тайлан зөвхөн танд харагдана."
      >
        <div aria-hidden className="flex -space-x-2">
          {["БС", "ТГ", "НА", "ДБ"].map((initials, i) => (
            <span
              key={initials}
              className={cn(
                "flex size-9 items-center justify-center rounded-full border-2 border-card text-xs font-semibold",
                i === 0 ? "bg-ink text-brand" : "bg-muted",
              )}
            >
              {initials}
            </span>
          ))}
        </div>
      </Tile>

      <Tile
        icon={SmartphoneIcon}
        index={4}
        title="Утсан дээр бүрэн ажиллана"
        text="Апп татах шаардлагагүй. Утас, таблет, компьютерийн хөтчөөс шууд ашиглана."
      />
    </div>
  );
}
