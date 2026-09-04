import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Badge, Button } from '@mantine/core';
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
import { stageLabel, effectiveGeneration, statusLabel } from '@/lib/coralStage';
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
  // getSpecimen inner-joins the owner, so an unclaimed frag never resolves here.
  // Unclaimed codes are served by the public /coral/[rfCode] page instead.
  if (!specimen || !specimen.ownerId) notFound();

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

  const approvedPhotos = specimen.photos.filter(p => p.status === 'approved' || isOwner);

  return (
    <div>
      {/* ── Title ───────────────────────────────────────────── */}
      <div className={styles.titleBlock}>
        <div className={styles.titleBadges}>
          {specimen.category && <CategoryBadge category={specimen.category} />}
          {specimen.origin && (
            <Badge variant="light" size="sm" radius="xl">{specimen.origin}</Badge>
          )}
          {specimen.rfCode && (
            <Badge variant="default" size="sm" radius="xl"
              style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}
            >
              {specimen.rfCode}
            </Badge>
          )}
        </div>
        <h1 className={styles.titleName}>{specimen.name}</h1>
        {specimen.species && <p className={styles.titleSpecies}>{specimen.species}</p>}
      </div>

      {/* ── Actions — above the photo ────────────────────────── */}
      <div className={styles.actionBar}>
        {isOwner && <MetaStripActions specimen={specimen} isOwner={isOwner} />}
        {isOwner && <HeroActions specimen={specimen} isOwner={isOwner} />}
        {!isOwner && specimen.rfCode && (
          <Button
            component="a"
            href={`/claim?code=${specimen.rfCode}`}
            size="sm"
            variant="filled"
            color="ocean"
          >
            Claim this lineage
          </Button>
        )}
        <Button component="a" href="#discuss" variant="default" size="sm">
          Ask about it
        </Button>
        {specimen.rfCode && <RfCodeQr rfCode={specimen.rfCode} variant="button" />}
      </div>

      {/* ── Showcase: square photo beside the spec panel ─────── */}
      <div className={styles.showcase}>
        <div>
          <div className={styles.showcasePhoto}>
            {coverPhoto ? (
              <HeroPhoto photo={coverPhoto} specimenName={specimen.name} isOwner={isOwner} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: coralIdentityGradient(specimen.rfCode ?? specimen.id) }} />
            )}
          </div>
          {approvedPhotos.length > 1 && (
            <div className={styles.showcaseThumbs}>
              {approvedPhotos.map(photo => (
                <div key={photo.id} className={styles.showcaseThumb}>
                  <Image src={photo.url} alt={specimen.name} fill style={{ objectFit: 'cover' }} sizes="64px" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.specPanel}>
          <div className={styles.recordRow}>
            <span className={styles.recordLabel}>Keeper</span>
            <Link href={`/users/${specimen.ownerUsername}`} className={styles.recordValue} style={{ color: 'var(--mantine-primary-color-filled)', textDecoration: 'none' }}>
              @{specimen.ownerUsername}
            </Link>
          </div>
          {statusLabel(specimen.status) && (
            <div className={styles.recordRow}>
              <span className={styles.recordLabel}>Status</span>
              <span className={styles.recordValue}>
                {statusLabel(specimen.status)}
                {specimen.statusAt && ` · ${new Date(specimen.statusAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                {specimen.statusNote && ` — ${specimen.statusNote}`}
              </span>
            </div>
          )}
          {specimen.stage && (
            <div className={styles.recordRow}>
              <span className={styles.recordLabel}>Stage</span>
              <span className={styles.recordValue}>{stageLabel(specimen.stage)}</span>
            </div>
          )}
          {specimen.acquiredStage && specimen.acquiredStage !== specimen.stage && (
            <div className={styles.recordRow}>
              <span className={styles.recordLabel}>Acquired as</span>
              <span className={styles.recordValue}>{stageLabel(specimen.acquiredStage)}</span>
            </div>
          )}
          {specimen.sourceColony && (
            <div className={styles.recordRow}>
              <span className={styles.recordLabel}>Cut from</span>
              <span className={styles.recordValue}>{specimen.sourceColony}</span>
            </div>
          )}
          {specimen.vendor && (
            <div className={styles.recordRow}>
              <span className={styles.recordLabel}>Farm / seller</span>
              <span className={styles.recordValue}>{specimen.vendor}</span>
            </div>
          )}
          {specimen.species && (
            <div className={styles.recordRow}>
              <span className={styles.recordLabel}>Species</span>
              <span className={styles.recordValue} style={{ fontStyle: 'italic' }}>{specimen.species}</span>
            </div>
          )}
          {specimen.origin && (
            <div className={styles.recordRow}>
              <span className={styles.recordLabel}>Source</span>
              <span className={styles.recordValue}>{specimen.origin}</span>
            </div>
          )}
          {specimen.tankName && (
            <div className={styles.recordRow}>
              <span className={styles.recordLabel}>Tank</span>
              <span className={styles.recordValue}>{specimen.tankName}</span>
            </div>
          )}
          {specimen.lightPar && (
            <div className={styles.recordRow}>
              <span className={styles.recordLabel}>Light</span>
              <span className={styles.recordValue}>{specimen.lightPar}</span>
            </div>
          )}
          {specimen.flowLevel && (
            <div className={styles.recordRow}>
              <span className={styles.recordLabel}>Flow</span>
              <span className={styles.recordValue}>{specimen.flowLevel}</span>
            </div>
          )}
          <div className={styles.recordRow}>
            <span className={styles.recordLabel}>Acquired</span>
            <span className={styles.recordValue}>{acquiredLabel}</span>
          </div>
          <div className={styles.recordRow}>
            <span className={styles.recordLabel}>Age in chest</span>
            <span className={styles.recordValue}>{age}</span>
          </div>
          <div className={styles.recordRow}>
            <span className={styles.recordLabel}>Generation</span>
            <span className={styles.recordValue}>
              {effectiveGeneration(
                specimen.generationsBack,
                lineage[0]?.generationFromMother ?? specimen.generationFromMother
              )}
            </span>
          </div>
          <div className={styles.recordRow}>
            <span className={styles.recordLabel}>Frags given</span>
            <span className={styles.recordValue}>{specimen.fragsGiven}</span>
          </div>
          <div className={styles.recordRow}>
            <span className={styles.recordLabel}>Photos logged</span>
            <span className={styles.recordValue}>{specimen.photoCount}</span>
          </div>
          <div className={styles.recordRow}>
            <span className={styles.recordLabel}>Threads</span>
            <span className={styles.recordValue}>{specimen.threadCount}</span>
          </div>
          <div className={styles.recordRow}>
            <span className={styles.recordLabel}>Last updated</span>
            <span className={styles.recordValue}>{updatedLabel}</span>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className={styles.body}>
        <div className={styles.main}>

          {/* Keeper notes */}
          {specimen.notes && (
            <div className={styles.card}>
              <span className={styles.eyebrow}>Keeper Notes</span>
              <p className={styles.bodyText} style={{ margin: 0 }}>{specimen.notes}</p>
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
                <div className={styles.photoRow}>
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
                      <Link key={node.id} href={`/coral/${node.rfCode ?? node.id}`} className={styles.lineageChip}>
                        <div className={styles.lineageDot} style={{ background: identGrad(node.identityHue, node.id) }} />
                        {node.rfCode ?? node.name}
                        {node.parentStageAtCut && (
                          <span className={styles.chipStage}>{stageLabel(node.parentStageAtCut)}</span>
                        )}
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
                      <Link key={f.id} href={`/coral/${f.rfCode ?? f.id}`} className={styles.fragChip}>
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
              <div className={styles.moreRow}>
                {moreByOwner.map(s => (
                  <Link key={s.id} href={`/coral/${s.rfCode ?? s.id}`} className={styles.moreTile}>
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

      </div>
    </div>
  );
}
