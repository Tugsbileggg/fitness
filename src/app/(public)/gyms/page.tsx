import type { Metadata } from "next";
import { GymDirectory } from "@/features/directory/components/gym-directory";
import { listPublicGyms } from "@/features/directory/queries";

export const metadata: Metadata = {
  title: "Фитнес хайх",
  description: "Ойролцоох фитнесүүдийн үнэ, цагийн хуваарь, байршил, үйлчилгээ нэг дороос.",
};

// 5 минут тутам шинэчилнэ. Менежер танилцуулгаа засахад шууд шинэчлэгдэнэ (revalidateDirectory).
export const revalidate = 300;

export default async function GymsPage() {
  const gyms = await listPublicGyms();
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Фитнес хайх</h1>
        <p className="text-muted-foreground">
          Ойролцоох фитнесүүдийн үнэ, цагийн хуваарь, байршлыг нэг дороос харьцуулаарай.
        </p>
      </div>
      <GymDirectory gyms={gyms} />
    </div>
  );
}
