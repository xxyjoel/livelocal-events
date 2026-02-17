CREATE TABLE "search_queries" (
	"id" text PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"metro" text NOT NULL,
	"category" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"results_count" integer DEFAULT 0,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "search_queries_query_metro_unique" UNIQUE("query","metro")
);
--> statement-breakpoint
CREATE INDEX "search_queries_metro_idx" ON "search_queries" USING btree ("metro");--> statement-breakpoint
CREATE INDEX "search_queries_is_active_idx" ON "search_queries" USING btree ("is_active");