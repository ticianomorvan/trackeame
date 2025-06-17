import { ProviderHandler, ProviderSlug } from "../types/providers";

import { Worker } from "bullmq";

import { prisma } from "../lib/prisma";
import { connection } from "../lib/redis";

import { PackageEventStatus } from "../types/package-events";
import { PACKAGES_QUEUE_NAME, packagesQueue, PackagesQueueJobName, PackagesQueueJobPayload } from "../queues/packages";

import { trackCorreoArgentinoPackage } from "../services/integrations/correo-argentino";
import { trackAndreaniPackage } from "../services/integrations/andreani";

const providerHandlers: Record<ProviderSlug, ProviderHandler> = {
  [ProviderSlug.CORREO_ARGENTINO]: trackCorreoArgentinoPackage,
  [ProviderSlug.ANDREANI]: trackAndreaniPackage,
  [ProviderSlug.OCA]: async () => {
    throw new Error("OCA provider is not implemented yet.");
  }
}

const worker = new Worker(PACKAGES_QUEUE_NAME, async (job) => {
  switch (job.name) {
    case PackagesQueueJobName.SYNC_ALL_PACKAGES:
      const pendingPackages = await prisma.package.findMany({
        where: {
          OR: [
            { lastStatus: null },
            {
              lastStatus: {
                notIn: [
                  PackageEventStatus.Delivered,
                  PackageEventStatus.Cancelled,
                ]
              }
            },
          ]
        },
        include: { provider: true }
      })

      if (!pendingPackages || pendingPackages.length === 0) {
        console.log(`[${worker.name}] No pending packages to sync.`);
        
        return pendingPackages;
      }

      console.log(`[${worker.name}] Found ${pendingPackages.length} pending packages to sync.`);

      for (const pendingPackage of pendingPackages) {
        await packagesQueue.add(
          PackagesQueueJobName.FETCH_PACKAGE_EVENTS,
          {
            packageId: pendingPackage.id,
            providerSlug: pendingPackage.provider.slug as ProviderSlug,
            trackingCode: pendingPackage.trackingCode,
          } as PackagesQueueJobPayload[PackagesQueueJobName.FETCH_PACKAGE_EVENTS],
          {
            jobId: `${pendingPackage.provider.slug}-${pendingPackage.trackingCode}`,
            removeOnComplete: true,
            removeOnFail: false,
          }
        )
      }

      return pendingPackages;

    case PackagesQueueJobName.FETCH_PACKAGE_EVENTS:
      console.log(`[${worker.name}] Fetching package events for job ID: ${job.id}`);

      const {
        packageId,
        providerSlug,
        trackingCode
      } = job.data as PackagesQueueJobPayload[PackagesQueueJobName.FETCH_PACKAGE_EVENTS]

      const providerHandler = providerHandlers[providerSlug];

      if (!providerHandler) {
        throw new Error(`No handler found for provider slug: ${providerSlug}`);
      }

      const events = await providerHandler({ packageId, trackingCode })

      if (!events || !Array.isArray(events)) {
        throw new Error(`Provider handler did not return valid events for packageId: ${packageId}`);
      }

      return events;
    
    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
}, { connection })

worker.on("completed", (job) => {
  console.log(`[${worker.name}] Job (ID: ${job.id}) completed: ${job.name}.`);

  switch (job.name) {
    case PackagesQueueJobName.SYNC_ALL_PACKAGES:
      console.log(`[${worker.name}] Synced ${job.returnvalue.length} packages successfully.`);

      break;

    case PackagesQueueJobName.FETCH_PACKAGE_EVENTS:
      console.log(`[${worker.name}] Fetched ${job.returnvalue.length} package events for packageId: ${job.data.packageId}.`);
      
      break;
  }
});

worker.on("failed", (job, err) => {
  console.log(`[${worker.name}] Job failed: ${job?.id} - ${job?.name}.`);
  console.log(`[${worker.name}] Error: ${err.message || err}.`);
});

export default worker;