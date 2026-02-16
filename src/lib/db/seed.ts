import { db } from "./index";
import { categories } from "./schema";
import { createId } from "@paralleldrive/cuid2";

const CATEGORIES = [
  { name: "Concert", slug: "concerts", icon: "\uD83C\uDFB5", color: "#8B5CF6" },
  { name: "Comedy", slug: "comedy", icon: "\uD83D\uDE02", color: "#F59E0B" },
  { name: "Theater", slug: "theater", icon: "\uD83C\uDFAD", color: "#EF4444" },
  { name: "Festival", slug: "festivals", icon: "\uD83C\uDFAA", color: "#10B981" },
  { name: "Sports", slug: "sports", icon: "\u26BD", color: "#3B82F6" },
  { name: "Nightlife", slug: "nightlife", icon: "\uD83C\uDF19", color: "#EC4899" },
  { name: "Arts", slug: "arts", icon: "\uD83C\uDFA8", color: "#F97316" },
  { name: "Community", slug: "community", icon: "\uD83E\uDD1D", color: "#06B6D4" },
];

async function seed() {
  console.log("Seeding categories...");

  for (const cat of CATEGORIES) {
    await db
      .insert(categories)
      .values({
        id: createId(),
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        color: cat.color,
      })
      .onConflictDoNothing({ target: categories.slug });
  }

  console.log("Categories seeded.");
}

seed().catch(console.error);
