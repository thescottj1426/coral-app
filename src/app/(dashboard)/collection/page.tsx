import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { getMySpecimens } from '@/app/actions/specimens';
import { getDashboardStats, getMyListings, type DashboardStats, type MyListing } from '@/app/actions/dashboard';
import { CollectionClient } from './CollectionClient';
import { specimenCapFor } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

export default async function MyCollectionPage() {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    user = await getCurrentUser();
  } catch {
    redirect('/sign-in');
  }

  const [specimens, stats, listings] = await Promise.all([
    getMySpecimens(),
    getDashboardStats(),
    getMyListings(),
  ]);

  const firstName = (user.name ?? user.email ?? 'Keeper').split(' ')[0];

  return (
    <CollectionClient
      specimens={specimens}
      stats={stats}
      listings={listings}
      firstName={firstName}
      specimenCap={specimenCapFor(user)}
    />
  );
}
