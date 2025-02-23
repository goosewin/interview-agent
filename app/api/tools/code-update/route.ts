import { getInterview, updateInterview } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { interviewId, code, language } = body;

    if (!interviewId) {
      return new Response(JSON.stringify({ error: 'Interview ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await updateInterview(interviewId, {
      code,
      language,
      updatedAt: new Date(),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating code:', error);
    return new Response(JSON.stringify({ error: 'Failed to update code' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const interviewId = searchParams.get('interviewId');

    if (!interviewId) {
      return new Response(JSON.stringify({ error: 'Interview ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const interview = await getInterview(interviewId);
    if (!interview) {
      return new Response(JSON.stringify({ error: 'Interview not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const startTime = interview.recordingStartedAt?.getTime() || Date.now();

    return new Response(JSON.stringify({
      language: interview.language || 'javascript',
      code: interview.code || '',
      timeInCallSecs: Math.floor((Date.now() - startTime) / 1000),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting code:', error);
    return new Response(JSON.stringify({ error: 'Failed to get code' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
