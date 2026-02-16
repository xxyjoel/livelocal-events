"use client";

import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { Filter, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CATEGORIES, DISTANCE_OPTIONS } from "@/lib/constants";

const DATE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "This Weekend", value: "this-weekend" },
  { label: "This Week", value: "this-week" },
  { label: "This Month", value: "this-month" },
] as const;

const SORT_OPTIONS = [
  { label: "Date", value: "date" },
  { label: "Distance", value: "distance" },
  { label: "Price", value: "price" },
] as const;

export function EventFilters() {
  const nuqsOptions = { shallow: false } as const;

  const [category, setCategory] = useQueryState(
    "category",
    parseAsString.withOptions(nuqsOptions)
  );
  const [date, setDate] = useQueryState(
    "date",
    parseAsString.withOptions(nuqsOptions)
  );
  const [distance, setDistance] = useQueryState(
    "distance",
    parseAsInteger.withDefault(25).withOptions(nuqsOptions)
  );
  const [minPrice, setMinPrice] = useQueryState(
    "minPrice",
    parseAsInteger.withOptions(nuqsOptions)
  );
  const [maxPrice, setMaxPrice] = useQueryState(
    "maxPrice",
    parseAsInteger.withOptions(nuqsOptions)
  );
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsString.withDefault("date").withOptions(nuqsOptions)
  );

  const hasActiveFilters =
    category || date || distance !== 25 || minPrice || maxPrice || sort !== "date";

  function handleClearAll() {
    setCategory(null);
    setDate(null);
    setDistance(null);
    setMinPrice(null);
    setMaxPrice(null);
    setSort(null);
  }

  return (
    <div className="space-y-4">
      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            onClick={() =>
              setCategory(category === cat.slug ? null : cat.slug)
            }
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              category === cat.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <span aria-hidden="true">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      <Separator />

      {/* Filter Row */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Date Filter */}
        <div className="w-full sm:w-auto">
          <Label className="mb-1.5 block text-xs text-muted-foreground">
            When
          </Label>
          <Select
            value={date ?? "any"}
            onValueChange={(v) => setDate(v === "any" ? null : v)}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Any date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any date</SelectItem>
              {DATE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Distance Filter */}
        <div className="w-full sm:w-auto">
          <Label className="mb-1.5 block text-xs text-muted-foreground">
            Distance
          </Label>
          <Select
            value={String(distance)}
            onValueChange={(v) => setDistance(Number(v))}
          >
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISTANCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Filters */}
        <div className="w-full sm:w-auto">
          <Label className="mb-1.5 block text-xs text-muted-foreground">
            Min Price ($)
          </Label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={minPrice ?? ""}
            onChange={(e) =>
              setMinPrice(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full sm:w-[100px]"
          />
        </div>

        <div className="w-full sm:w-auto">
          <Label className="mb-1.5 block text-xs text-muted-foreground">
            Max Price ($)
          </Label>
          <Input
            type="number"
            min={0}
            placeholder="Any"
            value={maxPrice ?? ""}
            onChange={(e) =>
              setMaxPrice(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full sm:w-[100px]"
          />
        </div>

        {/* Sort */}
        <div className="w-full sm:w-auto">
          <Label className="mb-1.5 block text-xs text-muted-foreground">
            Sort by
          </Label>
          <Select
            value={sort}
            onValueChange={(v) => setSort(v === "date" ? null : v)}
          >
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="gap-1.5 text-muted-foreground"
          >
            <X className="size-4" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
