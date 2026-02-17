ALTER TABLE "venues" ADD COLUMN "last_scraped_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "last_scrape_error" text;