import { pgTable, text, timestamp, uuid, jsonb  } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const interviews = pgTable('interviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  problemDescription: text('problem_description').notNull(),
  code: text('code'),
  language: text('language').notNull(),
  messages: jsonb('messages').$type<{
    role: 'user' | 'agent';
    message: string;
    time_in_call_secs: number;
  }[]>().default([]),
  transcript: jsonb('transcript').$type<{
    role: 'user' | 'agent';
    message: string;
    time_in_call_secs: number;
  }[]>().default([]),
  recordingUrl: text('recording_url'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
