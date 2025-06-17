import { z } from "zod";

export const envSchema = z.object({
  VITE_API_URL: z.string().url().default("http://localhost:8000"),
  VITE_AUTH0_DOMAIN: z.string(),
  VITE_AUTH0_AUDIENCE: z.string(),
  VITE_AUTH0_CLIENT_ID: z.string(),
})

export const env = envSchema.parse(import.meta.env);