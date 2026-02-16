"use client";

import { useSyncExternalStore, useCallback } from "react";

/**
 * Subscribe to a CSS media query and return whether it currently matches.
 * Uses `useSyncExternalStore` to avoid the lint warning about calling
 * `setState` synchronously inside an effect, and safely returns `false`
 * during SSR via the server snapshot.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", callback);
      return () => media.removeEventListener("change", callback);
    },
    [query]
  );

  const getSnapshot = useCallback(() => {
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = useCallback(() => {
    return false;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
