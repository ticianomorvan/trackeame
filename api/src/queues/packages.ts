import type { ProviderSlug } from "../types/providers";

import { Queue } from "bullmq";

import { connection } from "../lib/redis";

export const PACKAGES_QUEUE_NAME = "packages";
export const PACKAGES_SCHEDULER_NAME = "packages-scheduler";

export enum PackagesQueueJobName {
  SYNC_ALL_PACKAGES = "sync-all-packages",
  FETCH_PACKAGE_EVENTS = "fetch-package-events",
}

export interface PackagesQueueJobPayload {
  [PackagesQueueJobName.SYNC_ALL_PACKAGES]: {};

  [PackagesQueueJobName.FETCH_PACKAGE_EVENTS]: {
    packageId: string;
    providerSlug: ProviderSlug;
    trackingCode: string;
  };
}

export const packagesQueue = new Queue(PACKAGES_QUEUE_NAME, { connection })

// We'll sync all undelivered packages every 30 minutes.
packagesQueue.upsertJobScheduler(
  PACKAGES_SCHEDULER_NAME,
  { pattern: "*/30 * * * *" }, 
  { name: PackagesQueueJobName.SYNC_ALL_PACKAGES, data: {} }
)