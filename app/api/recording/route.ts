import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('recording') as File;
    const interviewId = formData.get('interviewId') as string;

    if (!file || !interviewId) {
      return NextResponse.json(
        { error: 'Recording and interviewId are required' },
        { status: 400 }
      );
    }

    const blob = await put(`interviews/${interviewId}/recording.webm`, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Failed to upload recording:', error);
    return NextResponse.json(
      { error: 'Failed to upload recording' },
      { status: 500 }
    );
  }
} 
