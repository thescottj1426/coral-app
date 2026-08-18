'use client';

import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Button,
  Divider,
  Title,
  Text,
} from '@mantine/core';
import { useForm, schemaResolver } from '@mantine/form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { track } from '@vercel/analytics';
import { signUp, authClient } from '@/lib/auth-client';
import styles from './auth.module.css';

const schema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(30, { message: 'Username must be 30 characters or fewer' })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: 'Only letters, numbers, underscores, and hyphens',
    }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' }),
  termsAccepted: z.boolean().refine(val => val === true, { message: 'You must accept the Terms of Service to continue' }),
});

type FormValues = z.infer<typeof schema>;

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    validate: schemaResolver(schema),
    initialValues: {
      email: '',
      username: '',
      password: '',
      termsAccepted: false,
    },
  });

  async function handleSubmit(values: FormValues) {
    setError(null);
    setLoading(true);
    try {
      const result = await signUp.email({
        email: values.email,
        password: values.password,
        name: values.username,
        callbackURL: '/onboarding',
      });
      if (result.error) {
        setError(result.error.message ?? 'Something went wrong');
      } else {
        track('signup_completed');
        router.push('/verify-notice');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.formPanel}>
      <form className={styles.formInner} onSubmit={form.onSubmit(handleSubmit)}>
        <div className={styles.formHeader}>
          <Title order={2}>Create an account</Title>
          <Text c="dimmed" size="sm" mt={2}>
            Join the community
          </Text>
        </div>

        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        <TextInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          {...form.getInputProps('email')}
        />

        <TextInput
          label="Username"
          placeholder="your_handle"
          {...form.getInputProps('username')}
        />

        <PasswordInput
          label="Password"
          placeholder="At least 8 characters"
          {...form.getInputProps('password')}
        />

        <Checkbox
          label={
            <Text size="sm">
              I agree to the{' '}
              <Anchor component={Link} href="/terms" target="_blank" c="ocean.6">Terms of Service</Anchor>
              {' '}and{' '}
              <Anchor component={Link} href="/privacy" target="_blank" c="ocean.6">Privacy Policy</Anchor>
            </Text>
          }
          {...form.getInputProps('termsAccepted', { type: 'checkbox' })}
        />

        <Button type="submit" fullWidth mt={4} loading={loading}>
          Create account
        </Button>

        <Divider label="or" labelPosition="center" />

        <Button
          variant="default"
          fullWidth
          onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: '/onboarding' })}
        >
          Continue with Google
        </Button>

        <Text size="xs" c="dimmed" ta="center">
          By continuing, you agree to our{' '}
          <Anchor component={Link} href="/terms" size="xs" c="ocean.6">Terms</Anchor>
          {' '}and{' '}
          <Anchor component={Link} href="/privacy" size="xs" c="ocean.6">Privacy Policy</Anchor>
        </Text>

        <Divider label="already collecting?" labelPosition="center" />

        <Button
          component={Link}
          href="/sign-in"
          variant="default"
          fullWidth
        >
          Sign in
        </Button>
      </form>
    </div>
  );
}
