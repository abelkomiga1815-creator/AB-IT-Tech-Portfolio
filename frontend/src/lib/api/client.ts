import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./tokens";

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, data: unknown, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type QueryValue = string | number | boolean | undefined | null;
export type Query = Record<string, QueryValue>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  /** Attach the admin JWT (and transparently refresh it once on 401). */
  auth?: boolean;
  signal?: AbortSignal;
}

export const AUTH_EXPIRED_EVENT = "abit:auth-expired";

/** Browser requests use NEXT_PUBLIC_API_BASE_URL; server-side rendering may use API_INTERNAL_BASE_URL. */
export function apiBaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
  if (typeof window === "undefined") {
    return (process.env.API_INTERNAL_BASE_URL || publicUrl).replace(/\/$/, "");
  }
  return publicUrl.replace(/\/$/, "");
}

function buildUrl(path: string, query?: Query): string {
  const url = `${apiBaseUrl()}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function messageFrom(data: unknown, status: number): string {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    if (Array.isArray(record.detail)) return record.detail.map(String).join(" ");
    const first = Object.entries(record).find(([, v]) => Array.isArray(v) || typeof v === "string");
    if (first) {
      const [field, value] = first;
      const text = Array.isArray(value) ? value.map(String).join(" ") : String(value);
      return field === "non_field_errors" ? text : `${field.replace(/_/g, " ")}: ${text}`;
    }
  }
  if (status === 0) return "Cannot reach the server. Check your connection and try again.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "The requested item could not be found.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return "The server had a problem. Please try again shortly.";
  return "The request could not be completed.";
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(buildUrl("/auth/refresh/"), {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ refresh }),
        });
        if (!response.ok) return false;
        const data = (await response.json()) as { access: string; refresh?: string };
        setTokens(data.access, data.refresh);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const { method = "GET", body, query, auth = false, signal } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  try {
    return await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, null, messageFrom(null, 0));
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options);

  if (response.status === 401 && options.auth) {
    if (await refreshAccessToken()) {
      response = await send(path, options);
    }
    if (response.status === 401) {
      clearTokens();
      if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
  }

  const data = await parseBody(response);
  if (!response.ok) throw new ApiError(response.status, data, messageFrom(data, response.status));
  return data as T;
}
