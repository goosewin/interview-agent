import { getInterviewByIdentifier } from '@/lib/db';
import { generateEvaluationReport } from '@/lib/evaluation';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    console.log('[evaluate] Starting evaluation for identifier:', params.id);

    const { userId } = await auth();
    if (!userId) {
      console.error('[evaluate] Unauthorized request');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const identifier = params.id;
    console.log('[evaluate] Looking up interview with identifier:', identifier);

    const interview = await getInterviewByIdentifier(identifier);
    console.log('[evaluate] Interview lookup result:', interview ? 'found' : 'not found');

    if (!interview) {
      console.error('[evaluate] Interview not found for identifier:', identifier);
      return new NextResponse('Interview not found', { status: 404 });
    }

    const { transcript, problemStatement, finalSolution, candidateName } = await request.json();
    console.log('[evaluate] Received evaluation data:', {
      hasTranscript: !!transcript,
      hasProblemStatement: !!problemStatement,
      hasFinalSolution: !!finalSolution,
      hasCandidateName: !!candidateName
    });

    if (!transcript || !problemStatement || !finalSolution || !candidateName) {
      console.error('[evaluate] Missing required fields');
      return new NextResponse('Missing required fields', { status: 400 });
    }

    console.log('[evaluate] Generating evaluation report for interview:', interview.id);
    const evaluation = await generateEvaluationReport({
      transcript,
      problemStatement,
      finalSolution,
      candidateName,
      interviewId: interview.id,
    });
    console.log('[evaluate] Evaluation report generated successfully');

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('[evaluate] Failed to generate evaluation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
