'use client';

import { createAuthClient } from 'better-auth/react';

// No baseURL: the client talks to whatever origin served the page. A baked-in
// URL is fixed at build time, so once the site moved to coralchest.com the
// sign-in form kept posting to coral-app-one.vercel.app — cross-origin, and
// blocked by the browser before better-auth ever saw it.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
