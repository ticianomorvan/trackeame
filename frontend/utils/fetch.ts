import type { CustomResponse } from "types/response";

const API_URL = typeof import.meta.env.VITE_API_URL !== "undefined" && import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : "http://localhost:8000";

const defaultConfig: RequestInit = {
  method: "GET",
}

export async function fetcher<T>(endpoint: string, config: RequestInit = defaultConfig): Promise<CustomResponse<T>> {
  const response = await fetch(API_URL.concat(endpoint), {
    ...defaultConfig,
    ...config,
    headers: { ...config.headers, },
  });

  const result: CustomResponse<T> = await response.json();

  return result;
}
