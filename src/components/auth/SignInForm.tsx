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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    validate: schemaResolver(schema),
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  async function handleSubmit(values: FormValues) {
    setError(null);
    setLoading(true);
    try {
      const result = await signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
        callbackURL: '/collection',
      });
      if (result.error) {
        setError(result.error.message ?? 'Invalid email or password');
      } else {
        router.push('/collection');
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
          <Title order={2}>Welcome back</Title>
          <Text c="dimmed" size="sm" mt={2}>
            Sign in to your collection
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
              onChange={(e) =>
                form.setFieldValue('rememberMe', e.currentTarget.checked)
              }
            />
            <Text size="sm" c="dimmed">
              Remember me
            </Text>
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
          onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: '/collection' })}
        >
          Continue with Google
        </Button>

        <Divider label="new here?" labelPosition="center" />

        <Button
          component={Link}
          href="/sign-up"
          variant="default"
          fullWidth
        >
          Create an account
        </Button>
      </form>
    </div>
  );
}
