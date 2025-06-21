import "dotenv/config";

import { Worker } from "bullmq";

import { logger } from "./logger";
import { worker as packagesWorker } from "./packages";

const workers: Worker[] = [packagesWorker]

logger.info("[system] Initializing workers...");

async function terminateWorkers() {
  await Promise.all(workers.map(async (worker) => {
    try {
      await worker.close();

      logger.info(`[${worker.name}] Worker has been closed successfully.`);
    } catch (error) {
      logger.error(`[${worker.name}] Failed to close worker:`, error);
    }
  }));
}

process.on("SIGINT", async () => {
  logger.info("[system] SIGINT received. Shutting down workers...");

  await terminateWorkers();

  logger.info("[system] All workers have been shut down.");
  process.exit(0);
})

process.on("SIGTERM", async () => {
  logger.info("[system] SIGTERM received. Shutting down workers...");

  await terminateWorkers()

  logger.info("[system] All workers have been shut down.");

  process.exit(0);
})

process.on("uncaughtException", async (error) => {
  logger.error("[system] Uncaught Exception:", error);
  logger.error("[system] Shutting down workers due to uncaught exception...");

  await terminateWorkers();

  process.exit(1);
})

for (const worker of workers) {
  worker.on("ready", () => {
    logger.info(`[${worker.name}] Worker is ready.`);
  });

  worker.on("error", (error) => {
    logger.error(`[${worker.name}] Worker error:`, error);
  });

  worker.on("active", (job) => {
    logger.info(`[${worker.name}] Job ${job.id} is now active.`);
  });

  worker.on("completed", (job, returnValue) => {
    logger.info(`[${worker.name}] Job ${job.id} completed successfully.`, returnValue);
  });

  worker.on("failed", (job, err) => {
    logger.error(`[${worker.name}] Job ${job?.id ?? ""} failed with error:`, err);
  });
}

if (workers.every((worker) => worker.isRunning())) {
  logger.info("[system] All workers are running successfully.");
}