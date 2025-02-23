import { startRecording, stopRecording } from '@/lib/db';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let action: 'start' | 'stop';
    let interviewId: string;
    let file: File | null = null;

    if (contentType.includes('application/json')) {
      const json = await req.json();
      action = json.action;
      interviewId = json.interviewId;
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      file = formData.get('recording') as File;
      interviewId = formData.get('interviewId') as string;
      action = formData.get('action') as 'start' | 'stop';
    } else {
      return NextResponse.json(
        { error: 'Invalid content type. Expected JSON or form data' },
        { status: 400 }
      );
    }

    if (!interviewId || !action) {
      return NextResponse.json(
        { error: 'InterviewId and action are required' },
        { status: 400 }
      );
    }

    if (action === 'start') {
      await startRecording(interviewId);
      return NextResponse.json({ success: true });
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Recording file is required for stop action' },
        { status: 400 }
      );
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
