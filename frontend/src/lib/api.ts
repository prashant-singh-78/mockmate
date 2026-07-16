import { demoApi, DemoApiError } from "./demoApi";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (DEMO_MODE) {
    try {
      return await demoApi<T>(path, options);
    } catch (error) {
      if (error instanceof DemoApiError) throw new ApiError(error.message, error.status);
      throw error;
    }
  }

  const response = await fetch(`${API_BASE}/api/v1${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Something went wrong" }));
    throw new ApiError(body.detail || "Something went wrong", response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
