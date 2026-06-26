import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { Box, Group, Stack, Text, Paper, Badge } from '@mantine/core';
import { IconChevronLeft, IconHeart, IconMessageCircle, IconEye } from '@tabler/icons-react';
import { getThread } from '@/app/actions/discussions';
import { getSpecimen } from '@/app/actions/specimens';
import { auth } from '@/lib/auth';
import { coralIdentityGradient } from '@/theme/theme';
import { TypeBadge, ResolvedBadge } from '@/components/discussion/TypeBadge';
import { AnchorCard } from '@/components/discussion/AnchorCard';
import { ReplyItem } from '@/components/discussion/ReplyItem';
import { ReplyComposer } from '@/components/discussion/ReplyComposer';

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

interface Props {
  params: Promise<{ id: string; threadId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { threadId } = await params;
  const thread = await getThread(threadId);
  if (!thread) return { title: 'Not found — Polyp' };
  return { title: `${thread.title} — Polyp` };
}

export default async function ThreadDetailPage({ params }: Props) {
  const { id, threadId } = await params;
  const [thread, specimen, session] = await Promise.all([
    getThread(threadId),
    getSpecimen(id),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (!thread || !specimen) notFound();

  const currentUserId = session?.user?.id ?? null;
  const isThreadAuthor = currentUserId === thread.authorId;
  const backHref = `/collection/${id}`;
  const authorName = thread.authorDisplayName ?? thread.authorUsername;

  const uniqueParticipants = [
    { id: thread.authorId, username: thread.authorUsername, displayName: thread.authorDisplayName },
    ...thread.replies
      .filter((r, i, a) => a.findIndex(x => x.authorId === r.authorId) === i)
      .map(r => ({ id: r.authorId, username: r.authorUsername, displayName: r.authorDisplayName })),
  ].slice(0, 8);

  return (
    <Box maw={1080} pb="xl">
      {/* Breadcrumb */}
      <Group gap={4} mb="md" style={{ fontSize: 13, color: 'var(--mantine-color-dimmed)' }}>
        <Link href="/discuss" style={{ textDecoration: 'none', color: 'inherit' }}>Discussions</Link>
        <span>/</span>
        <Link href={backHref} style={{ textDecoration: 'none', color: 'inherit' }}>{specimen.name}</Link>
        <span>/</span>
        <span style={{ color: 'var(--mantine-color-text)', fontWeight: 500 }}>Thread</span>
      </Group>

      <Box style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>

        {/* ── Main column ── */}
        <Stack gap="md">

          {/* Anchor card */}
          <AnchorCard
            anchorType="specimen"
            name={specimen.name}
            code={specimen.rfCode}
            identityHue={specimen.identityHue}
            sub={`@${specimen.ownerUsername}`}
            href={backHref}
          />

          {/* Original post */}
          <Paper withBorder p="lg">
            {/* Badges row */}
            <Group gap={8} mb={12} wrap="wrap">
              {thread.resolved ? <ResolvedBadge /> : <TypeBadge type={thread.type} />}
              {thread.resolved && (
                <Badge size="xs" variant="light" color="gray">was {thread.type}</Badge>
              )}
            </Group>

            {/* Title */}
            <Text
              component="h1"
              style={{ fontSize: 21, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: '0 0 12px' }}
            >
              {thread.title}
            </Text>

            {/* Author row */}
            <Group gap={8} mb={thread.body ? 14 : 0} wrap="nowrap" align="center">
              <Box style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: coralIdentityGradient(thread.authorUsername + '_av'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 11, fontWeight: 700,
              }}>
                {authorName[0].toUpperCase()}
              </Box>
              <Box style={{ flex: 1 }}>
                <Text size="sm" fw={600}>{authorName}</Text>
              </Box>
              <Text size="xs" c="dimmed">· posted {timeAgo(thread.createdAt)}</Text>
            </Group>

            {/* Body */}
            {thread.body && (
              <Text size="sm" style={{ lineHeight: 1.65, color: 'var(--mantine-color-gray-8)', marginTop: 12 }}>
                {thread.body}
              </Text>
            )}

            {/* Stats row */}
            <Group gap={16} mt={14} style={{ fontSize: 12, fontWeight: 600, color: 'var(--mantine-color-dimmed)' }}>
              <Group gap={5}>
                <IconHeart size={14} />
                <span>0</span>
              </Group>
              <Group gap={5}>
                <IconMessageCircle size={14} />
                <span>{thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}</span>
              </Group>
              <Group gap={5}>
                <IconEye size={14} />
                <span>Watching</span>
              </Group>
            </Group>
          </Paper>

          {/* Replies */}
          <Paper withBorder p="md">
            {thread.replies.length > 0 && (
              <Text style={{ ...EYEBROW, display: 'block', marginBottom: 2 }}>
                {thread.replies.length} {thread.replies.length === 1 ? 'reply' : 'replies'}
              </Text>
            )}

            {thread.replies.length === 0 && (
              <Text size="sm" c="dimmed" mb="md">No replies yet — be the first.</Text>
            )}

            {thread.replies.map((r) => (
              <ReplyItem
                key={r.id}
                reply={r}
                threadId={thread.id}
                specimenId={id}
                isAuthor={isThreadAuthor}
                threadResolved={thread.resolved}
              />
            ))}

            {currentUserId && (
              <ReplyComposer
                threadId={thread.id}
                specimenId={id}
                authorUsername={session?.user?.name ?? ''}
              />
            )}

            {!currentUserId && (
              <Box mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
                <Text size="sm" c="dimmed">
                  <Link href="/sign-in" style={{ color: 'var(--mantine-primary-color-filled)' }}>Sign in</Link>
                  {' '}to reply.
                </Text>
              </Box>
            )}
          </Paper>
        </Stack>

        {/* ── Right rail ── */}
        <Stack gap="md">

          {/* Watching */}
          <Paper withBorder p="md">
            <button style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 7, height: 36,
              border: '1px solid var(--mantine-color-default-border)',
              borderRadius: 'var(--mantine-radius-md)',
              background: 'var(--mantine-color-body)',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <IconEye size={15} /> Watching
            </button>
            <Text size="xs" c="dimmed" ta="center" mt={8}>
              You'll get notified of new replies.
            </Text>
          </Paper>

          {/* Participants */}
          {uniqueParticipants.length > 0 && (
            <Paper withBorder p="md">
              <Text style={{ ...EYEBROW, display: 'block', marginBottom: 10 }}>
                participants · {uniqueParticipants.length}
              </Text>
              <Group gap={6} wrap="wrap">
                {uniqueParticipants.map((p) => (
                  <Box
                    key={p.id}
                    title={p.displayName ?? p.username}
                    style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: coralIdentityGradient(p.username + '_av'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'default',
                    }}
                  >
                    {(p.displayName ?? p.username)[0].toUpperCase()}
                  </Box>
                ))}
              </Group>
            </Paper>
          )}

          {/* About this thread */}
          <Paper withBorder p="md">
            <Text size="sm" fw={600} mb={10}>About this thread</Text>
            <Stack gap={6}>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Type</Text>
                <TypeBadge type={thread.type} />
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Status</Text>
                <Text size="xs" fw={600}>{thread.resolved ? 'Resolved' : 'Open'}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Started</Text>
                <Text size="xs">
                  {new Date(thread.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </Text>
              </Group>
            </Stack>
          </Paper>

          {/* Back to coral */}
          <Link href={backHref} style={{ textDecoration: 'none' }}>
            <Group gap={4} style={{ fontSize: 13, color: 'var(--mantine-color-dimmed)' }}>
              <IconChevronLeft size={14} />
              <span>Back to {specimen.name}</span>
            </Group>
          </Link>
        </Stack>
      </Box>
    </Box>
  );
}
