import { db } from '@/db';
import { candidates, codeSubmissions, interviews, messages, problems } from '@/db/schema';
import { createId } from '@paralleldrive/cuid2';
import { and, eq } from 'drizzle-orm';

export type NewInterview = typeof interviews.$inferInsert;
export type Interview = typeof interviews.$inferSelect & {
  candidateName: string | null;
  candidateEmail: string | null;
  metadata: {
    problemId?: string;
  };
  problemDescription?: string;
};
export type Message = typeof messages.$inferSelect;
export type CodeSubmission = typeof codeSubmissions.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
export type Problem = typeof problems.$inferSelect;
export type NewProblem = typeof problems.$inferInsert;

export async function getCandidates(userId: string, includeArchived = false) {
  const conditions = [eq(candidates.userId, userId)];
  if (!includeArchived) {
    conditions.push(eq(candidates.status, 'active'));
  }

  return db
    .select()
    .from(candidates)
    .where(and(...conditions))
    .orderBy(candidates.createdAt);
}

export async function getCandidate(id: string, userId: string) {
  const [candidate] = await db
    .select()
    .from(candidates)
    .where(and(eq(candidates.id, id), eq(candidates.userId, userId)));
  return candidate;
}

export async function createCandidate(data: NewCandidate) {
  const [candidate] = await db.insert(candidates).values(data).returning();
  return candidate;
}

export async function updateCandidate(id: string, userId: string, data: Partial<NewCandidate>) {
  const [candidate] = await db
    .update(candidates)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(candidates.id, id), eq(candidates.userId, userId)))
    .returning();
  return candidate;
}

export async function deleteCandidate(id: string, userId: string) {
  const [candidate] = await db
    .delete(candidates)
    .where(and(eq(candidates.id, id), eq(candidates.userId, userId)))
    .returning();
  return candidate;
}

export async function getUserInterviews(userId: string) {
  return db
    .select({
      id: interviews.id,
      identifier: interviews.identifier,
      candidateId: interviews.candidateId,
      scheduledFor: interviews.scheduledFor,
      status: interviews.status,
      metadata: interviews.metadata,
      candidateName: candidates.name,
      candidateEmail: candidates.email,
      recordingStartedAt: interviews.recordingStartedAt,
      recordingEndedAt: interviews.recordingEndedAt,
      recordingUrl: interviews.recordingUrl,
      duration: interviews.duration,
    })
    .from(interviews)
    .leftJoin(candidates, eq(interviews.candidateId, candidates.id))
    .where(eq(interviews.userId, userId))
    .orderBy(interviews.scheduledFor);
}

export async function createInterview(data: NewInterview) {
  const identifier = createId().slice(0, 8).toUpperCase(); // Generate a short, readable ID
  const [interview] = await db
    .insert(interviews)
    .values({ ...data, identifier })
    .returning();
  return interview;
}

export async function getInterview(id: string) {
  const [interview] = await db
    .select({
      id: interviews.id,
      candidateName: candidates.name,
      candidateEmail: candidates.email,
      scheduledFor: interviews.scheduledFor,
      status: interviews.status,
      recordingUrl: interviews.recordingUrl,
      recordingStartedAt: interviews.recordingStartedAt,
      recordingEndedAt: interviews.recordingEndedAt,
      duration: interviews.duration,
      code: interviews.code,
      language: interviews.language,
      problemDescription: interviews.problemDescription,
      messages: interviews.messages,
    })
    .from(interviews)
    .leftJoin(candidates, eq(interviews.candidateId, candidates.id))
    .where(eq(interviews.id, id));

  return interview;
}

export async function getInterviewByIdentifier(identifier: string) {
  const [interview] = await db
    .select({
      id: interviews.id,
      identifier: interviews.identifier,
      userId: interviews.userId,
      candidateId: interviews.candidateId,
      scheduledFor: interviews.scheduledFor,
      status: interviews.status,
      metadata: interviews.metadata,
      candidateName: candidates.name,
      candidateEmail: candidates.email,
      recordingStartedAt: interviews.recordingStartedAt,
      recordingEndedAt: interviews.recordingEndedAt,
      recordingUrl: interviews.recordingUrl,
      duration: interviews.duration,
    })
    .from(interviews)
    .leftJoin(candidates, eq(interviews.candidateId, candidates.id))
    .where(eq(interviews.identifier, identifier));
  return interview;
}

export async function updateInterview(id: string, data: Partial<NewInterview>) {
  const [interview] = await db
    .update(interviews)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(interviews.id, id))
    .returning();
  return interview;
}

export async function getInterviewMessages(interviewId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.interviewId, interviewId))
    .orderBy(messages.createdAt);
}

export async function addMessage(interviewId: string, role: 'user' | 'assistant', content: string) {
  const [message] = await db.insert(messages).values({ interviewId, role, content }).returning();
  return message;
}

export async function addCodeSubmission(interviewId: string, code: string, language: string) {
  const [submission] = await db
    .insert(codeSubmissions)
    .values({ interviewId, code, language })
    .returning();
  return submission;
}

export async function updateCodeSubmissionFeedback(
  id: string,
  isCorrect: boolean,
  feedback: string
) {
  const [submission] = await db
    .update(codeSubmissions)
    .set({ isCorrect, feedback })
    .where(eq(codeSubmissions.id, id))
    .returning();
  return submission;
}

export async function startRecording(interviewId: string) {
  return updateInterview(interviewId, {
    status: 'in_progress',
    recordingStartedAt: new Date(),
    isScreenRecorded: true,
    isAudioRecorded: true,
  });
}

export async function stopRecording(interviewId: string, recordingUrl: string) {
  const recordingEndedAt = new Date();
  const interview = await getInterview(interviewId);

  if (!interview || !interview.recordingStartedAt) {
    throw new Error('Interview not found or recording not started');
  }

  const duration = Math.floor(
    (recordingEndedAt.getTime() - interview.recordingStartedAt.getTime()) / 1000
  ).toString();

  return updateInterview(interviewId, {
    recordingEndedAt,
    recordingUrl,
    duration,
  });
}

export async function getProblems(userId: string) {
  return db.select().from(problems).where(eq(problems.userId, userId)).orderBy(problems.createdAt);
}

export async function getProblem(id: string, userId: string) {
  const [problem] = await db
    .select()
    .from(problems)
    .where(and(eq(problems.id, id), eq(problems.userId, userId)));
  return problem;
}

export async function createProblem(data: NewProblem) {
  const [problem] = await db.insert(problems).values(data).returning();
  return problem;
}

export async function updateProblem(id: string, userId: string, data: Partial<NewProblem>) {
  const [problem] = await db
    .update(problems)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(problems.id, id), eq(problems.userId, userId)))
    .returning();
  return problem;
}

export async function deleteProblem(id: string, userId: string) {
  const [problem] = await db
    .delete(problems)
    .where(and(eq(problems.id, id), eq(problems.userId, userId)))
    .returning();
  return problem;
}

export async function getMessages(interviewId: string) {
  const [interview] = await db
    .select({
      messages: interviews.messages,
    })
    .from(interviews)
    .where(eq(interviews.id, interviewId));

  if (!interview) {
    throw new Error('Interview not found');
  }

  return (interview.messages || []).map((msg) => ({
    role: msg.role === 'agent' ? 'assistant' : 'user',
    content: msg.message,
    timestamp: new Date(msg.time_in_call_secs * 1000).toISOString(),
  }));
}

export async function updateInterviewTranscript(
  interviewId: string,
  message: {
    role: 'user' | 'agent';
    message: string;
    time_in_call_secs: number;
  }
) {
  const [interview] = await db
    .select({
      transcript: interviews.transcript,
      messages: interviews.messages,
    })
    .from(interviews)
    .where(eq(interviews.id, interviewId));

  if (!interview) {
    throw new Error('Interview not found');
  }

  const transcript = [...(interview.transcript || []), message];
  const messages = [...(interview.messages || []), message];

  await db
    .update(interviews)
    .set({
      transcript,
      messages,
      updatedAt: new Date(),
    })
    .where(eq(interviews.id, interviewId));

  return { transcript, messages };
}
