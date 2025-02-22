import { boolean, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const interviewStatusEnum = pgEnum('interview_status', [
  'not_started',
  'in_progress',
  'completed',
  'cancelled',
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
  description: text('description').notNull(),
  difficulty: text('difficulty').notNull(),
  sampleInput: text('sample_input'),
  sampleOutput: text('sample_output'),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const interviews = pgTable('interviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Clerk user ID
  candidateId: uuid('candidate_id')
    .references(() => candidates.id)
    .notNull(),
  problemId: uuid('problem_id')
    .references(() => problems.id),
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
  metadata: jsonb('metadata').default({}).notNull(),
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
