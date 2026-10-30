import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicSpecimen } from '@/app/actions/specimens';
import { getLineage } from '@/app/actions/lineage';
import { getProvenance, getFamily } from '@/lib/provenance';
import { stageLabel } from '@/lib/coralStage';
import { CertificateActions, WelcomeBanner } from './CertificateClient';
import styles from './certificate.module.css';

export const revalidate = false;

export async function generateStaticParams() {
  return [];
}

interface Props {
  params: Promise<{ rfCode: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rfCode } = await params;
  const specimen = await getPublicSpecimen(rfCode);
  return {
    title: specimen ? `Certificate — ${specimen.name} ${specimen.rfCode ?? ''}`.trim() : 'Not found',
    robots: { index: false },
  };
}

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export default async function CertificatePage({ params }: Props) {
  const { rfCode } = await params;
  const specimen = await getPublicSpecimen(rfCode);
  if (!specimen || !specimen.ownerId) notFound();

  const [ancestors, provenance, family] = await Promise.all([
    getLineage(specimen.id),
    getProvenance(specimen),
    getFamily(specimen.id),
  ]);

  const root = family?.root;
  const verified = !!root?.ownerVerified;
  const owners = provenance.filter((e) => e.username && e.kind !== 'note' && e.kind !== 'sold' && e.kind !== 'gifted');
  const current = [...owners].reverse().find((e) => e.username === specimen.ownerUsername);
  const issued = current?.date ?? specimen.createdAt;
  const mother = ancestors[0] ?? null;

  return (
    <div className={styles.page}>
      <Suspense>
        <WelcomeBanner name={specimen.name} />
      </Suspense>

      <article className={styles.cert}>
        <header className={styles.header}>
          <span className={styles.brand}>Coral Chest</span>
          <span className={styles.kind}>Certificate of lineage</span>
        </header>

        <h1 className={styles.name}>{specimen.name}</h1>
        {specimen.species && <p className={styles.species}>{specimen.species}</p>}
        <p className={styles.rf}>{specimen.rfCode}</p>

        <p className={verified ? styles.trustVerified : styles.trust}>
          {verified
            ? `Origin verified · ${root?.ownerUsername ? `@${root.ownerUsername}` : 'verified farm'}`
            : `Origin self-reported${root?.ownerUsername ? ` by @${root.ownerUsername}` : ''}`}
        </p>

        <dl className={styles.facts}>
          <div>
            <dt>Mother colony</dt>
            <dd>{mother ? `${mother.name}${mother.rfCode ? ` · ${mother.rfCode}` : ''}` : specimen.sourceColony ?? 'This is the mother colony'}</dd>
          </div>
          <div>
            <dt>Generation</dt>
            <dd>{ancestors.length === 0 ? 'Original (gen 0)' : `Gen ${ancestors.length}`}</dd>
          </div>
          {specimen.stage && (
            <div>
              <dt>Stage</dt>
              <dd>{stageLabel(specimen.stage)}</dd>
            </div>
          )}
          {specimen.vendor && (
            <div>
              <dt>Farm / seller</dt>
              <dd>{specimen.vendor}</dd>
            </div>
          )}
          <div>
            <dt>Keeper</dt>
            <dd>@{specimen.ownerUsername}</dd>
          </div>
          <div>
            <dt>Held since</dt>
            <dd>{dateLabel(issued)}</dd>
          </div>
        </dl>

        {(ancestors.length > 0 || owners.length > 1) && (
          <section>
            <h2 className={styles.section}>Chain of custody</h2>
            <ol className={styles.chain}>
              {ancestors.map((a) => (
                <li key={a.id}>
                  {a.name}{a.rfCode ? ` · ${a.rfCode}` : ''}{a.ownerUsername ? ` — @${a.ownerUsername}` : ''}
                </li>
              ))}
              {owners.map((e, i) => (
                <li key={i}>
                  {specimen.name} — @{e.username} <span className={styles.when}>{dateLabel(e.date)}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <footer className={styles.footer}>
          Verify at coralchest.com/coral/{specimen.rfCode}
        </footer>
      </article>

      <CertificateActions rfCode={specimen.rfCode ?? specimen.id} />
    </div>
  );
}
