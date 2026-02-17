import { runEventSync } from "../src/lib/sync/scheduler";

async function main() {
  console.log("Starting event sync...\n");
  const result = await runEventSync();
  console.log("\n=== SYNC RESULTS ===");
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
