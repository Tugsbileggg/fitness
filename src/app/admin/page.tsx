import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Админ самбар" };

// 5-р үе шатанд фитнесүүдийн жагсаалт, платформын орлогоор солигдоно.
export default function AdminHomePage() {
  return (
    <>
      <PageHeader title="Платформын админ" description="Фитнесүүд, платформын төлбөр" />
      <Card>
        <CardContent className="text-muted-foreground">Админ самбар 5-р үе шатанд бэлэн болно.</CardContent>
      </Card>
    </>
  );
}
