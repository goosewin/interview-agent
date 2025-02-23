import { z } from 'zod';

// Evaluation Schemas
export const TechnicalEvaluationSchema = z.object({
  technicalScore: z.number().min(0).max(10),
  codeQuality: z.string(),
  problemSolving: z.string(),
  technicalStrengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
});

export const CommunicationEvaluationSchema = z.object({
  communicationScore: z.number().min(0).max(10),
  clarity: z.string(),
  collaboration: z.string(),
  communicationStrengths: z.array(z.string()),
  communicationWeaknesses: z.array(z.string()),
});

export const HiringDecisionSchema = z.object({
  recommendation: z.enum(['hire', 'no_hire', 'consider']),
  overallScore: z.number().min(0).max(10),
  reasoning: z.string(),
  nextSteps: z.array(z.string()),
});

export const TECHNICAL_EVALUATION_PROMPT = `You are an expert technical interviewer. Evaluate the candidate's solution to the problem.
Focus on:
- Code quality and organization
- Problem-solving approach
- Technical accuracy
- Edge case handling
- Time and space complexity`;

export const COMMUNICATION_EVALUATION_PROMPT = `You are an expert in evaluating communication skills. Analyze the interview transcript.
Focus on:
- Clarity of communication
- Understanding of requirements
- Questions asked
- Explanation of approach
- Professional conduct`;

export const HIRING_DECISION_PROMPT = `You are a senior technical hiring manager. Based on the technical and communication evaluations, 
provide a final recommendation. Be specific about strengths and areas of improvement.`;
