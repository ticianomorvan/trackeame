import "dotenv/config";

import Fastify from "fastify"
import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifyApiReference from "@scalar/fastify-api-reference";

// Helpers
import { env } from "./lib/env";

// Plugins
import firebasePlugin from "./plugins/firebase";

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

fastify.register(
  fastifyApiReference,
  { routePrefix: "/reference" }
)

fastify.register(firebasePlugin)

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

