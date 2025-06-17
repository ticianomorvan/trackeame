import { ResponseType, SuccessfulResponse, type FailedResponse } from "../types/response";

import { FastifyPluginAsync } from "fastify";

import { Package } from "../generated/prisma";
import { getPackageEvents } from "../services/package-events";
import { createPackage, getPackages, getPackageById, getPackagesCount } from "../services/packages";
import { packagesQueue, PackagesQueueJobName, PackagesQueueJobPayload } from "../queues/packages";

const packagesRoutes: FastifyPluginAsync = async (fastify) => {
  // TODO: implement validation for providerSlug and trackingCode
  fastify.post("/packages", { preHandler: [fastify.requireAuth(), fastify.authenticateAndUpsertUser] }, async (request, reply) => {
    const user = request.internal_user;

    if (!user) {
      return reply.status(401).send({
        status: ResponseType.Error,
        message: "User not authenticated",
      } satisfies FailedResponse);
    }

    const {
      providerSlug,
      trackingCode
    } = request.body as {
      providerSlug: string
      trackingCode: string
    }

    try {
      const packageEntry = await createPackage(user.id, providerSlug, trackingCode);

      // We upsert a job to fetch package events immediately after creating the package entry.
      // After this initial fetch, the package events will be updated periodically by the queue worker.
      await packagesQueue.add(
        PackagesQueueJobName.FETCH_PACKAGE_EVENTS,
        {
          packageId: packageEntry.id,
          providerSlug: packageEntry.provider.slug,
          trackingCode: packageEntry.trackingCode,
        } as PackagesQueueJobPayload[PackagesQueueJobName.FETCH_PACKAGE_EVENTS],
        {
          jobId: `${packageEntry.provider.slug}-${packageEntry.trackingCode}-initial-fetch`,
          removeOnComplete: true,
          removeOnFail: false,
        }
      )

      return reply.status(201).send({
        status: ResponseType.Success,
        message: "Package entry created successfully",
        data: packageEntry
      } satisfies SuccessfulResponse<Package>
      );
    } catch (error) {
      fastify.log.error("Error creating package entry:", error);

      return reply.status(500).send({
        status: ResponseType.Error,
        message: (error as Error).message || "Failed to create package entry",
      } satisfies FailedResponse);
    }
  })

  fastify.get("/packages", { preHandler: [fastify.requireAuth(), fastify.authenticateAndUpsertUser] }, async (request, reply) => {
    const user = request.internal_user;

    if (!user) {
      return reply.status(401).send({
        status: ResponseType.Error,
        message: "User not authenticated",
      } satisfies FailedResponse);
    }

    const { limit, page } = request.query as { limit?: string; page?: string };

    const queryLimit = Math.min(Number(limit) || 10, 100);
    const queryPage = Math.max(Number(page) || 1, 1);

    try {
      const packages = await getPackages(user.id, queryLimit, queryPage);
      const packageCount = await getPackagesCount(user.id);

      return reply.status(200).send({
        status: ResponseType.Success,
        message: "Package entries retrieved successfully",
        data: {
          packages,
          total: packageCount,
          limit: queryLimit,
          page: queryPage,
        },
      } satisfies SuccessfulResponse<{
          packages: Package[];
          total: number;
          limit: number;
          page: number;
        }>
      );
    } catch (error) {
      fastify.log.error("Error retrieving package entries:", error);

      return reply.status(500).send({
        status: ResponseType.Error,
        message: (error as Error).message || "Failed to retrieve package entries",
      } satisfies FailedResponse);
    }
  })

  // TODO: implement validation for id
  fastify.get("/packages/:id", { preHandler: [fastify.requireAuth(), fastify.authenticateAndUpsertUser] }, async (request, reply) => {
    const user = request.internal_user;

    if (!user) {
      return reply.status(401).send({
        status: ResponseType.Error,
        message: "User not authenticated",
      } satisfies FailedResponse);
    }

    const { id } = request.params as { id: string };

    try {
      const packageEntry = await getPackageById(user.id, id);

      return reply.status(200).send({
        status: ResponseType.Success,
        message: "Package entry retrieved successfully",
        data: packageEntry,
      } satisfies SuccessfulResponse<typeof packageEntry>);
    } catch (error) {
      fastify.log.error("Error retrieving package entry:", error);

      return reply.status(500).send({
        status: ResponseType.Error,
        message: (error as Error).message || "Failed to retrieve package entry",
      } satisfies FailedResponse);
    }
  })

  // TODO: implement validation for id
  fastify.get("/packages/:id/tracking", async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      const packageEvents = await getPackageEvents(id);

      return reply.status(200).send({
        status: ResponseType.Success,
        message: "Package events retrieved successfully",
        data: packageEvents,
      } satisfies SuccessfulResponse<typeof packageEvents>);
    } catch (error) {
      fastify.log.error("Error retrieving package events:", error);

      return reply.status(500).send({
        status: ResponseType.Error,
        message: (error as Error).message || "Failed to retrieve package events",
      } satisfies FailedResponse);
    }
  })
}

export default packagesRoutes;