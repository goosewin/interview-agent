import { handleInterviewCompletion } from '@/lib/mastra/triggers/interview-completion';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await handleInterviewCompletion(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to handle interview completion:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
