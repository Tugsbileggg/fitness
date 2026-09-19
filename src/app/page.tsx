import { Button } from "@/components/ui/button";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config";
import { formatDate } from "@/lib/dates";
import { formatMNT } from "@/lib/money";

// Түр нүүр хуудас. 1-р үе шатанд жинхэнэ танилцуулга, нэвтрэх хэсгээр солигдоно.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{APP_NAME}</h1>
        <p className="text-muted-foreground">{APP_DESCRIPTION}</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border p-3">
          <dt className="text-muted-foreground">Огнооны формат</dt>
          <dd className="font-medium">{formatDate("2026-09-19")}</dd>
        </div>
        <div className="rounded-lg border p-3">
          <dt className="text-muted-foreground">Жишээ дүн</dt>
          <dd className="font-medium">{formatMNT(1250000)}</dd>
        </div>
      </dl>
      <Button size="lg" disabled>
        Удахгүй: Фитнесээ бүртгүүлэх
      </Button>
    </main>
  );
}
