import { handleInterviewCompletion } from '@/lib/mastra/triggers/interview-completion';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing interview identifier' }, { status: 400 });
    }

    // Add timeout to ensure the request doesn't hang indefinitely
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 30000)
    );

    // Race the completion handler against the timeout
    const result = await Promise.race([handleInterviewCompletion(id), timeoutPromise]);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Failed to handle interview completion:', error);

    // Determine appropriate status code based on error
    let statusCode = 500;
    let errorMessage = 'Internal Server Error';

    if (error instanceof Error) {
      errorMessage = error.message;

      if (errorMessage.includes('not found')) {
        statusCode = 404;
      } else if (errorMessage.includes('not completed')) {
        statusCode = 400;
      } else if (errorMessage.includes('timeout')) {
        statusCode = 504; // Gateway Timeout
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
