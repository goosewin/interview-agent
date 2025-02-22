import { db } from '@/db';
import { codeSubmissions, interviews, messages, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type NewInterview = typeof interviews.$inferInsert;
export type Interview = typeof interviews.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type CodeSubmission = typeof codeSubmissions.$inferSelect;
export type User = typeof users.$inferSelect;

export async function getOrCreateUser(clerkId: string, email: string, name?: string) {
  // First try to get the user
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, clerkId));

  if (existingUser) {
    return existingUser;
  }

  // If user doesn't exist, create them
  const [newUser] = await db
    .insert(users)
    .values({
      id: clerkId,
      email,
      name,
    })
    .returning();

  return newUser;
}

export async function getUserInterviews(userId: string) {
  return db
    .select()
    .from(interviews)
    .where(eq(interviews.userId, userId))
    .orderBy(interviews.createdAt);
}

export async function createInterview(data: NewInterview) {
  const [interview] = await db.insert(interviews).values(data).returning();
  return interview;
}

export async function getInterview(id: string) {
  const [interview] = await db
    .select()
    .from(interviews)
    .where(eq(interviews.id, id));
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

export async function addMessage(
  interviewId: string,
  role: 'user' | 'assistant',
  content: string
) {
  const [message] = await db
    .insert(messages)
    .values({ interviewId, role, content })
    .returning();
  return message;
}

export async function addCodeSubmission(
  interviewId: string,
  code: string,
  language: string
) {
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
