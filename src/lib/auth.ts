import { betterAuth } from 'better-auth';
import { Pool } from '@neondatabase/serverless';
import { sendEmail } from './email';
import { verifyTemplate, resetTemplate, welcomeTemplate } from './emailTemplates';
import { authBaseUrl, googleConfigured } from './authUrl';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

if (!googleConfigured()) {
  console.warn('[auth] Google sign-in disabled: GOOGLE_CLIENT_ID/SECRET not set');
}

export const auth = betterAuth({
  database: pool,
  // Explicit, so a stale BETTER_AUTH_URL cannot point production's OAuth
  // callback at localhost.
  baseURL: authBaseUrl(),
  // Preview deployments each get their own origin; without this better-auth
  // rejects the callback before Google is ever reached.
  trustedOrigins: [
    authBaseUrl(),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
  // Omitted entirely when unconfigured — registering with an empty clientId
  // yields a button that redirects to a Google error page and logs nothing.
  socialProviders: googleConfigured()
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(user.email, 'Reset your Coral Chest password', resetTemplate(url));
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(user.email, 'Verify your Coral Chest account', verifyTemplate(url));
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const raw = user.name ?? user.email?.split('@')[0] ?? 'user';
          const base = raw.toLowerCase().replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').slice(0, 20);
          const baseUsername = base.length >= 3 ? base : base + '_' + Math.random().toString(36).slice(2, 5);

          // Retry with a random suffix if the username is already taken
          let username = baseUsername;
          for (let i = 0; i < 5; i++) {
            try {
              await pool.query(
                `INSERT INTO public."User" (id, "neonAuthId", username, email, "onboardingComplete", "isSeller", verified, plan, "updatedAt")
                 VALUES ($1, $2, $3, $4, false, false, false, 'FREE', NOW())
                 ON CONFLICT (email) DO UPDATE SET
                   "neonAuthId" = EXCLUDED."neonAuthId",
                   "updatedAt" = NOW()`,
                [user.id, user.id, username, user.email]
              );
              await sendEmail(user.email, `Welcome to Coral Chest`, welcomeTemplate(username));
              break;
            } catch (e) {
              // Postgres surfaces the violated index in `constraint`; a retry
              // with a suffixed username is only right for that one.
              const constraint =
                typeof e === 'object' && e !== null && 'constraint' in e
                  ? (e as { constraint?: string }).constraint
                  : undefined;
              if (constraint === 'User_username_key') {
                username = baseUsername + '_' + Math.random().toString(36).slice(2, 5);
              } else {
                throw e;
              }
            }
          }
        },
      },
    },
  },
});
