import { ArrowLeftIcon, EyeIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GymProfileView } from "@/features/directory/components/gym-profile-view";
import { getMyListing, listingToPublicGym } from "@/features/directory/queries";
import { requireGymContext } from "@/lib/auth/context";

export const metadata: Metadata = { title: "Урьдчилан харах" };

/** Менежер хадгалсан танилцуулгаа нийтэд ямар харагдахыг (нийтлээгүй байсан ч) харна. */
export default async function ListingPreviewPage() {
  const { gym } = await requireGymContext({ managerOnly: true });
  const listing = await getMyListing(gym.id);
  const publicGym = listingToPublicGym(listing);
  if (!publicGym) redirect("/listing");

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sky-950 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm">
          <EyeIcon className="size-4 shrink-0" />
          Урьдчилан харах: хадгалсан мэдээлэл нийтэд ингэж харагдана.
        </p>
        <Link href="/listing" className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline">
          <ArrowLeftIcon className="size-4" />
          Засах руу буцах
        </Link>
      </div>
      <GymProfileView gym={publicGym} verified={listing.verified} />
    </div>
  );
}
