import Link from 'next/link';
import { Container, Title, Text, Stack, Anchor } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy — Coral Chest' };

const SECTION: React.CSSProperties = { marginTop: 8 };

export default function PrivacyPage() {
  return (
    <>
      <div style={{ borderBottom: '1px solid var(--mantine-color-default-border)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/collection" style={{ fontSize: 13, color: 'var(--mantine-color-dimmed)', textDecoration: 'none', fontWeight: 500 }}>
          ← Coral Chest
        </Link>
      </div>
    <Container size="md" py={60}>
      <Stack gap="xl">
        <div>
          <Title order={1} style={{ fontFamily: 'var(--font-sora)', marginBottom: 6 }}>
            Privacy Policy
          </Title>
          <Text c="dimmed" size="sm">Effective date: August 17, 2026</Text>
        </div>

        <Text size="sm" style={{ lineHeight: 1.75 }}>
          Coral Chest ("we," "us," or "our") takes your privacy seriously. This policy
          explains what information we collect, how we use it, and your rights regarding
          your data when you use coralchest.com (the "Service").
        </Text>

        {/* 1 */}
        <div>
          <Title order={3} style={SECTION}>1. Information We Collect</Title>

          <Text size="sm" fw={600} mt={10}>Account information</Text>
          <Text size="sm" mt={4} style={{ lineHeight: 1.75 }}>
            When you sign up we collect your email address, username, and password
            (stored as a secure hash — we never store your raw password). If you sign
            in with Google, we receive your name and email from Google but not your
            Google password.
          </Text>

          <Text size="sm" fw={600} mt={10}>Profile information</Text>
          <Text size="sm" mt={4} style={{ lineHeight: 1.75 }}>
            Information you choose to add to your public profile: display name,
            bio, location, specialty tags, and shop details.
          </Text>

          <Text size="sm" fw={600} mt={10}>Specimen and collection data</Text>
          <Text size="sm" mt={4} style={{ lineHeight: 1.75 }}>
            Coral names, species, categories, origin, keeper notes, RF lineage codes,
            and any other information you enter about your collection.
          </Text>

          <Text size="sm" fw={600} mt={10}>Photos</Text>
          <Text size="sm" mt={4} style={{ lineHeight: 1.75 }}>
            Photos you upload are stored on Amazon Web Services S3. Photos are
            reviewed before being made publicly visible.
          </Text>

          <Text size="sm" fw={600} mt={10}>Usage data</Text>
          <Text size="sm" mt={4} style={{ lineHeight: 1.75 }}>
            We may collect standard server log data including your IP address,
            browser type, pages visited, and timestamps when you use the Service.
            This data helps us diagnose issues and improve the product.
          </Text>
        </div>

        {/* 2 */}
        <div>
          <Title order={3} style={SECTION}>2. How We Use Your Information</Title>
          <ul style={{ fontSize: 14, lineHeight: 1.85, paddingLeft: 24, marginTop: 8 }}>
            <li>To create and manage your account</li>
            <li>To display your collection and public profile to other users</li>
            <li>To send transactional emails (account verification, password resets, welcome messages)</li>
            <li>To enable community features like discussions and lineage tracing</li>
            <li>To moderate user-submitted photos and content</li>
            <li>To detect and prevent fraud, abuse, or violations of our Terms of Service</li>
            <li>To improve and maintain the Service</li>
          </ul>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            We do not sell your personal information to third parties. We do not use
            your data for advertising targeting or behavioral profiling.
          </Text>
        </div>

        {/* 3 */}
        <div>
          <Title order={3} style={SECTION}>3. Third-Party Services</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            We use the following third-party services to operate Coral Chest. Each
            has its own privacy policy governing how they handle data:
          </Text>
          <ul style={{ fontSize: 14, lineHeight: 1.85, paddingLeft: 24, marginTop: 8 }}>
            <li>
              <strong>Neon (database)</strong> — stores your account and collection
              data on PostgreSQL infrastructure.{' '}
              <Anchor href="https://neon.tech/privacy" target="_blank" size="sm">neon.tech/privacy</Anchor>
            </li>
            <li>
              <strong>Amazon Web Services S3</strong> — stores photos you upload.{' '}
              <Anchor href="https://aws.amazon.com/privacy/" target="_blank" size="sm">aws.amazon.com/privacy</Anchor>
            </li>
            <li>
              <strong>Resend</strong> — delivers transactional emails (verification,
              password resets).{' '}
              <Anchor href="https://resend.com/privacy" target="_blank" size="sm">resend.com/privacy</Anchor>
            </li>
            <li>
              <strong>Google OAuth</strong> — optional sign-in via Google. If used,
              Google shares your name and email with us.{' '}
              <Anchor href="https://policies.google.com/privacy" target="_blank" size="sm">policies.google.com/privacy</Anchor>
            </li>
            <li>
              <strong>Vercel</strong> — hosts the application and may log request
              metadata.{' '}
              <Anchor href="https://vercel.com/legal/privacy-policy" target="_blank" size="sm">vercel.com/legal/privacy-policy</Anchor>
            </li>
          </ul>
        </div>

        {/* 4 */}
        <div>
          <Title order={3} style={SECTION}>4. Public vs. Private Data</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            Your collection, profile, and approved photos are <strong>public by default</strong> —
            anyone can view them, including search engines. Keeper notes, RF codes, and
            lineage records are also public and associated with your username.
          </Text>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            Your email address and password are <strong>never</strong> made public.
          </Text>
        </div>

        {/* 5 */}
        <div>
          <Title order={3} style={SECTION}>5. Cookies and Sessions</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            We use cookies to keep you signed in between visits. We do not use
            third-party advertising cookies or tracking pixels. You can disable cookies
            in your browser settings, but doing so will prevent you from staying
            signed in.
          </Text>
        </div>

        {/* 6 */}
        <div>
          <Title order={3} style={SECTION}>6. Data Retention</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            We retain your account data for as long as your account exists. If you
            delete your account, we will delete your personal information within 30 days,
            except where we are required to retain it for legal or operational reasons.
            Photos stored on S3 will also be removed within 30 days of account deletion.
          </Text>
        </div>

        {/* 7 */}
        <div>
          <Title order={3} style={SECTION}>7. Your Rights</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            Depending on where you live, you may have the right to:
          </Text>
          <ul style={{ fontSize: 14, lineHeight: 1.85, paddingLeft: 24, marginTop: 8 }}>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Object to or restrict certain uses of your data</li>
            <li>Export your data in a portable format</li>
          </ul>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            To exercise any of these rights, email{' '}
            <Anchor href="mailto:contact@coralchest.com">contact@coralchest.com</Anchor>.
            We will respond within 30 days.
          </Text>
        </div>

        {/* 8 */}
        <div>
          <Title order={3} style={SECTION}>8. Children's Privacy</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            Coral Chest is not directed to children under 13. We do not knowingly
            collect personal information from children under 13. If you believe we have
            collected such information, contact us immediately and we will delete it.
          </Text>
        </div>

        {/* 9 */}
        <div>
          <Title order={3} style={SECTION}>9. Security</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            We use industry-standard practices to protect your data, including encrypted
            connections (HTTPS), hashed passwords, and access-controlled storage.
            However, no method of transmission or storage is 100% secure. We cannot
            guarantee absolute security.
          </Text>
        </div>

        {/* 10 */}
        <div>
          <Title order={3} style={SECTION}>10. Changes to This Policy</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            We may update this Privacy Policy from time to time. When we make material
            changes, we will update the effective date above and notify registered users
            by email. Continued use of the Service after changes take effect constitutes
            acceptance of the revised policy.
          </Text>
        </div>

        {/* 11 */}
        <div>
          <Title order={3} style={SECTION}>11. Contact</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            Questions or concerns about this Privacy Policy? Contact us at{' '}
            <Anchor href="mailto:contact@coralchest.com">contact@coralchest.com</Anchor>.
          </Text>
        </div>
      </Stack>
    </Container>
    </>
  );
}
