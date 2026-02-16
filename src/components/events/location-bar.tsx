"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { useGeolocation, type GeoLocation } from "@/hooks/use-geolocation";

// ---------------------------------------------------------------------------
// Props — defaultLocation kept for backwards compatibility but the hook
// manages its own state via cookie / IP / env defaults.
// ---------------------------------------------------------------------------

interface LocationBarProps {
  defaultLocation?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function LocationBar(_props: LocationBarProps) {
  const {
    location,
    isLoading,
    error,
    requestBrowserLocation,
    setManualLocation,
  } = useGeolocation();

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input whenever the popover opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay so the popover animation settles before focusing
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Format display string
  const displayLocation = location.state
    ? `${location.city}, ${location.state}`
    : location.city;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleUseMyLocation() {
    requestBrowserLocation();
    setIsOpen(false);
  }

  function handleManualSubmit() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // For now, store the text as the city name with default coordinates.
    // A real geocoding step can be plugged in later to resolve coords.
    const manual: GeoLocation = {
      lat: location.lat, // keep current coords as a fallback
      lng: location.lng,
      city: trimmed,
      state: undefined,
    };

    setManualLocation(manual);
    setInputValue("");
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleManualSubmit();
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex items-center gap-2">
      <MapPin className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />

      <span className="text-sm text-muted-foreground">
        Events near{" "}
        <span className="font-medium text-foreground">
          {isLoading ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              Detecting...
            </span>
          ) : (
            displayLocation
          )}
        </span>
      </span>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="link"
            size="xs"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Change
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-72">
          <div className="flex flex-col gap-3">
            {/* Header */}
            <p className="text-sm font-medium">Change location</p>

            {/* Use my location */}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={handleUseMyLocation}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Navigation className="size-4" aria-hidden="true" />
              )}
              Use my location
            </Button>

            <div className="flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            {/* Manual entry */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="City, ST or ZIP code"
                className="h-8 text-sm"
                aria-label="Enter a city name or ZIP code"
              />
              <Button
                size="sm"
                onClick={handleManualSubmit}
                disabled={!inputValue.trim()}
              >
                Go
              </Button>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
