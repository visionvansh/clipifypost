import { NextResponse } from 'next/server';
import { initializeBot } from '@/lib/disBot';

export async function POST() {
  try {
    await initializeBot();
    return NextResponse.json({ message: 'Bot initialized successfully' });
  } catch (error) {
    console.error('Error initializing bot:', error);
    return NextResponse.json({ error: 'Failed to initialize bot' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Bot status endpoint' });
}