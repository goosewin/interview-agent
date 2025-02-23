ALTER TABLE "interviews" ADD COLUMN "identifier" text NOT NULL;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_identifier_unique" UNIQUE("identifier");