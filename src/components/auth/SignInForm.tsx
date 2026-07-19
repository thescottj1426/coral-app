'use client';

import {
  TextInput,
  PasswordInput,
  Button,
  Switch,
  Anchor,
  Divider,
  Title,
  Text,
} from '@mantine/core';
import { useForm, schemaResolver } from '@mantine/form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { signIn, authClient } from '@/lib/auth-client';
import styles from './auth.module.css';

const schema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
  rememberMe: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordReset = searchParams.get('reset') === '1';
  const [error, setError] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendSent, setResendSent] = useState(false);
  const [isResending, startResend] = useTransition();

  const form = useForm<FormValues>({
    validate: schemaResolver(schema),
    initialValues: { email: '', password: '', rememberMe: false },
  });

  async function handleSubmit(values: FormValues) {
    setError(null);
    setUnverifiedEmail(null);
    setLoading(true);
    try {
      const result = await signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
        callbackURL: '/dashboard',
      });
      if (result.error) {
        if (result.error.code === 'EMAIL_NOT_VERIFIED') {
          setUnverifiedEmail(values.email);
        } else {
          setFailCount((n) => n + 1);
          setError(result.error.message ?? 'Invalid email or password');
        }
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  function handleResend() {
    if (!unverifiedEmail) return;
    startResend(async () => {
      await authClient.sendVerificationEmail({ email: unverifiedEmail, callbackURL: '/dashboard' });
      setResendSent(true);
    });
  }

  if (unverifiedEmail) {
    return (
      <div className={styles.formPanel}>
        <div className={styles.formInner}>
          <div className={styles.formHeader}>
            <Title order={2}>Check your inbox</Title>
            <Text c="dimmed" size="sm" mt={2}>
              We sent a verification link to <strong>{unverifiedEmail}</strong>
            </Text>
          </div>
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
            Click the link in that email to activate your account, then come back to sign in.
          </Text>
          {resendSent ? (
            <Text size="sm" c="teal.7" fw={500}>Email resent — check your inbox.</Text>
          ) : (
            <Button variant="light" fullWidth loading={isResending} onClick={handleResend}>
              Resend verification email
            </Button>
          )}
          <Button variant="subtle" fullWidth onClick={() => setUnverifiedEmail(null)}>
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formPanel}>
      <form className={styles.formInner} onSubmit={form.onSubmit(handleSubmit)}>
        <div className={styles.formHeader}>
          <Title order={2}>Welcome back</Title>
          <Text c="dimmed" size="sm" mt={2}>
            Sign in to your collection
          </Text>
        </div>

        {passwordReset && (
          <Text c="teal.7" size="sm" fw={500}>Password updated — sign in below.</Text>
        )}

        {error && (
          <Text c="red" size="sm">{error}</Text>
        )}

        {failCount >= 2 && (
          <Button component={Link} href="/forgot-password" variant="light" color="ocean" fullWidth>
            Forgot your password?
          </Button>
        )}

        <TextInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          {...form.getInputProps('email')}
        />

        <PasswordInput
          label="Password"
          placeholder="••••••••"
          {...form.getInputProps('password')}
        />

        <div className={styles.rememberRow}>
          <label className={styles.rememberLabel}>
            <Switch
              size="xs"
              checked={form.values.rememberMe}
              onChange={(e) => form.setFieldValue('rememberMe', e.currentTarget.checked)}
            />
            <Text size="sm" c="dimmed">Remember me</Text>
          </label>
          <Anchor component={Link} href="/forgot-password" size="sm" c="ocean.6" fw={500}>
            Forgot password?
          </Anchor>
        </div>

        <Button type="submit" fullWidth loading={loading}>
          Sign in
        </Button>

        <Divider label="or" labelPosition="center" />

        <Button
          variant="default"
          fullWidth
          onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' })}
        >
          Continue with Google
        </Button>

        <Divider label="new here?" labelPosition="center" />

        <Button component={Link} href="/sign-up" variant="default" fullWidth>
          Create an account
        </Button>
      </form>
    </div>
  );
}
