import type { Metadata } from 'next';
import { getExploreSpecimens, getExploreCollectors } from '@/app/actions/explore';
import { ExploreClient } from './ExploreClient';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Explore corals and keepers',
  description:
    'Browse reef corals logged by keepers — species, lineage, frag history and photos. Every specimen has its own public page.',
  alternates: { canonical: '/explore' },
};

export default async function ExplorePage() {
  const [specimens, collectors] = await Promise.all([
    getExploreSpecimens(),
    getExploreCollectors(),
  ]);

  return <ExploreClient specimens={specimens} collectors={collectors} />;
}
