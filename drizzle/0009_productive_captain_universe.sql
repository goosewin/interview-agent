ALTER TYPE "public"."interview_status" ADD VALUE 'abandoned';--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "last_active_at" timestamp;