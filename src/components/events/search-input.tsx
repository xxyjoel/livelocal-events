"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useQueryState, parseAsString } from "nuqs";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";

export function SearchInput() {
  const [q, setQ] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ shallow: false })
  );

  const [localValue, setLocalValue] = useState(q);
  const debouncedValue = useDebounce(localValue, 300);

  // Sync debounced value to URL
  useEffect(() => {
    if (debouncedValue !== q) {
      setQ(debouncedValue || null);
    }
  }, [debouncedValue, q, setQ]);

  // Sync URL changes back to local state (e.g. browser back/forward)
  useEffect(() => {
    setLocalValue(q);
  }, [q]);

  const handleClear = useCallback(() => {
    setLocalValue("");
    setQ(null);
  }, [setQ]);

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search events, venues, artists..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="h-12 pl-10 pr-10 text-base md:text-lg"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
