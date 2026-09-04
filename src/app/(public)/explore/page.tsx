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
  // This page is statically generated, so these run at build time. Unguarded,
  // a database blip fails the whole deploy — and CI cannot build at all
  // without a connection string. Fall back to empty; ISR refills within 60s.
  const [specimens, collectors] = await Promise.all([
    getExploreSpecimens().catch(() => []),
    getExploreCollectors().catch(() => []),
  ]);

  return <ExploreClient specimens={specimens} collectors={collectors} />;
}
