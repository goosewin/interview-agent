import { Mastra, createLogger } from '@mastra/core';
import { recruiterAgent } from './agents/recruiter';
import { interviewEvaluationWorkflow } from './workflows/evaluation';

export const mastra = new Mastra({
  agents: { recruiterAgent },
  workflows: { interviewEvaluationWorkflow },
  logger: createLogger({ name: 'InterviewAgent', level: 'debug' }),
  // Remove Vercel deployer for now as it's causing build issues
  // deployer: new VercelDeployer({
  //   projectName: 'interview-agent',
  //   teamId: process.env.VERCEL_TEAM_ID || '',
  //   token: process.env.VERCEL_TOKEN || '',
  // }),
});
