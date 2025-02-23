import { Step, type WorkflowContext } from '@mastra/core';
import { Workflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { recruiterAgent } from '../agents/recruiter';
import {
  COMMUNICATION_EVALUATION_PROMPT,
  CommunicationEvaluationSchema,
  HIRING_DECISION_PROMPT,
  HiringDecisionSchema,
  TECHNICAL_EVALUATION_PROMPT,
  TechnicalEvaluationSchema,
} from '../prompts/recruiter';

const recruiter = recruiterAgent;

const InterviewCompletionInputSchema = z.object({
  interviewId: z.string(),
});

interface InterviewEvaluationContext extends WorkflowContext {
  interviewId: string;
  candidateId: string;
  problemDescription: string;
  finalSolution: string;
  transcript: string[];
  language: string;
  technicalEvaluation?: z.infer<typeof TechnicalEvaluationSchema>;
  communicationEvaluation?: z.infer<typeof CommunicationEvaluationSchema>;
  candidateData?: {
    name: string;
    email: string;
    metadata: Record<string, unknown>;
  };
  pastEvaluations?: unknown[];
}

interface InterviewData {
  problemDescription: string;
  finalSolution: string;
  transcript: string[];
  language: string;
  candidateId: string;
  candidateName: string;
}

interface CandidateData {
  candidate: {
    name: string;
    email: string;
    metadata: Record<string, unknown>;
  };
  pastEvaluations: unknown[];
}

const gatherInterviewData = new Step({
  id: 'gatherInterviewData',
  inputSchema: InterviewCompletionInputSchema,
  execute: async ({ context }) => {
    const { interviewId } = context;

    // Get interview data
    const interviewData = (await recruiterAgent.tools.getInterviewData.execute({
      context: {
        interviewId,
        steps: context.steps,
        triggerData: context.triggerData,
        attempts: context.attempts,
        getStepPayload: context.getStepPayload,
      },
      suspend: () => Promise.resolve(),
    })) as InterviewData;

    // Get candidate data
    const candidateData = (await recruiterAgent.tools.getCandidateData.execute({
      context: {
        candidateId: interviewData.candidateId,
        steps: context.steps,
        triggerData: context.triggerData,
        attempts: context.attempts,
        getStepPayload: context.getStepPayload,
      },
      suspend: () => Promise.resolve(),
    })) as CandidateData;

    // Update context with gathered data
    return {
      ...context,
      interviewId,
      candidateId: interviewData.candidateId,
      problemDescription: interviewData.problemDescription,
      finalSolution: interviewData.finalSolution,
      transcript: interviewData.transcript,
      language: interviewData.language,
      candidateData: candidateData.candidate,
      pastEvaluations: candidateData.pastEvaluations,
    };
  },
});

const evaluateTechnicalSkills = new Step({
  id: 'evaluateTechnicalSkills',
  execute: async ({ context }) => {
    const { problemDescription, finalSolution, language, candidateData } =
      context as InterviewEvaluationContext;

    const prompt = `${TECHNICAL_EVALUATION_PROMPT}
      
      Candidate Info: ${JSON.stringify(candidateData)}
      Programming Language: ${language}
      
      Problem Description: ${problemDescription}
      Candidate Solution: ${finalSolution}
      
      Respond with a JSON object containing:
      - technicalScore (0-10)
      - codeQuality (string description)
      - problemSolving (string description)
      - technicalStrengths (array of strings)
      - areasForImprovement (array of strings)`;

    const response = await recruiter.generate(prompt, {
      output: TechnicalEvaluationSchema,
    });

    return {
      ...context,
      technicalEvaluation: response.object,
    };
  },
});

const evaluateCommunicationSkills = new Step({
  id: 'evaluateCommunicationSkills',
  execute: async ({ context }) => {
    const { transcript, candidateData } = context as InterviewEvaluationContext;

    const prompt = `${COMMUNICATION_EVALUATION_PROMPT}
      
      Candidate Info: ${JSON.stringify(candidateData)}
      
      Interview Transcript: ${JSON.stringify(transcript)}
      
      Respond with a JSON object containing:
      - communicationScore (0-10)
      - clarity (string description)
      - collaboration (string description)
      - communicationStrengths (array of strings)
      - communicationWeaknesses (array of strings)`;

    const response = await recruiter.generate(prompt, {
      output: CommunicationEvaluationSchema,
    });

    return {
      ...context,
      communicationEvaluation: response.object,
    };
  },
});

const makeHiringDecision = new Step({
  id: 'makeHiringDecision',
  execute: async ({ context }) => {
    const {
      technicalEvaluation,
      communicationEvaluation,
      candidateData,
      steps,
    } = context as InterviewEvaluationContext;

    const { interviewId } = context.triggerData;
    const gatherDataStep = steps.gatherInterviewData;
    if (!gatherDataStep || gatherDataStep.status !== 'success') {
      throw new Error('Required interview data not found');
    }
    const { candidateId } = gatherDataStep.output;

    if (!technicalEvaluation || !communicationEvaluation) {
      // Instead of throwing, create a no-hire decision
      const hiringDecision: z.infer<typeof HiringDecisionSchema> = {
        recommendation: 'no_hire' as const,
        overallScore: 0,
        reasoning: 'Unable to evaluate candidate due to incomplete interview data',
        nextSteps: ['Schedule a new interview with proper problem description']
      };

      // Store the evaluation even if minimal
      await recruiterAgent.tools.storeEvaluation.execute({
        context: {
          interviewId,
          candidateId,
          technicalEvaluation: {
            technicalScore: 0,
            codeQuality: 'Unable to evaluate',
            problemSolving: 'Unable to evaluate',
            technicalStrengths: [],
            areasForImprovement: ['Complete interview with proper problem description']
          },
          communicationEvaluation: {
            communicationScore: 0,
            clarity: 'Unable to evaluate',
            collaboration: 'Unable to evaluate',
            communicationStrengths: [],
            communicationWeaknesses: ['Complete interview with proper problem description']
          },
          hiringDecision,
          steps: context.steps,
          triggerData: context.triggerData,
          attempts: context.attempts,
          getStepPayload: context.getStepPayload,
        },
        suspend: () => Promise.resolve(),
      });

      return {
        ...context,
        hiringDecision,
      };
    }

    const prompt = `${HIRING_DECISION_PROMPT}
      
      Candidate Info: ${JSON.stringify(candidateData)}
      
      Technical Evaluation: ${JSON.stringify(technicalEvaluation)}
      Communication Evaluation: ${JSON.stringify(communicationEvaluation)}
      
      Respond with a JSON object containing:
      - recommendation ('hire' | 'no_hire' | 'consider')
      - overallScore (0-10)
      - reasoning (string)
      - nextSteps (array of strings)`;

    const response = await recruiter.generate(prompt, {
      output: HiringDecisionSchema,
    });

    // Store the complete evaluation
    await recruiterAgent.tools.storeEvaluation.execute({
      context: {
        interviewId,
        candidateId,
        technicalEvaluation,
        communicationEvaluation,
        hiringDecision: response.object,
        steps: context.steps,
        triggerData: context.triggerData,
        attempts: context.attempts,
        getStepPayload: context.getStepPayload,
      },
      suspend: () => Promise.resolve(),
    });

    return {
      ...context,
      hiringDecision: response.object,
    };
  },
});

export const interviewEvaluationWorkflow = new Workflow({
  name: 'interview-evaluation',
  triggerSchema: InterviewCompletionInputSchema,
});

interviewEvaluationWorkflow
  .step(gatherInterviewData)
  .then(evaluateTechnicalSkills)
  .then(evaluateCommunicationSkills)
  .then(makeHiringDecision);

interviewEvaluationWorkflow.commit();
