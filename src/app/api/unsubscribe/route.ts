import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeByToken } from '@/app/actions/unsubscribe';

// RFC 8058 one-click: Gmail and Apple Mail POST here from their own
// "Unsubscribe" button. GET is deliberately absent — link scanners prefetch
// GETs and would unsubscribe people who never clicked.
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') ?? '';
  const ok = await unsubscribeByToken(token);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}
