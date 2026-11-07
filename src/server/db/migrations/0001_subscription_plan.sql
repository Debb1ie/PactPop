ALTER TABLE "businesses" ADD COLUMN "plan" text DEFAULT 'solo' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "trial_ends_at" timestamp with time zone;