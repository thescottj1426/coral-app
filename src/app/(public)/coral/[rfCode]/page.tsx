import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Badge, Button, CopyButton } from '@mantine/core';
import { getPublicSpecimen, getMoreByOwner } from '@/app/actions/specimens';
import { getLineage, getChildren } from '@/app/actions/lineage';
import { CategoryBadge } from '@/components/specimen/CategoryBadge';
import { coralIdentityGradient } from '@/theme/theme';
import { CtaBanner } from '@/components/coral/CtaBanner';
import { stageLabel, statusLabel, statusColor } from '@/lib/coralStage';
import { PublicPhotos } from './PublicPhotos';
import { PhotoDropzone, CutFragButton, JoinStrip } from './OwnerControls';
import { siteUrl } from '@/lib/siteUrl';
import type { LineageNode } from '@/app/actions/lineage';
import type { PublicSpecimenStub } from '@/app/actions/specimens';
import styles from './coral.module.css';

// Cached, and deliberately session-free. Owner controls resolve on the client
// (OwnerControls) — reading the session here would make the route dynamic and
// throw away the cache that exists for crawlers.
export const revalidate = 60;

interface Props {
  params: Promise<{ rfCode: string }>;
}

const APP_URL = siteUrl();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rfCode } = await params;
  const specimen = await getPublicSpecimen(rfCode);
  if (!specimen) return { title: 'Not found' };

  const unclaimed = specimen.ownerId === null;

  // Three different queries land here: the coral's name, its species, and its
  // RF code. The title carries all three so any of them can match.
  const titleParts = [specimen.name];
  if (specimen.species) titleParts.push(specimen.species);
  if (specimen.rfCode) titleParts.push(specimen.rfCode);
  const title = unclaimed
    ? `${specimen.name} — unclaimed frag ${specimen.rfCode ?? ''}`.trim()
    : titleParts.join(' — ');

  // Generated rather than relying on notes, so a coral with none still gets a
  // snippet that says something.
  const facts = [
    stageLabel(specimen.stage),
    specimen.category,
    specimen.species,
    specimen.origin,
    specimen.vendor ? `from ${specimen.vendor}` : null,
    specimen.ownerUsername ? `kept by @${specimen.ownerUsername}` : 'unclaimed frag',
    specimen.rfCode ? `RF code ${specimen.rfCode}` : null,
  ].filter(Boolean);
  const description = (specimen.notes?.trim() || `${specimen.name}: ${facts.join(' · ')}.`).slice(0, 300);

  const ogImage = specimen.photos[0] ? `${APP_URL}${specimen.photos[0].url}` : undefined;
  const canonical = `${APP_URL}/coral/${specimen.rfCode ?? specimen.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: specimen.name }] : [],
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function PublicCoralPage({ params }: Props) {
  const { rfCode } = await params;
  const specimen = await getPublicSpecimen(rfCode);
  if (!specimen) notFound();

  // Unclaimed frag — a createFrags row that stays ownerless until someone
  // claims the RF code. This is the page a frag tag's QR resolves to, so it may
  // be the first thing a new keeper ever sees.
  const unclaimed = specimen.ownerId === null;

  const [ancestors, children, more] = await Promise.all([
    getLineage(specimen.id),
    getChildren(specimen.id),
    specimen.ownerId ? getMoreByOwner(specimen.ownerId, specimen.id, 4) : Promise.resolve([]),
  ]);

  // The frag itself has no owner; whoever owns its nearest ancestor cut it.
  const fraggedBy = ancestors[ancestors.length - 1]?.ownerUsername ?? null;
  const keeperHandle = specimen.ownerUsername;

  // Structured data: tells Google the RF code is an identifier and exposes
  // stage/lineage as properties, making the page eligible for rich results.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: specimen.name,
    ...(specimen.species ? { alternateName: specimen.species } : {}),
    description:
      specimen.notes?.trim() ||
      `${specimen.name}${specimen.species ? ` (${specimen.species})` : ''} — ${stageLabel(specimen.stage) ?? 'coral'} tracked on Coral Chest.`,
    ...(specimen.rfCode ? { sku: specimen.rfCode, productID: specimen.rfCode } : {}),
    ...(specimen.photos[0] ? { image: `${APP_URL}${specimen.photos[0].url}` } : {}),
    ...(specimen.category ? { category: specimen.category } : {}),
    ...(specimen.vendor ? { brand: { '@type': 'Brand', name: specimen.vendor } } : {}),
    url: `${APP_URL}/coral/${specimen.rfCode ?? specimen.id}`,
    additionalProperty: [
      specimen.stage && { '@type': 'PropertyValue', name: 'Propagation stage', value: stageLabel(specimen.stage) },
      specimen.sourceColony && { '@type': 'PropertyValue', name: 'Source colony', value: specimen.sourceColony },
      specimen.origin && { '@type': 'PropertyValue', name: 'Origin', value: specimen.origin },
      specimen.ownerUsername && { '@type': 'PropertyValue', name: 'Keeper', value: `@${specimen.ownerUsername}` },
    ].filter(Boolean),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Coral Chest', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'Explore', item: `${APP_URL}/explore` },
      { '@type': 'ListItem', position: 3, name: specimen.name },
    ],
  };

  // Oldest ancestor first, then this coral. The chain reads top-down as
  // generations, which is how keepers describe provenance out loud.
  const chain = [
    ...ancestors.map((a: LineageNode, i: number) => ({
      key: a.id,
      gen: i + 1,
      name: a.name,
      handle: a.ownerUsername,
      href: a.rfCode ? `/coral/${a.rfCode}` : null,
      meta: [a.rfCode, stageLabel(a.parentStageAtCut)].filter(Boolean).join(' · ') || null,
      current: false,
    })),
    {
      key: specimen.id,
      gen: ancestors.length + 1,
      name: specimen.name,
      handle: keeperHandle,
      href: null,
      meta: [specimen.rfCode, stageLabel(specimen.stage)].filter(Boolean).join(' · ') || null,
      current: true,
    },
  ];

  return (
    <div className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <JoinStrip />

      <div className={styles.shell}>
        <div className={styles.photoBand}>
          {specimen.photos.length > 0 ? (
            <PublicPhotos photos={specimen.photos} specimenName={specimen.name} mode="overlay" />
          ) : (
            <PhotoDropzone
              coralId={specimen.id}
              ownerUsername={keeperHandle}
              label={`Drop the ${specimen.name} photo or browse files`}
              fallback={
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: coralIdentityGradient(specimen.rfCode ?? specimen.id),
                    opacity: 0.55,
                  }}
                />
              }
            />
          )}
        </div>

        <div className={styles.columns}>
          <div>
            <div className={styles.card}>
              <div className={styles.badges}>
                {specimen.category && <CategoryBadge category={specimen.category} />}
                {specimen.origin && <Badge variant="default" size="sm" radius="sm">{specimen.origin}</Badge>}
                {statusLabel(specimen.status) && (
                  <Badge color={statusColor(specimen.status)} variant="light" size="sm" radius="sm">
                    {statusLabel(specimen.status)}
                  </Badge>
                )}
              </div>
              <h1 className={styles.name}>{specimen.name}</h1>
              {specimen.species && <p className={styles.species}>{specimen.species}</p>}
            </div>

            {specimen.rfCode && (
              <div className={styles.card}>
                <p className={styles.eyebrow}>RF code · written on the plug</p>
                <div className={styles.rfRow}>
                  <p className={styles.rfCode}>{specimen.rfCode}</p>
                  <CopyButton value={specimen.rfCode} timeout={2000}>
                    {({ copied, copy }) => (
                      <Button variant="default" size="xs" onClick={copy}>
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    )}
                  </CopyButton>
                </div>
              </div>
            )}

            <div className={styles.card}>
              <p className={styles.eyebrow}>Provenance</p>

              {chain.map((row) => {
                const inner = (
                  <>
                    <span className={`${styles.genLabel} ${row.current ? styles.genLabelCurrent : ''}`}>
                      Gen {row.gen}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span className={styles.genName}>{row.name}</span>
                      <span className={styles.genMeta} style={{ display: 'block' }}>
                        {row.handle ? `@${row.handle}` : 'Unclaimed'}
                        {row.meta ? ` · ${row.meta}` : ''}
                      </span>
                    </span>
                    <span className={styles.genAction}>{row.current ? 'This coral' : 'Open →'}</span>
                  </>
                );

                return row.href ? (
                  <Link
                    key={row.key}
                    href={row.href}
                    className={styles.genRow}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={row.key} className={`${styles.genRow} ${row.current ? styles.genRowCurrent : ''}`}>
                    {inner}
                  </div>
                );
              })}

              {children.length > 0 ? (
                <div style={{ marginTop: 16 }}>
                  <p className={styles.eyebrow}>Frags cut from this · {children.length}</p>
                  {children.map((c: LineageNode) => (
                    <Link
                      key={c.id}
                      href={`/coral/${c.rfCode ?? c.id}`}
                      className={styles.genRow}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <span className={styles.genLabel}>Gen {chain.length + 1}</span>
                      <span style={{ minWidth: 0 }}>
                        <span className={styles.genName}>{c.rfCode ?? c.name}</span>
                        <span className={styles.genMeta} style={{ display: 'block' }}>
                          {c.ownerUsername ? `@${c.ownerUsername}` : 'Unclaimed — waiting on its keeper'}
                        </span>
                      </span>
                      <span className={styles.genAction}>Open →</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyBranch}>
                  <span>
                    No frags cut yet. The first cut issues a new RF code and starts the branch
                    below this one.
                  </span>
                  <CutFragButton
                    coralId={specimen.id}
                    rfCode={specimen.rfCode ?? specimen.id}
                    name={specimen.name}
                    stage={specimen.stage}
                    ownerUsername={keeperHandle}
                  />
                </div>
              )}
            </div>

            {specimen.notes && (
              <div className={styles.card}>
                <p className={styles.eyebrow}>Keeper notes</p>
                <p className={styles.notes}>{specimen.notes}</p>
              </div>
            )}

            {unclaimed && (
              <div className={styles.card}>
                <p className={styles.eyebrow}>Unclaimed</p>
                <p className={styles.notes} style={{ marginBottom: 14 }}>
                  {fraggedBy
                    ? `This plug was cut by @${fraggedBy} and has not been claimed yet. If it is in your tank, the code on the plug makes it yours.`
                    : 'This plug has not been claimed yet. If it is in your tank, the code on the plug makes it yours.'}
                </p>
                <Button component="a" href={`/claim?code=${specimen.rfCode ?? ''}`} color="ocean">
                  Claim this coral
                </Button>
                <CtaBanner />
              </div>
            )}
          </div>

          <aside>
            <div className={styles.card}>
              <p className={styles.eyebrow}>Record</p>
              <div className={styles.recordRow}>
                <span className={styles.recordKey}>Keeper</span>
                <span className={styles.recordValue}>
                  {keeperHandle ? (
                    <Link href={`/users/${keeperHandle}`} style={{ color: 'var(--link)' }}>
                      @{keeperHandle}
                    </Link>
                  ) : (
                    'Unclaimed'
                  )}
                </span>
              </div>
              {stageLabel(specimen.stage) && (
                <div className={styles.recordRow}>
                  <span className={styles.recordKey}>Stage</span>
                  <span className={styles.recordValue}>{stageLabel(specimen.stage)}</span>
                </div>
              )}
              <div className={styles.recordRow}>
                <span className={styles.recordKey}>Status</span>
                <span className={styles.recordValue}>{statusLabel(specimen.status) ?? 'Alive'}</span>
              </div>
              {specimen.origin && (
                <div className={styles.recordRow}>
                  <span className={styles.recordKey}>Source</span>
                  <span className={styles.recordValue}>{specimen.origin}</span>
                </div>
              )}
              {specimen.vendor && (
                <div className={styles.recordRow}>
                  <span className={styles.recordKey}>Vendor</span>
                  <span className={styles.recordValue}>{specimen.vendor}</span>
                </div>
              )}
              <div className={styles.recordRow}>
                <span className={styles.recordKey}>Acquired</span>
                <span className={styles.recordValue}>
                  {dateLabel(specimen.acquiredDate ?? specimen.createdAt)}
                </span>
              </div>
              <div className={styles.recordRow}>
                <span className={styles.recordKey}>Updated</span>
                <span className={styles.recordValue}>
                  {dateLabel(specimen.updatedAt ?? specimen.createdAt)}
                </span>
              </div>
            </div>

            <div className={styles.card}>
              <p className={styles.eyebrow}>Photos · {specimen.photos.length}</p>
              {specimen.photos.length > 0 && (
                <div className={styles.photoGrid} style={{ marginBottom: 10 }}>
                  {specimen.photos.map((photo) => (
                    <div key={photo.id} className={styles.photoTile}>
                      <Image src={photo.url} alt={specimen.name} fill sizes="140px" style={{ objectFit: 'cover' }} />
                      {photo.status === 'pending' && <span className={styles.pendingTag}>Pending review</span>}
                    </div>
                  ))}
                </div>
              )}
              <PhotoDropzone
                coralId={specimen.id}
                ownerUsername={keeperHandle}
                label="Drop an image or browse files"
                compact
              />
            </div>

            {more.length > 0 && keeperHandle && (
              <div className={styles.card}>
                <p className={styles.eyebrow}>More from @{keeperHandle}</p>
                {more.map((m: PublicSpecimenStub) => (
                  <Link key={m.id} href={`/coral/${m.rfCode ?? m.id}`} className={styles.relatedRow}>
                    <span className={styles.relatedThumb}>
                      {m.coverPhotoUrl ? (
                        <Image src={m.coverPhotoUrl} alt={m.name} fill sizes="40px" style={{ objectFit: 'cover' }} />
                      ) : (
                        <span
                          aria-hidden
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: coralIdentityGradient(m.rfCode ?? m.id),
                          }}
                        />
                      )}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span className={styles.genName} style={{ display: 'block' }}>{m.name}</span>
                      <span className={styles.genMeta}>{m.rfCode ?? ''}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
