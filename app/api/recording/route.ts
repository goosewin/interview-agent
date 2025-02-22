import { startRecording, stopRecording } from '@/lib/db';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('recording') as File;
    const interviewId = formData.get('interviewId') as string;
    const action = formData.get('action') as 'start' | 'stop';

    if (!file || !interviewId || !action) {
      return NextResponse.json(
        { error: 'Recording, interviewId, and action are required' },
        { status: 400 }
      );
    }

    if (action === 'start') {
      await startRecording(interviewId);
      return NextResponse.json({ success: true });
    }

    const blob = await put(`interviews/${interviewId}/recording.webm`, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    await stopRecording(interviewId, blob.url);

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Failed to handle recording:', error);
    return NextResponse.json({ error: 'Failed to handle recording' }, { status: 500 });
  }
}
