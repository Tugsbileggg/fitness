import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ListingStatusCard } from "@/features/directory/components/listing-status";
import { GymProfileForm } from "@/features/directory/components/profile-form";
import { listingFormDefaults, listingStatus } from "@/features/directory/listing";
import { getMyListing } from "@/features/directory/queries";
import { requireGymContext } from "@/lib/auth/context";

export const metadata: Metadata = { title: "Танилцуулга" };

export default async function ListingPage() {
  const { gym } = await requireGymContext({ managerOnly: true });
  const listing = await getMyListing(gym.id);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title="Танилцуулга"
        description="Фитнесийн тань нийтийн хуудас. Ирээдүйн үйлчлүүлэгчид “Фитнес хайх” хэсгээс таныг олно."
        className="mb-2"
      />
      <ListingStatusCard status={listingStatus(listing, gym.status)} slug={listing.profile?.slug ?? null} />
      <GymProfileForm
        gymId={gym.id}
        defaultValues={listingFormDefaults(listing)}
        address={listing.gym.address}
        plans={listing.plans}
        disabled={!gym.isWritable}
      />
    </div>
  );
}
