import { Mastra, createLogger } from '@mastra/core';
import { recruiterAgent } from './agents/recruiter';
import { interviewEvaluationWorkflow } from './workflows/evaluation';

type Agents = { recruiterAgent: typeof recruiterAgent };
type Workflows = { interviewEvaluationWorkflow: typeof interviewEvaluationWorkflow };

export const mastra = new Mastra<Agents, Workflows>({
  agents: { recruiterAgent },
  logger: createLogger({ name: 'InterviewAgent', level: 'debug' }),
  workflows: { interviewEvaluationWorkflow },
});
