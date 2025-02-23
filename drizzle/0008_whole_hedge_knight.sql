ALTER TABLE "interviews" ADD COLUMN "messages" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "transcript" jsonb DEFAULT '[]'::jsonb;