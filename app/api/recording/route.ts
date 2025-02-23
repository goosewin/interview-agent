import { startRecording, stopRecording } from '@/lib/db';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

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

      // Validate file type
      if (file && !file.type.startsWith('video/')) {
        return NextResponse.json(
          { error: 'Invalid file type. Expected video file' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid content type. Expected JSON or form data' },
        { status: 400 }
      );
    }

    if (!interviewId || !action) {
      return NextResponse.json({ error: 'InterviewId and action are required' }, { status: 400 });
    }

    if (action === 'start') {
      const interview = await startRecording(interviewId);
      return NextResponse.json({ success: true, interview });
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Recording file is required for stop action' },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob with a unique path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const blob = await put(`interviews/${interviewId}/${timestamp}-recording.webm`, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'video/webm',
    });

    const interview = await stopRecording(interviewId, blob.url);
    return NextResponse.json({ ...blob, interview });
  } catch (error) {
    console.error('Failed to handle recording:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to handle recording',
      },
      { status: 500 }
    );
  }
}
