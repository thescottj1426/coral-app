'use client';

import {
  TextInput,
  PasswordInput,
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
        callbackURL: '/collection',
      });
      if (result.error) {
        setError(result.error.message ?? 'Something went wrong');
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

        <Button type="submit" fullWidth mt={4} loading={loading}>
          Create account
        </Button>

        <Divider label="or" labelPosition="center" />

        <Button
          variant="default"
          fullWidth
          onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: '/collection' })}
        >
          Continue with Google
        </Button>

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
