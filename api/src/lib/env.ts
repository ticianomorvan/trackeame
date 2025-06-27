import { z } from "zod";

const envSchema = z.object({
  HOST: z.string().default("localhost"),
  PORT: z.coerce.number().default(8000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  CORS_ORIGIN: z.string().default("*"),

  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),

  RESEND_API_KEY: z.string(),
  RESEND_SOURCE_ADDRESS: z.string().email(),

  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().url().default("postgres://postgres:postgres@localhost:5432/trackeame"),
})

export const env = envSchema.parse(process.env);