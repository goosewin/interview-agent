import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EvaluationInput {
  transcript: string;
  problemStatement: string;
  finalSolution: string;
  candidateName: string;
  interviewId: string;
}

interface TechnicalEvaluation {
  technicalScore: number; // 0-10
  codeQuality: string;
  problemSolving: string;
  technicalStrengths: string[];
  areasForImprovement: string[];
}

interface CommunicationEvaluation {
  communicationScore: number; // 0-10
  clarity: string;
  collaboration: string;
  communicationStrengths: string[];
  communicationWeaknesses: string[];
}

interface HiringDecision {
  recommendation: 'hire' | 'no_hire' | 'consider';
  overallScore: number;
  reasoning: string;
  nextSteps: string[];
}

interface EvaluationReport extends HiringDecision {
  candidateName: string;
  interviewId: string;
  technicalEvaluation: TechnicalEvaluation;
  communicationEvaluation: CommunicationEvaluation;
}

async function evaluateTechnicalSkills(
  input: Pick<EvaluationInput, 'problemStatement' | 'finalSolution'>
): Promise<TechnicalEvaluation> {
  // const startTime = Date.now();
  const messages = [
    {
      role: 'system' as const,
      content: `You are an expert technical interviewer. Evaluate the candidate's solution to the problem.
        Focus on:
        - Code quality and organization
        - Problem-solving approach
        - Technical accuracy
        - Edge case handling
        - Time and space complexity
        
        Respond with a JSON object containing:
        - technicalScore (0-10)
        - codeQuality (string description)
        - problemSolving (string description)
        - technicalStrengths (array of strings)
        - areasForImprovement (array of strings)`,
    },
    {
      role: 'user' as const,
      content: `Problem Statement: ${input.problemStatement}\n\nCandidate Solution: ${input.finalSolution}`,
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}') as TechnicalEvaluation;

    return result;
  } catch (error) {
    throw error;
  }
}

async function evaluateCommunication(
  input: Pick<EvaluationInput, 'transcript'>
): Promise<CommunicationEvaluation> {
  // const startTime = Date.now();
  const messages = [
    {
      role: 'system' as const,
      content: `You are an expert in evaluating communication skills. Analyze the interview transcript.
        Focus on:
        - Clarity of communication
        - Understanding of requirements
        - Questions asked
        - Explanation of approach
        - Professional conduct
        
        Respond with a JSON object containing:
        - communicationScore (0-10)
        - clarity (string description)
        - collaboration (string description)
        - communicationStrengths (array of strings)
        - communicationWeaknesses (array of strings)`,
    },
    {
      role: 'user' as const,
      content: `Interview Transcript: ${input.transcript}`,
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(
      response.choices[0].message.content || '{}'
    ) as CommunicationEvaluation;

    return result;
  } catch (error) {
    throw error;
  }
}

async function makeHiringDecision(
  technicalEvaluation: TechnicalEvaluation,
  communicationEvaluation: CommunicationEvaluation
): Promise<HiringDecision> {
  // const startTime = Date.now();
  const messages = [
    {
      role: 'system' as const,
      content: `You are a senior technical hiring manager. Based on the technical and communication evaluations, 
        provide a final recommendation. Be specific about strengths and areas of improvement.
        
        Respond with a JSON object containing:
        - recommendation ('hire' | 'no_hire' | 'consider')
        - overallScore (0-10)
        - reasoning (string)
        - nextSteps (array of strings)`,
    },
    {
      role: 'user' as const,
      content: `Technical Evaluation: ${JSON.stringify(technicalEvaluation, null, 2)}
        \n\nCommunication Evaluation: ${JSON.stringify(communicationEvaluation, null, 2)}`,
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}') as HiringDecision;

    return result;
  } catch (error) {
    throw error;
  }
}

export async function generateEvaluationReport(input: EvaluationInput): Promise<EvaluationReport> {
  try {
    const technicalEvaluation = await evaluateTechnicalSkills(input);
    const communicationEvaluation = await evaluateCommunication(input);
    const decision = await makeHiringDecision(technicalEvaluation, communicationEvaluation);

    const result: EvaluationReport = {
      candidateName: input.candidateName,
      interviewId: input.interviewId,
      ...decision,
      technicalEvaluation,
      communicationEvaluation,
    };

    return result;
  } catch (error) {
    console.error('Failed to generate evaluation:', error);
    throw error;
  }
}
