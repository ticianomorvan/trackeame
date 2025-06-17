import type { CustomResponse } from "types/response";

const API_URL = typeof import.meta.env.VITE_API_UR !== "undefined" && import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : "http://localhost:8000";

const defaultConfig: RequestInit = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
}

export async function fetcher<T>(endpoint: string, config: RequestInit = defaultConfig): Promise<CustomResponse<T>> {
  const response = await fetch(API_URL.concat(endpoint), {
    ...defaultConfig,
    ...config,
    headers: {
      ...defaultConfig.headers,
      ...config.headers,
    },
  });

  const result: CustomResponse<T> = await response.json();

  return result;
}