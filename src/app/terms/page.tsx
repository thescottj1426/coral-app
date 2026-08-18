import Link from 'next/link';
import { Container, Title, Text, Stack, Anchor } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service — Coral Chest' };

const SECTION: React.CSSProperties = { marginTop: 8 };

export default function TermsPage() {
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
            Terms of Service
          </Title>
          <Text c="dimmed" size="sm">Effective date: August 17, 2026</Text>
        </div>

        <Text size="sm" style={{ lineHeight: 1.75 }}>
          Welcome to Coral Chest ("we," "us," or "our"). By creating an account or using
          Coral Chest at coralchest.com (the "Service"), you agree to these Terms of Service.
          Please read them carefully. If you do not agree, do not use the Service.
        </Text>

        {/* 1 */}
        <div>
          <Title order={3} style={SECTION}>1. Who Can Use Coral Chest</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            You must be at least 13 years old to use the Service. If you are under 18,
            you must have your parent's or guardian's permission. By using the Service
            you represent that you meet these requirements.
          </Text>
        </div>

        {/* 2 */}
        <div>
          <Title order={3} style={SECTION}>2. Your Account</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            You are responsible for maintaining the security of your account credentials
            and for all activity that occurs under your account. Notify us immediately
            at <Anchor href="mailto:contact@coralchest.com">contact@coralchest.com</Anchor> if
            you believe your account has been compromised. We reserve the right to
            suspend or terminate accounts that violate these Terms.
          </Text>
        </div>

        {/* 3 */}
        <div>
          <Title order={3} style={SECTION}>3. What the Service Does</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            Coral Chest lets reef hobbyists log coral specimens, track lineage using RF
            codes, upload photos, and participate in community discussions. We provide the
            platform; the accuracy of specimen data, lineage records, and any valuations
            is the responsibility of the user who submits them. We make no guarantees
            about the authenticity or accuracy of any user-submitted content.
          </Text>
        </div>

        {/* 4 */}
        <div>
          <Title order={3} style={SECTION}>4. User Content</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            You retain ownership of content you submit (photos, descriptions, discussion
            posts, etc.). By submitting content you grant Coral Chest a worldwide,
            non-exclusive, royalty-free license to store, display, and distribute that
            content as part of operating and promoting the Service. You represent that
            you own or have the rights to any content you upload and that it does not
            violate anyone else's rights.
          </Text>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            We review photos before they are made publicly visible. We may remove or
            reject any content that violates these Terms at our discretion.
          </Text>
        </div>

        {/* 5 */}
        <div>
          <Title order={3} style={SECTION}>5. Prohibited Conduct</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            You agree not to:
          </Text>
          <ul style={{ fontSize: 14, lineHeight: 1.85, paddingLeft: 24, marginTop: 8 }}>
            <li>Post false, misleading, or fraudulent specimen information or lineage records</li>
            <li>Upload content you do not own or have rights to</li>
            <li>Harass, threaten, or abuse other users</li>
            <li>Scrape, crawl, or systematically collect data from the Service without permission</li>
            <li>Attempt to gain unauthorized access to any account or system</li>
            <li>Use the Service for any unlawful purpose or in violation of any regulations</li>
            <li>Impersonate another person or entity</li>
            <li>Spam, advertise, or solicit other users without our permission</li>
          </ul>
        </div>

        {/* 6 */}
        <div>
          <Title order={3} style={SECTION}>6. RF Lineage Codes</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            RF codes are identifiers assigned to specimens to help trace lineage. While
            we generate unique codes, we cannot verify the accuracy of lineage claims
            made by users. Coral Chest is not liable for disputes arising from incorrect
            or fraudulent lineage records.
          </Text>
        </div>

        {/* 7 */}
        <div>
          <Title order={3} style={SECTION}>7. Intellectual Property</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            The Coral Chest name, logo, and design are our property. We grant you a
            limited, personal, non-transferable license to use the Service for its
            intended purpose. You may not copy, modify, or distribute any part of the
            Service without our written permission.
          </Text>
        </div>

        {/* 8 */}
        <div>
          <Title order={3} style={SECTION}>8. Disclaimer of Warranties</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            The Service is provided "as is" and "as available" without warranties of any
            kind, either express or implied. We do not warrant that the Service will be
            uninterrupted, error-free, or free of harmful components. Your use of the
            Service is at your own risk.
          </Text>
        </div>

        {/* 9 */}
        <div>
          <Title order={3} style={SECTION}>9. Limitation of Liability</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            To the maximum extent permitted by law, Coral Chest and its owners shall not
            be liable for any indirect, incidental, special, or consequential damages
            arising from your use of or inability to use the Service, even if we have
            been advised of the possibility of such damages. Our total liability to you
            for any claim arising out of these Terms shall not exceed the amount you
            paid us in the twelve months preceding the claim.
          </Text>
        </div>

        {/* 10 */}
        <div>
          <Title order={3} style={SECTION}>10. Termination</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            You may delete your account at any time by contacting us. We may suspend or
            terminate your access at any time if you violate these Terms or for any other
            reason with or without notice. Upon termination, your right to use the Service
            ceases immediately.
          </Text>
        </div>

        {/* 11 */}
        <div>
          <Title order={3} style={SECTION}>11. Changes to These Terms</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            We may update these Terms from time to time. When we do, we will update the
            effective date above and notify registered users by email where required by
            law. Continued use of the Service after changes take effect constitutes
            acceptance of the revised Terms.
          </Text>
        </div>

        {/* 12 */}
        <div>
          <Title order={3} style={SECTION}>12. Governing Law</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            These Terms are governed by the laws of the United States. Any disputes
            shall be resolved in the applicable courts of the United States.
          </Text>
        </div>

        {/* 13 */}
        <div>
          <Title order={3} style={SECTION}>13. Contact</Title>
          <Text size="sm" mt={8} style={{ lineHeight: 1.75 }}>
            Questions about these Terms? Email us at{' '}
            <Anchor href="mailto:contact@coralchest.com">contact@coralchest.com</Anchor>.
          </Text>
        </div>
      </Stack>
    </Container>
    </>
  );
}
