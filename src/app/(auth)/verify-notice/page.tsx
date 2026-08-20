import { redirect } from 'next/navigation';

// Email verification is paused — this route only exists so old links/bookmarks
// don't 404. Send everyone straight into the app.
export default function VerifyNoticePage() {
  redirect('/dashboard');
}
