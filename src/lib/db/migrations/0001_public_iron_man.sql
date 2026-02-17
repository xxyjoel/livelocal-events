CREATE TYPE "public"."event_source_auth_method" AS ENUM('api_key', 'oauth2', 'scraping', 'rss', 'none');--> statement-breakpoint
CREATE TYPE "public"."event_source_platform" AS ENUM('ticketmaster', 'seatgeek', 'facebook', 'instagram', 'reddit', 'twitter', 'threads', 'company_website', 'other');--> statement-breakpoint
CREATE TYPE "public"."event_source_type" AS ENUM('api', 'scraper', 'feed', 'manual');--> statement-breakpoint
CREATE TABLE "event_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "event_source_type" NOT NULL,
	"platform" "event_source_platform" NOT NULL,
	"base_url" text,
	"api_docs_url" text,
	"auth_method" "event_source_auth_method",
	"is_active" boolean DEFAULT false NOT NULL,
	"sync_frequency" text,
	"last_sync_at" timestamp with time zone,
	"last_sync_error" text,
	"total_events_synced" integer DEFAULT 0 NOT NULL,
	"config" jsonb,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "event_sources_name_unique" UNIQUE("name"),
	CONSTRAINT "event_sources_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "event_sources_slug_idx" ON "event_sources" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "event_sources_platform_idx" ON "event_sources" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "event_sources_is_active_idx" ON "event_sources" USING btree ("is_active");