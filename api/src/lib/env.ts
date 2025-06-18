import { z } from "zod";

const envSchema = z.object({
  HOST: z.string().default("localhost"),
  PORT: z.coerce.number().default(8000),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  CORS_ORIGIN: z.string().default("*"),
  DATABASE_URL: z.string().url().default("postgres://postgres:postgres@localhost:5432/trackealo"),
})

export const env = envSchema.parse(process.env);