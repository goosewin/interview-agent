ALTER TABLE "interviews" ADD COLUMN "candidate_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "scheduled_for" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;