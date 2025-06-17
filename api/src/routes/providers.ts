import { FailedResponse, ResponseType, SuccessfulResponse } from "../types/response";

import { FastifyPluginAsync } from "fastify";
import { getProviders, getProviderBySlug } from "../services/providers";

const providersRoutes: FastifyPluginAsync = async (fastify) => {
  // Note: there's no provider creation endpoint, as we'll incrementally add providers as we support them.

  fastify.get("/providers", async (request, reply) => {
    try {
      const providers = await getProviders();

      return reply.status(200).send({
        status: ResponseType.Success,
        message: "Providers retrieved successfully",
        data: providers,
      } satisfies SuccessfulResponse<typeof providers>);
    } catch (error) {
      fastify.log.error("Error retrieving providers:", error);

      return reply.status(500).send({
        status: ResponseType.Error,
        message: (error as Error).message || "Failed to retrieve providers",
      } satisfies FailedResponse);
    }
  })

  // TODO: implement validation for providerSlug
  fastify.get("/providers/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string }

    try {
      const provider = await getProviderBySlug(slug);

      return reply.status(200).send({
        status: ResponseType.Success,
        message: "Provider retrieved successfully",
        data: provider,
      } satisfies SuccessfulResponse<typeof provider>);
    } catch (error) {
      fastify.log.error("Error retrieving provider:", error);

      return reply.status(500).send({
        status: ResponseType.Error,
        message: (error as Error).message || "Failed to retrieve provider",
      } satisfies FailedResponse);
    }
  })
}

export default providersRoutes;