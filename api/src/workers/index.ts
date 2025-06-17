import "dotenv/config";

import { Worker } from "bullmq";

import packagesWorker from "./packages";

const workers: Worker[] = [packagesWorker]

console.log("[system] Initializing workers...")

async function terminateWorkers() {
  await Promise.all(workers.map(async (worker) => {
    try {
      await worker.close();

      console.log(`[${worker.name}] Worker has been closed successfully.`);
    } catch (error) {
      console.error(`[${worker.name}] Failed to close worker:`, error);
    }
  }));
}

process.on("SIGINT", async () => {
  console.log("[system] SIGINT received. Shutting down workers...");

  await terminateWorkers();

  console.log("[system] All workers have been shut down.");
  process.exit(0);
})

process.on("SIGTERM", async () => {
  console.log("[system] SIGTERM received. Shutting down workers...");

  await terminateWorkers()

  console.log("[system] All workers have been shut down.");

  process.exit(0);
})

process.on("uncaughtException", async (error) => {
  console.error("[system] Uncaught Exception:", error);
  console.error("[system] Shutting down workers due to uncaught exception...");

  await terminateWorkers();

  process.exit(1);
})

if (workers.every((worker) => worker.isRunning())) {
  console.log("[system] Workers initialized and running successfully. Press Ctrl+C to exit.");
}