import { db } from '@/db';
import { interviews } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { mastra } from '../index';

export async function handleInterviewCompletion(interviewId: string) {
  console.log('[handleInterviewCompletion] Starting completion for interview:', interviewId);

  // Verify interview exists and is ready for evaluation
  const interview = await db.query.interviews.findFirst({
    where: eq(interviews.id, interviewId),
  });

  console.log('[handleInterviewCompletion] Interview lookup result:', interview ? 'found' : 'not found');

  if (!interview) {
    console.error('[handleInterviewCompletion] Interview not found for ID:', interviewId);
    throw new Error('Interview not found');
  }

  if (interview.status !== 'completed') {
    console.error('[handleInterviewCompletion] Interview status not completed:', interview.status);
    throw new Error('Interview is not completed');
  }

  console.log('[handleInterviewCompletion] Starting evaluation workflow with ID:', interview.id);

  // Start the evaluation workflow
  await mastra.getWorkflow('interviewEvaluationWorkflow').execute({
    triggerData: {
      interviewId: interview.id,
    },
  });

  console.log('[handleInterviewCompletion] Evaluation workflow started successfully');
  return { success: true };
}
