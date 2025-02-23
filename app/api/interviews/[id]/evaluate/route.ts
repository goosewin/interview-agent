import { generateEvaluationReport } from '@/lib/evaluation';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const interviewId = params.id;
    const { transcript, problemStatement, finalSolution, candidateName } = await request.json();

    if (!transcript || !problemStatement || !finalSolution || !candidateName) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const evaluation = await generateEvaluationReport({
      transcript,
      problemStatement,
      finalSolution,
      candidateName,
      interviewId,
    });

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Failed to generate evaluation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
