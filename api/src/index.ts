import "dotenv/config";

import Fastify from "fastify"
import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifyApiReference from "@scalar/fastify-api-reference";
import fastifyAuth0Api from "@auth0/auth0-fastify-api"

import { env } from "./lib/env";

import authenticateAndUpsertUser from "./plugins/authenticate-and-upsert-user";

// Routes
import packagesRoutes from "./routes/packages";
import providersRoutes from "./routes/providers";

const fastify = Fastify({ logger: true })

fastify.register(fastifyCors, {
  origin: env.CORS_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Length", "X-Total-Count"],
  credentials: true,
})

fastify.register(fastifyAuth0Api, {
  domain: env.AUTH0_DOMAIN,
  audience: env.AUTH0_AUDIENCE,
})

fastify.register(authenticateAndUpsertUser)

fastify.register(fastifySwagger, {
  openapi: {
    openapi: "3.0.0",
    info: {
      title: "Trackealo API",
      description: "API for tracking packages from various providers",
      version: "1.0.0",
    },
    servers: [
      {
        url: `http://localhost:8000`,
        description: "Development server"
      }
    ],
    tags: [
      { name: "Packages", description: "Operations related to package tracking" },
      { name: "Providers", description: "Operations related to package providers" }
    ],
  }
})

fastify.register(fastifyApiReference, {
  routePrefix: "/reference"
})

fastify.register(packagesRoutes)
fastify.register(providersRoutes)

async function initializeServer() {
  try {
    await fastify.listen({
      host: env.HOST,
      port: env.PORT,
    })
  } catch (error) {
    fastify.log.error(error)
    process.exit(1)
  }
}

initializeServer()

