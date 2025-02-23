CREATE TABLE "evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"technical_score" numeric NOT NULL,
	"communication_score" numeric NOT NULL,
	"overall_score" numeric NOT NULL,
	"recommendation" text NOT NULL,
	"reasoning" text NOT NULL,
	"technical_strengths" jsonb NOT NULL,
	"technical_weaknesses" jsonb NOT NULL,
	"communication_strengths" jsonb NOT NULL,
	"communication_weaknesses" jsonb NOT NULL,
	"next_steps" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;