import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getSpecimenThreads } from '@/app/actions/discussions';
import { DiscussionBoard } from './DiscussionBoard';

interface Props {
  specimenId: string;
  specimenRfCode: string | null;
  specimenName: string;
  specimenIdentityHue?: number | null;
}

export async function DiscussionSection({ specimenId, specimenRfCode, specimenName, specimenIdentityHue }: Props) {
  const [threads, session] = await Promise.all([
    getSpecimenThreads(specimenId),
    auth.api.getSession({ headers: await headers() }),
  ]);

  const user = session?.user ?? null;
  const authorName = user?.name ?? user?.email ?? '';
  const authorInitial = authorName ? authorName[0].toUpperCase() : '?';
  // derive a hue from the username so the avatar color is consistent
  const authorHue = authorName
    ? (authorName.split('').reduce((n, c) => n + c.charCodeAt(0), 0) % 360)
    : 200;

  return (
    <DiscussionBoard
      threads={threads}
      specimenId={specimenId}
      specimenRfCode={specimenRfCode}
      specimenName={specimenName}
      specimenIdentityHue={specimenIdentityHue}
      isLoggedIn={!!user}
      authorInitial={authorInitial}
      authorHue={authorHue}
    />
  );
}
