import { getMySpecimens } from '@/app/actions/specimens';
import { CollectionClient } from './CollectionClient';

export default async function MyCollectionPage() {
  const specimens = await getMySpecimens();
  return <CollectionClient specimens={specimens} />;
}
