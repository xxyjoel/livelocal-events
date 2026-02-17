import { seedSeattleVenues } from "../src/lib/db/seed/seattle-venues";
import {
  seedDiscoveryData,
  resetDiscoveryData,
  seedCategories,
  clearFabricatedEvents,
} from "../src/lib/db/seed/discovery-data";

const isReset = process.argv.includes("--reset");
const isClearFake = process.argv.includes("--clear-fake");

async function main() {
  if (isClearFake) {
    // Remove all fabricated events/artists/venues but keep categories
    console.log("Ensuring categories exist...");
    await seedCategories();

    console.log("\nClearing fabricated (non-synced) data...");
    await clearFabricatedEvents();

    console.log("\nDone. Categories preserved, fabricated data removed.");
    process.exit(0);
  }

  console.log("Starting Seattle venue seed...");
  const count = await seedSeattleVenues();
  console.log(`Done. ${count} venue(s) seeded.`);

  if (isReset) {
    console.log("\nResetting and re-seeding discovery data...");
    await resetDiscoveryData();
  } else {
    console.log("\nStarting discovery data seed...");
    await seedDiscoveryData();
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
