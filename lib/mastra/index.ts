import { Mastra } from '@mastra/core';
import { createLogger } from '@mastra/core/logger';
import { recruiterAgent } from './agents/recruiter';
import { interviewEvaluationWorkflow } from './workflows/evaluation';

type Agents = { recruiterAgent: typeof recruiterAgent };
type Workflows = { interviewEvaluationWorkflow: typeof interviewEvaluationWorkflow };

export const mastra = new Mastra<Agents, Workflows>({
  agents: { recruiterAgent },
  // info in prod, debug in dev
  logger: createLogger({ name: 'InterviewAgent', level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' }),
  workflows: { interviewEvaluationWorkflow },
});
