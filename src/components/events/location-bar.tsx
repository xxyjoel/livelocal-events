"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, X, Check } from "lucide-react";

interface LocationBarProps {
  defaultLocation?: string;
}

export function LocationBar({ defaultLocation = "New York, NY" }: LocationBarProps) {
  const [location, setLocation] = useState(defaultLocation);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(location);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function handleSave() {
    const trimmed = inputValue.trim();
    if (trimmed) {
      setLocation(trimmed);
    }
    setIsEditing(false);
  }

  function handleCancel() {
    setInputValue(location);
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <MapPin className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />

      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="City, ST or ZIP code"
            className="h-8 w-48 text-sm"
            aria-label="Enter your city or ZIP code"
          />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleSave}
            aria-label="Save location"
          >
            <Check className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleCancel}
            aria-label="Cancel"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Events near{" "}
            <span className="font-medium text-foreground">{location}</span>
          </span>
          <Button
            variant="link"
            size="xs"
            onClick={() => {
              setInputValue(location);
              setIsEditing(true);
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Change
          </Button>
        </div>
      )}
    </div>
  );
}
