import { addMessage, getMessages, updateInterviewTranscript } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const messageSchema = z.object({
  interviewId: z.string().min(1),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  timeInCallSecs: z.number().optional(),
});

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const interviewId = searchParams.get('interviewId');

    if (!interviewId) {
      return new NextResponse('Interview ID is required', { status: 400 });
    }

    const messages = await getMessages(interviewId);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validatedData = messageSchema.parse(body);

    // Add message to messages table
    const message = await addMessage(
      validatedData.interviewId,
      validatedData.role,
      validatedData.content
    );

    // Update interview transcript
    await updateInterviewTranscript(validatedData.interviewId, {
      role: validatedData.role === 'assistant' ? 'agent' : 'user',
      message: validatedData.content,
      time_in_call_secs: validatedData.timeInCallSecs || Math.floor(Date.now() / 1000),
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Failed to add message:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
