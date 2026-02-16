"use client";

import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Category = (typeof CATEGORIES)[number];

interface CategoryPillsProps {
  categories?: readonly Category[];
  selectedCategory?: string | null;
  onSelect: (slug: string | null) => void;
}

export function CategoryPills({
  categories = CATEGORIES,
  selectedCategory,
  onSelect,
}: CategoryPillsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
      role="tablist"
      aria-label="Filter events by category"
    >
      {/* "All" pill */}
      <button
        role="tab"
        aria-selected={!selectedCategory}
        onClick={() => onSelect(null)}
        className={cn(
          "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          !selectedCategory
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        All
      </button>

      {categories.map((category) => (
        <button
          key={category.slug}
          role="tab"
          aria-selected={selectedCategory === category.slug}
          onClick={() => onSelect(category.slug)}
          className={cn(
            "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            selectedCategory === category.slug
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <span aria-hidden="true">{category.icon}</span>
          {category.name}
        </button>
      ))}
    </div>
  );
}
