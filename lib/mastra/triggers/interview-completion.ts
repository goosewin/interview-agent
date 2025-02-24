import { getInterviewByIdentifier } from '@/lib/db';
import { mastra } from '../index';

export async function handleInterviewCompletion(identifier: string) {
  console.log('[handleInterviewCompletion] Starting completion for interview:', identifier);

  // Add retry logic for database operations
  let interview = null;
  let retries = 3;

  while (retries > 0 && !interview) {
    try {
      // Get interview by identifier
      interview = await getInterviewByIdentifier(identifier);

      if (!interview) {
        console.log(
          `[handleInterviewCompletion] Interview not found, retrying... (${retries} attempts left)`
        );
        retries--;

        if (retries > 0) {
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('[handleInterviewCompletion] Error fetching interview:', error);
      retries--;

      if (retries > 0) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  console.log(
    '[handleInterviewCompletion] Interview lookup result:',
    interview ? 'found' : 'not found'
  );

  if (!interview) {
    console.error(
      '[handleInterviewCompletion] Interview not found for identifier after retries:',
      identifier
    );
    throw new Error('Interview not found');
  }

  // Check if interview is already completed
  if (interview.status !== 'completed') {
    console.error('[handleInterviewCompletion] Interview status not completed:', interview.status);
    throw new Error('Interview is not completed');
  }

  console.log('[handleInterviewCompletion] Starting evaluation workflow with ID:', interview.id);

  try {
    // Start the evaluation workflow with UUID
    await mastra.getWorkflow('interviewEvaluationWorkflow').execute({
      triggerData: {
        interviewId: interview.id,
      },
    });

    console.log('[handleInterviewCompletion] Evaluation workflow started successfully');
    return { success: true };
  } catch (error) {
    console.error('[handleInterviewCompletion] Failed to start evaluation workflow:', error);
    throw new Error('Failed to start evaluation workflow');
  }
}
