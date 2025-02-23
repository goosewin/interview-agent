import { addMessage } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const messageSchema = z.object({
  interviewId: z.string().min(1),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validatedData = messageSchema.parse(body);

    const message = await addMessage(
      validatedData.interviewId,
      validatedData.role,
      validatedData.content
    );

    return NextResponse.json(message);
  } catch (error) {
    console.error('Failed to add message:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
