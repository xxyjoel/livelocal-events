"use client";

import { useState } from "react";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

/** Check if a date param is a specific YYYY-MM-DD date string */
function isSpecificDate(value: string | null): boolean {
  return value != null && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Format a specific date for display */
function formatSpecificDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return format(new Date(year, month - 1, day), "MMM d, yyyy");
}

const SORT_OPTIONS = [
  { label: "Date", value: "date" },
  { label: "Distance", value: "distance" },
  { label: "Price", value: "price" },
] as const;

export function EventFilters() {
  const nuqsOptions = { shallow: false } as const;
  const [calendarOpen, setCalendarOpen] = useState(false);

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
          <div className="flex gap-2">
            <Select
              value={isSpecificDate(date) ? "pick-date" : (date ?? "any")}
              onValueChange={(v) => {
                if (v === "any") {
                  setDate(null);
                  setCalendarOpen(false);
                } else if (v === "pick-date") {
                  setCalendarOpen(true);
                } else {
                  setDate(v);
                  setCalendarOpen(false);
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Any date">
                  {isSpecificDate(date) ? formatSpecificDate(date!) : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any date</SelectItem>
                {DATE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
                <SelectItem value="pick-date">
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="size-3.5" />
                    Pick a date
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Calendar popover for specific date */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={isSpecificDate(date) ? "border-primary text-primary" : ""}
                  aria-label="Pick a specific date"
                >
                  <CalendarIcon className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={isSpecificDate(date) ? new Date(date! + "T00:00:00") : undefined}
                  onSelect={(day) => {
                    if (day) {
                      const yyyy = day.getFullYear();
                      const mm = String(day.getMonth() + 1).padStart(2, "0");
                      const dd = String(day.getDate()).padStart(2, "0");
                      setDate(`${yyyy}-${mm}-${dd}`);
                    } else {
                      setDate(null);
                    }
                    setCalendarOpen(false);
                  }}
                  disabled={{ before: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>
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
