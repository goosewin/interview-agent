import { db } from '@/db';
import { interviews } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { mastra } from '../index';

export async function handleInterviewCompletion(interviewId: string) {
  // Verify interview exists and is ready for evaluation
  const interview = await db.query.interviews.findFirst({
    where: eq(interviews.id, interviewId),
  });

  if (!interview) {
    throw new Error('Interview not found');
  }

  if (interview.status !== 'completed') {
    throw new Error('Interview is not completed');
  }

  // Start the evaluation workflow
  await mastra.workflows.interviewEvaluationWorkflow.trigger({
    interviewId,
  });

  return { success: true };
}
