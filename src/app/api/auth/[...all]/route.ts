import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { withRoute } from '@/lib/log';

const handlers = toNextJsHandler(auth);

// A wrong password is a 401 and logs as a warning; a 5xx or a throw is an Issue.
export const GET = withRoute('api.auth', handlers.GET);
export const POST = withRoute('api.auth', handlers.POST);
