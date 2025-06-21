import { ProviderHandler, ProviderSlug } from "../types/providers";

import { Worker } from "bullmq";

import { prisma } from "../lib/prisma";
import { connection } from "../lib/redis";

import {
  PACKAGES_QUEUE_NAME,
  packagesQueue,
  PackagesQueueJobName,
  PackagesQueueJobPayload
} from "../queues/packages";

import { PackageEventStatus } from "../types/package-events";

import { sendNotificationEmail } from "../services/email";
import { trackAndreaniPackage } from "../services/integrations/andreani";
import { trackCorreoArgentinoPackage } from "../services/integrations/correo-argentino";

import { logger } from "./logger";

const providerHandlers: Record<ProviderSlug, ProviderHandler> = {
  [ProviderSlug.CORREO_ARGENTINO]: trackCorreoArgentinoPackage,
  [ProviderSlug.ANDREANI]: trackAndreaniPackage,
  [ProviderSlug.OCA]: async () => {
    throw new Error("OCA provider is not implemented yet.");
  }
}

export const worker = new Worker(PACKAGES_QUEUE_NAME, async (job) => {
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
        logger.info(`[${worker.name}] No pending packages to sync.`);

        return pendingPackages;
      }

      logger.info(`[${worker.name}] Found ${pendingPackages.length} pending packages to sync.`);

      for (const pendingPackage of pendingPackages) {
        await packagesQueue.add(PackagesQueueJobName.FETCH_PACKAGE_EVENTS,
          {
            packageId: pendingPackage.id
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
      logger.info(`[${worker.name}] Fetching package events for job ID: ${job.id}`);

      const { packageId } = job.data as PackagesQueueJobPayload[PackagesQueueJobName.FETCH_PACKAGE_EVENTS]

      const currentPackage = await prisma.package.findUnique({
        where: { id: packageId },
        include: {
          events: true,
          provider: true
        }
      });

      if (!currentPackage) {
        throw new Error(`Package with ID ${packageId} not found.`);
      }

      const providerSlug = currentPackage.provider.slug as ProviderSlug;

      const providerHandler = providerHandlers[providerSlug];

      if (!providerHandler) {
        throw new Error(`No handler found for provider slug: ${providerSlug}`);
      }

      const { trackingCode } = currentPackage;

      const events = await providerHandler({ packageId, trackingCode })

      if (!events || !Array.isArray(events)) {
        throw new Error(`Provider handler did not return valid events for packageId: ${packageId}`);
      }

      const updatedPackage = await prisma.package.findUnique({
        where: { id: packageId },
        include: {
          events: true,
          provider: true,
          user: true
        }
      });

      if (!updatedPackage) {
        throw new Error(`Package with ID ${packageId} not found after fetching events.`);
      }

      const hasUpdates =
        (currentPackage.lastStatus !== updatedPackage.lastStatus) ||
        (currentPackage.events.length < updatedPackage.events.length)

      if (hasUpdates) {
        logger.info(`[${worker.name}] Package ${updatedPackage.id} has updates. Notifying user.`);
        
        try {
          await sendNotificationEmail({
            toAddress: updatedPackage.user.email,
            data: {
              pkg: updatedPackage,
              provider: updatedPackage.provider
            }
          })
        } catch (error) {
          logger.error(`[${worker.name}] Failed to send notification email for package ${updatedPackage.id}: ${(error as Error).message}`);
        }
      }

      return events;
    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
}, { connection })