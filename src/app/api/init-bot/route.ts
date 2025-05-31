import { NextRequest, NextResponse } from 'next/server';
import { initializeDiscordBot } from '../../../lib/discordBot';

export async function POST(req: NextRequest) {
  try {
    await initializeDiscordBot();
    return NextResponse.json({ success: true, message: 'Discord bot initialized successfully' }, { status: 200 });
  } catch (err) {
    console.error('Failed to initialize bot:', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}