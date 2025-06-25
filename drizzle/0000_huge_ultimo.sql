CREATE TABLE "candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"position" text NOT NULL,
	"phase" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'New' NOT NULL,
	"source" text DEFAULT 'LinkedIn' NOT NULL,
	"applied_date" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"resume_url" text,
	"linkedin_url" text,
	"skills" text,
	"experience" integer,
	"notes" text,
	CONSTRAINT "candidates_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "dashboard_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"total_candidates" integer DEFAULT 0 NOT NULL,
	"phase1_count" integer DEFAULT 0 NOT NULL,
	"phase2_count" integer DEFAULT 0 NOT NULL,
	"hired_count" integer DEFAULT 0 NOT NULL,
	"interviews_today" integer DEFAULT 0 NOT NULL,
	"sync_status" text DEFAULT 'synced' NOT NULL,
	"last_sync" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"type" text DEFAULT 'Phone' NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"duration" integer DEFAULT 60 NOT NULL,
	"interviewer" text NOT NULL,
	"status" text DEFAULT 'Scheduled' NOT NULL,
	"notes" text,
	"rating" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;