import { redirect } from 'next/navigation';
import { getSpecimen } from '@/app/actions/specimens';

interface Props {
  params: Promise<{ rfCode: string }>;
}

export default async function PublicSpecimenPage({ params }: Props) {
  const { rfCode } = await params;
  const specimen = await getSpecimen(rfCode);
  if (specimen) {
    redirect(`/collection/${specimen.id}`);
  }
  redirect('/explore');
}
