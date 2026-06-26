import { getExploreSpecimens, getExploreCollectors } from '@/app/actions/explore';
import { ExploreClient } from './ExploreClient';

export default async function ExplorePage() {
  const [specimens, collectors] = await Promise.all([
    getExploreSpecimens(),
    getExploreCollectors(),
  ]);

  return <ExploreClient specimens={specimens} collectors={collectors} />;
}
