import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
  }

  // Redirect to /api/auth/discord with code
  const redirectUrl = new URL('/api/auth/discord', request.url);
  redirectUrl.searchParams.set('code', code);
  return NextResponse.redirect(redirectUrl);
}