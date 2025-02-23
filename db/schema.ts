import type { InferModel } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  boolean,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const interviewStatusEnum = pgEnum('interview_status', [
  'not_started',
  'in_progress',
  'completed',
  'cancelled',
  'abandoned',
]);

export const candidates = pgTable('candidates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Clerk user ID
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  status: text('status').notNull().default('active'),
  notes: text('notes'),
  resumeUrl: text('resume_url'),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const problems = pgTable('problems', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Clerk user ID
  title: text('title').notNull(),
  description: text('description').notNull(), // MDX content
  difficulty: text('difficulty').notNull(),
  sampleInput: text('sample_input'),
  sampleOutput: text('sample_output'),
  constraints: text('constraints'),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const interviews = pgTable('interviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull().unique(),
  userId: text('user_id').notNull(), // Clerk user ID
  candidateId: uuid('candidate_id')
    .references(() => candidates.id)
    .notNull(),
  problemId: uuid('problem_id')
    .references(() => problems.id)
    .notNull(),
  status: interviewStatusEnum('status').notNull().default('not_started'),
  scheduledFor: timestamp('scheduled_for').notNull(),
  problemDescription: text('problem_description').notNull(),
  code: text('code'),
  language: text('language').notNull(),
  recordingUrl: text('recording_url'),
  recordingStartedAt: timestamp('recording_started_at'),
  recordingEndedAt: timestamp('recording_ended_at'),
  duration: text('duration'),
  isScreenRecorded: boolean('is_screen_recorded').default(false),
  isAudioRecorded: boolean('is_audio_recorded').default(false),
  lastActiveAt: timestamp('last_active_at'),
  metadata: jsonb('metadata').default({}).notNull(),
  messages: jsonb('messages')
    .$type<
      {
        role: 'user' | 'agent';
        message: string;
        time_in_call_secs: number;
      }[]
    >()
    .default([]),
  transcript: jsonb('transcript')
    .$type<
      {
        role: 'user' | 'agent';
        message: string;
        time_in_call_secs: number;
      }[]
    >()
    .default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  interviewId: uuid('interview_id')
    .references(() => interviews.id)
    .notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const codeSubmissions = pgTable('code_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  interviewId: uuid('interview_id')
    .references(() => interviews.id)
    .notNull(),
  code: text('code').notNull(),
  language: text('language').notNull(),
  isCorrect: boolean('is_correct'),
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const evaluations = pgTable('evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  interviewId: uuid('interview_id')
    .references(() => interviews.id)
    .notNull(),
  candidateId: uuid('candidate_id')
    .references(() => candidates.id)
    .notNull(),
  technicalScore: numeric('technical_score').notNull(),
  communicationScore: numeric('communication_score').notNull(),
  overallScore: numeric('overall_score').notNull(),
  recommendation: text('recommendation').notNull(),
  reasoning: text('reasoning').notNull(),
  technicalStrengths: jsonb('technical_strengths').$type<string[]>().notNull(),
  technicalWeaknesses: jsonb('technical_weaknesses').$type<string[]>().notNull(),
  communicationStrengths: jsonb('communication_strengths').$type<string[]>().notNull(),
  communicationWeaknesses: jsonb('communication_weaknesses').$type<string[]>().notNull(),
  nextSteps: jsonb('next_steps').$type<string[]>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Candidate = InferModel<typeof candidates>;
export type Problem = InferModel<typeof problems>;
export type Interview = InferModel<typeof interviews>;
export type Evaluation = InferModel<typeof evaluations>;
export type Message = InferModel<typeof messages>;
export type CodeSubmission = InferModel<typeof codeSubmissions>;

export const candidateRelations = relations(candidates, ({ many }) => ({
  interviews: many(interviews),
  evaluations: many(evaluations),
}));

export const problemRelations = relations(problems, ({ many }) => ({
  interviews: many(interviews),
}));

export const interviewRelations = relations(interviews, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [interviews.candidateId],
    references: [candidates.id],
  }),
  problem: one(problems, {
    fields: [interviews.problemId],
    references: [problems.id],
  }),
  evaluations: many(evaluations),
  messages: many(messages),
  codeSubmissions: many(codeSubmissions),
}));

export const evaluationRelations = relations(evaluations, ({ one }) => ({
  interview: one(interviews, {
    fields: [evaluations.interviewId],
    references: [interviews.id],
  }),
  candidate: one(candidates, {
    fields: [evaluations.candidateId],
    references: [candidates.id],
  }),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  interview: one(interviews, {
    fields: [messages.interviewId],
    references: [interviews.id],
  }),
}));

export const codeSubmissionRelations = relations(codeSubmissions, ({ one }) => ({
  interview: one(interviews, {
    fields: [codeSubmissions.interviewId],
    references: [interviews.id],
  }),
}));
