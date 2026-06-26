import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ handle: string }>;
}

export default async function LegacyProfilePage({ params }: Props) {
  const { handle } = await params;
  redirect(`/users/${handle}`);
}
