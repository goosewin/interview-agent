import { getInterviewByIdentifier } from '@/lib/db';
import { mastra } from '../index';

export async function handleInterviewCompletion(identifier: string) {
  console.log('[handleInterviewCompletion] Starting completion for interview:', identifier);

  // Get interview by identifier first
  const interview = await getInterviewByIdentifier(identifier);

  console.log('[handleInterviewCompletion] Interview lookup result:', interview ? 'found' : 'not found');

  if (!interview) {
    console.error('[handleInterviewCompletion] Interview not found for identifier:', identifier);
    throw new Error('Interview not found');
  }

  if (interview.status !== 'completed') {
    console.error('[handleInterviewCompletion] Interview status not completed:', interview.status);
    throw new Error('Interview is not completed');
  }

  console.log('[handleInterviewCompletion] Starting evaluation workflow with ID:', interview.id);

  // Start the evaluation workflow with UUID
  await mastra.getWorkflow('interviewEvaluationWorkflow').execute({
    triggerData: {
      interviewId: interview.id,
    },
  });

  console.log('[handleInterviewCompletion] Evaluation workflow started successfully');
  return { success: true };
}
