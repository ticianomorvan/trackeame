import { z } from "zod";

const envSchema = z.object({
  HOST: z.string().default("localhost"),
  PORT: z.coerce.number().default(8000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  CORS_ORIGIN: z.string().default("*"),

  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),

  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string({ required_error: "AWS_ACCESS_KEY_ID is required"}),
  AWS_SECRET_ACCESS_KEY: z.string({ required_error: "AWS_SECRET_ACCESS_KEY is required" }),
  AWS_SES_SOURCE_ADDRESS: z.string({ required_error: "AWS_SES_SOURCE_ADDRESS is required"})
    .email("AWS`_SES_SOURCE_ADDRESS must be a valid email address"),

  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().url().default("postgres://postgres:postgres@localhost:5432/trackeame"),
})

export const env = envSchema.parse(process.env);