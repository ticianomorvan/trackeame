import { z } from "zod";

export const envSchema = z.object({
  VITE_API_URL: z.string(),
  VITE_ANALYTICS_URL: z.string().optional(),
  VITE_ANALYTICS_WEBSITE_ID: z.string().optional(),
  VITE_FIREBASE_API_KEY: z.string(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string(),
  VITE_FIREBASE_PROJECT_ID: z.string(),
  VITE_FIREBASE_STORAGE_BUCKET: z.string(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string(),
  VITE_FIREBASE_APP_ID: z.string(),
  VITE_FIREBASE_MEASUREMENT_ID: z.string(),
})

export const env = envSchema.parse(import.meta.env);
