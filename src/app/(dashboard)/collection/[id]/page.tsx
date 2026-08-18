import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Badge, Button, Group } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { getSpecimen, getMoreByOwner } from '@/app/actions/specimens';
import { getLineage, getChildren } from '@/app/actions/lineage';
import { CategoryBadge } from '@/components/specimen/CategoryBadge';
import { DiscussionSection } from '@/components/discussion/DiscussionSection';
import { coralIdentityGradient } from '@/theme/theme';
import {
  MetaStripActions,
  HeroActions,
  HeroPhoto,
  AddPhotoButton,
} from './SpecimenDetailClient';
import { RfCodeQr } from '@/components/specimen/RfCodeQr';
import styles from './specimen.module.css';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const specimen = await getSpecimen(id);
  if (!specimen) return { title: 'Not found — Coral Chest' };
  return {
    title: `${specimen.name} — Coral Chest`,
    description: specimen.notes ?? `A ${specimen.category ?? 'coral'} specimen by @${specimen.ownerUsername}`,
  };
}

function identGrad(hue: number | null, seed: string) {
  if (hue != null) return `linear-gradient(135deg, oklch(0.72 0.13 ${hue}), oklch(0.5 0.15 ${hue}))`;
  return coralIdentityGradient(seed);
}

function ownerInitials(displayName: string | null, username: string) {
  const src = displayName ?? username;
  return src.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

function ageLabel(acquiredDate: string | null, createdAt: string) {
  const ms = Date.now() - new Date(acquiredDate ?? createdAt).getTime();
  const weeks = Math.round(ms / 604800000);
  if (weeks < 1) return 'Just added';
  if (weeks < 8) return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  const months = Math.round(weeks / 4.33);
  return `${months} month${months !== 1 ? 's' : ''}`;
}

function photoAge(first: string, last: string) {
  const weeks = Math.round((new Date(last).getTime() - new Date(first).getTime()) / 604800000);
  if (weeks < 1) return 'this week';
  if (weeks < 8) return `${weeks} weeks`;
  const months = Math.round(weeks / 4.33);
  return `${months} months`;
}

function photoDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default async function SpecimenDetailPage({ params }: Props) {
  const { id } = await params;
  const specimen = await getSpecimen(id);
  if (!specimen) notFound();

  const isOwner = specimen.isOwner;
  const coverPhoto = specimen.photos[0] ?? null;

  const [lineage, frags, moreByOwner] = await Promise.all([
    getLineage(specimen.id),
    getChildren(specimen.id),
    getMoreByOwner(specimen.ownerId, specimen.id, 4),
  ]);

  const acquiredLabel = new Date(specimen.acquiredDate ?? specimen.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const updatedLabel = new Date(specimen.updatedAt ?? specimen.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const age = ageLabel(specimen.acquiredDate, specimen.createdAt);

  const facts = [
    specimen.category ? { label: 'Category', value: specimen.category } : null,
    specimen.species   ? { label: 'Species',  value: specimen.species, italic: true } : null,
    specimen.origin    ? { label: 'Origin',   value: specimen.origin } : null,
    specimen.lightPar  ? { label: 'Light',    value: specimen.lightPar } : null,
    specimen.flowLevel ? { label: 'Flow',     value: specimen.flowLevel } : null,
    specimen.photoCount > 0 ? { label: 'Growth', value: `${specimen.photoCount}`, note: 'photos logged' } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; italic?: boolean; note?: string }>;

  const approvedPhotos = specimen.photos.filter(p => p.status === 'approved' || isOwner);

  return (
    <div>
      {/* ── Hero ────────────────────────────────────────────── */}
      <div className={styles.heroWrap}>
        {coverPhoto ? (
          <HeroPhoto photo={coverPhoto} specimenName={specimen.name} isOwner={isOwner} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: coralIdentityGradient(specimen.rfCode ?? specimen.id) }} />
        )}
        <div className={styles.heroGradient} />
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <div className={styles.heroBadges}>
              {specimen.category && <CategoryBadge category={specimen.category} />}
              {specimen.origin && (
                <Badge variant="filled" size="sm" radius="xl"
                  style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', color: '#fff', border: 'none' }}
                >
                  {specimen.origin}
                </Badge>
              )}
              {specimen.rfCode && (
                <Badge variant="filled" size="sm" radius="xl"
                  style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)', color: 'rgba(255,255,255,0.85)', border: 'none', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}
                >
                  {specimen.rfCode}
                </Badge>
              )}
            </div>
            <h1 className={styles.heroName}>{specimen.name}</h1>
            {specimen.species && <p className={styles.heroSpecies}>{specimen.species}</p>}
          </div>

          <div className={styles.heroRight}>
            <Link
              href={`/users/${specimen.ownerUsername}`}
              className={styles.ownerChip}
            >
              <div
                className={styles.ownerAvatar}
                style={{ background: identGrad(specimen.identityHue, specimen.ownerId), display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                  {ownerInitials(specimen.ownerDisplayName, specimen.ownerUsername)}
                </span>
              </div>
              <div>
                <div className={styles.ownerName}>{specimen.ownerDisplayName ?? `@${specimen.ownerUsername}`}</div>
                <div className={styles.ownerSub}>@{specimen.ownerUsername}</div>
              </div>
            </Link>
            <div style={{ pointerEvents: 'auto' }}>
              <HeroActions specimen={specimen} isOwner={isOwner} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className={styles.body}>
        {/* ── Left main ───────────────────────────────────────── */}
        <div className={styles.main}>

          {/* Keeper notes */}
          {specimen.notes && (
            <div className={styles.card}>
              <span className={styles.eyebrow}>Keeper Notes</span>
              <p className={styles.bodyText} style={{ margin: 0 }}>{specimen.notes}</p>
            </div>
          )}

          {/* Coral facts grid */}
          {facts.length > 0 && (
            <div className={styles.card} style={{ padding: 0 }}>
              <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                <span className={styles.eyebrowInline}>Coral Facts</span>
              </div>
              <div className={styles.factGrid}>
                {facts.map(f => (
                  <div key={f.label} className={styles.factTile}>
                    <span className={styles.factLabel}>{f.label}</span>
                    <span className={styles.factValue} style={f.italic ? { fontStyle: 'italic' } : undefined}>
                      {f.value}
                    </span>
                    {f.note && <span className={styles.factNote}>{f.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Owner action bar */}
          {isOwner && (
            <div className={styles.ownerBar}>
              <MetaStripActions specimen={specimen} isOwner={isOwner} />
            </div>
          )}

          {/* Growth photos */}
          {(isOwner || approvedPhotos.length > 0) && (
            <div className={styles.card}>
              <div className={styles.photoSectionHead} style={{ marginBottom: 12 }}>
                <span className={styles.eyebrowInline}>
                  Growth
                  {approvedPhotos.length > 0 && (
                    <> · {approvedPhotos.length} photo{approvedPhotos.length !== 1 ? 's' : ''}
                    {approvedPhotos.length > 1 && (
                      <> over {photoAge(approvedPhotos[0].createdAt, approvedPhotos[approvedPhotos.length - 1].createdAt)}</>
                    )}</>
                  )}
                </span>
                {isOwner && <AddPhotoButton specimenId={specimen.id} />}
              </div>
              {approvedPhotos.length > 0 ? (
                <div className={styles.photoGrid}>
                  {approvedPhotos.map(photo => (
                    <div key={photo.id} className={styles.photoTile}>
                      <Image src={photo.url} alt={specimen.name} fill style={{ objectFit: 'cover' }} />
                      <span className={styles.photoDate}>{photoDateLabel(photo.createdAt)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: '#8a929c' }}>No photos yet. Add your first growth shot.</p>
              )}
            </div>
          )}

          {/* Lineage */}
          {(lineage.length > 0 || frags.length > 0) && (
            <div className={styles.card}>
              <span className={styles.eyebrow}>Lineage</span>
              {(lineage.length > 0 || frags.length > 0) && (
                <p className={styles.lineageSub}>
                  {specimen.generationsBack > 0 && `${specimen.generationsBack} generation${specimen.generationsBack !== 1 ? 's' : ''} back`}
                  {specimen.generationsBack > 0 && specimen.fragsGiven > 0 && ' · '}
                  {specimen.fragsGiven > 0 && `${specimen.fragsGiven} frag${specimen.fragsGiven !== 1 ? 's' : ''} given`}
                </p>
              )}

              {lineage.length > 0 && (
                <div className={styles.lineageChain}>
                  {lineage.map((node, i) => (
                    <>
                      <Link key={node.id} href={`/collection/${node.rfCode ?? node.id}`} className={styles.lineageChip}>
                        <div className={styles.lineageDot} style={{ background: identGrad(node.identityHue, node.id) }} />
                        {node.rfCode ?? node.name}
                      </Link>
                      {i < lineage.length - 1 && <IconArrowRight key={`arrow-${i}`} size={12} color="#8a929c" />}
                    </>
                  ))}
                  <IconArrowRight size={12} color="#8a929c" />
                  <div className={`${styles.lineageChip} ${styles.lineageChipCur}`}>
                    <div className={styles.lineageDot} style={{ background: identGrad(specimen.identityHue, specimen.id) }} />
                    {specimen.rfCode ?? specimen.name}
                  </div>
                </div>
              )}

              {frags.length > 0 && (
                <>
                  <p style={{ fontSize: 11, color: '#8a929c', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                    Frags Given Out · {frags.length}
                  </p>
                  <div className={styles.fragRow}>
                    {frags.map(f => (
                      <Link key={f.id} href={`/collection/${f.rfCode ?? f.id}`} className={styles.fragChip}>
                        <div className={styles.lineageDot} style={{ background: identGrad(f.identityHue, f.id), width: 8, height: 8 }} />
                        {f.rfCode ?? f.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* More from owner */}
          {moreByOwner.length > 0 && (
            <div className={styles.card}>
              <span className={styles.eyebrow}>More from @{specimen.ownerUsername}</span>
              <div className={styles.moreGrid}>
                {moreByOwner.map(s => (
                  <Link key={s.id} href={`/collection/${s.rfCode ?? s.id}`} className={styles.moreTile}>
                    <div className={styles.moreTileThumb}>
                      {s.coverPhotoUrl ? (
                        <Image src={s.coverPhotoUrl} alt={s.name} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, background: identGrad(s.identityHue, s.id) }} />
                      )}
                    </div>
                    <span className={styles.moreTileName}>{s.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Discussions */}
          <div className={styles.card} id="discuss">
            <DiscussionSection
              specimenId={specimen.id}
              specimenRfCode={specimen.rfCode}
              specimenName={specimen.name}
              specimenIdentityHue={specimen.identityHue}
            />
          </div>
        </div>

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <div className={styles.sidebar}>

          {/* Identity card */}
          {specimen.rfCode && (
            <div className={styles.identCard}>
              <div className={styles.identChecker} />
              <div className={styles.identBody}>
                <div className={styles.identCode}>{specimen.rfCode}</div>
                <div className={styles.identSub}>Scan or share to open this specimen</div>
                <RfCodeQr rfCode={specimen.rfCode} />
              </div>
            </div>
          )}

          {/* Record */}
          <div className={styles.card}>
            <span className={styles.eyebrow}>Record</span>
            <div>
              <div className={styles.recordRow}>
                <span className={styles.recordLabel}>Acquired</span>
                <span className={styles.recordValue}>{acquiredLabel}</span>
              </div>
              <div className={styles.recordRow}>
                <span className={styles.recordLabel}>Age in chest</span>
                <span className={styles.recordValue}>{age}</span>
              </div>
              {specimen.tankName && (
                <div className={styles.recordRow}>
                  <span className={styles.recordLabel}>Tank</span>
                  <span className={styles.recordValue}>{specimen.tankName}</span>
                </div>
              )}
              {specimen.origin && (
                <div className={styles.recordRow}>
                  <span className={styles.recordLabel}>Source</span>
                  <span className={styles.recordValue}>{specimen.origin}</span>
                </div>
              )}
              <div className={styles.recordRow}>
                <span className={styles.recordLabel}>Keeper</span>
                <span className={styles.recordValue}>@{specimen.ownerUsername}</span>
              </div>
              <div className={styles.recordRow}>
                <span className={styles.recordLabel}>Last updated</span>
                <span className={styles.recordValue}>{updatedLabel}</span>
              </div>
            </div>
          </div>

          {/* Track record */}
          <div className={styles.card} style={{ padding: 0 }}>
            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
              <span className={styles.eyebrowInline}>Track Record</span>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statCell}>
                <span className={styles.statNum}>{specimen.fragsGiven}</span>
                <span className={styles.statLabel}>Frags given</span>
              </div>
              <div className={styles.statCell}>
                <span className={styles.statNum}>{specimen.generationsBack}</span>
                <span className={styles.statLabel}>Generations back</span>
              </div>
              <div className={styles.statCell}>
                <span className={styles.statNum}>{specimen.photoCount}</span>
                <span className={styles.statLabel}>Photos logged</span>
              </div>
              <div className={styles.statCell}>
                <span className={styles.statNum}>{specimen.threadCount}</span>
                <span className={styles.statLabel}>Threads</span>
              </div>
            </div>
          </div>

          {/* Claim card */}
          {!isOwner && specimen.rfCode && (
            <div className={styles.claimCard}>
              <div className={styles.claimTitle}>Holding a frag?</div>
              <div className={styles.claimSub}>
                Claim it with the RF code from your trader and add it to your collection.
              </div>
              <Button
                component="a"
                href={`/claim?code=${specimen.rfCode}`}
                size="sm"
                fullWidth
                variant="filled"
                color="ocean"
              >
                Claim this lineage
              </Button>
            </div>
          )}

          {/* Ask about it */}
          <Group gap={8}>
            <Button
              component="a"
              href="#discuss"
              variant="default"
              size="sm"
              style={{ flex: 1 }}
            >
              Ask about it
            </Button>
            {specimen.rfCode && <RfCodeQr rfCode={specimen.rfCode} variant="button" />}
          </Group>
        </div>
      </div>
    </div>
  );
}
