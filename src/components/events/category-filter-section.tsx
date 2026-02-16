"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { CategoryPills } from "./category-pills";

export function CategoryFilterSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category");

  const handleSelect = useCallback(
    (slug: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) {
        params.set("category", slug);
      } else {
        params.delete("category");
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <CategoryPills
      selectedCategory={selectedCategory}
      onSelect={handleSelect}
    />
  );
}
