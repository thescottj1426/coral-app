import { betterAuth } from 'better-auth';
import { Pool } from '@neondatabase/serverless';
import { sendEmail } from './email';
import { verifyTemplate, resetTemplate } from './emailTemplates';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const auth = betterAuth({
  database: pool,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(user.email, 'Reset your Polyp password', resetTemplate(url));
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(user.email, 'Verify your Polyp account', verifyTemplate(url));
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
          const username = base.length >= 3 ? base : base + '_' + Math.random().toString(36).slice(2, 5);
          await pool.query(
            `INSERT INTO "User" (id, "neonAuthId", username, email, "onboardingComplete", "isSeller", verified, plan, "updatedAt")
             VALUES ($1, $2, $3, $4, false, false, false, 'FREE', NOW())
             ON CONFLICT ("neonAuthId") DO NOTHING`,
            [user.id, user.id, username, user.email]
          );
        },
      },
    },
  },
});
