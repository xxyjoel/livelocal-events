import { seedSeattleVenues } from "../src/lib/db/seed/seattle-venues";
import { seedDiscoveryData } from "../src/lib/db/seed/discovery-data";

async function main() {
  console.log("Starting Seattle venue seed...");
  const count = await seedSeattleVenues();
  console.log(`Done. ${count} venue(s) seeded.`);

  console.log("\nStarting discovery data seed...");
  await seedDiscoveryData();

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
