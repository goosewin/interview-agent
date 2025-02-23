import { db } from '@/db';
import { candidates, evaluations, interviews } from '@/db/schema';
import { openai } from '@ai-sdk/openai';
import { createTool } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  CommunicationEvaluationSchema,
  HiringDecisionSchema,
  TechnicalEvaluationSchema,
} from '../prompts/recruiter';

// Tool Creation
const getInterviewData = createTool({
  id: 'getInterviewData',
  description: 'Retrieves interview data including problem, solution, and transcript',
  inputSchema: z.object({
    interviewId: z.string(),
  }),
  execute: async (context) => {
    const { interviewId } = context.context;
    const interview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId),
      with: {
        problem: true,
        candidate: true,
      },
    });

    if (!interview) {
      throw new Error('Interview not found');
    }

    return {
      problemDescription: interview.problemDescription,
      finalSolution: interview.code,
      transcript: interview.transcript,
      language: interview.language,
      candidateId: interview.candidateId,
    };
  },
});

const getCandidateData = createTool({
  id: 'getCandidateData',
  description: 'Retrieves candidate data and past evaluations',
  inputSchema: z.object({
    candidateId: z.string(),
  }),
  execute: async (context) => {
    const { candidateId } = context.context;

    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, candidateId),
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    const pastEvaluations = await db.query.evaluations.findMany({
      where: eq(evaluations.candidateId, candidateId),
      orderBy: (evaluations, { desc }) => [desc(evaluations.createdAt)],
      limit: 5,
    });

    return {
      candidate: {
        name: candidate.name,
        email: candidate.email,
        metadata: candidate.metadata,
      },
      pastEvaluations,
    };
  },
});

const storeEvaluation = createTool({
  id: 'storeEvaluation',
  description: 'Stores evaluation results in the database',
  inputSchema: z.object({
    interviewId: z.string(),
    candidateId: z.string(),
    technicalEvaluation: TechnicalEvaluationSchema,
    communicationEvaluation: CommunicationEvaluationSchema,
    hiringDecision: HiringDecisionSchema,
  }),
  execute: async (context) => {
    const {
      interviewId,
      candidateId,
      technicalEvaluation,
      communicationEvaluation,
      hiringDecision,
    } = context.context;

    await db.insert(evaluations).values({
      interviewId,
      candidateId,
      technicalScore: String(technicalEvaluation.technicalScore),
      communicationScore: String(communicationEvaluation.communicationScore),
      overallScore: String(hiringDecision.overallScore),
      recommendation: hiringDecision.recommendation,
      reasoning: hiringDecision.reasoning,
      technicalStrengths: technicalEvaluation.technicalStrengths,
      technicalWeaknesses: technicalEvaluation.areasForImprovement,
      communicationStrengths: communicationEvaluation.communicationStrengths,
      communicationWeaknesses: communicationEvaluation.communicationWeaknesses,
      nextSteps: hiringDecision.nextSteps,
    });

    // Update interview status to indicate evaluation is complete
    await db.update(interviews).set({ status: 'completed' }).where(eq(interviews.id, interviewId));

    return { success: true };
  },
});

export const recruiterAgent = new Agent({
  name: 'recruiter',
  instructions: `You are a technical recruiter evaluating candidates based on their interview performance.
    You will assess their technical skills, communication abilities, and make hiring recommendations.
    Your evaluation should be thorough, fair, and based on concrete evidence from the interview.`,
  model: openai('gpt-4-turbo-preview'),
  tools: {
    getInterviewData,
    getCandidateData,
    storeEvaluation,
  },
});
