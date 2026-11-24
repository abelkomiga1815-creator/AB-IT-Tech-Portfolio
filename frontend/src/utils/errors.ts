import { ApiError } from "@/lib/api/client";

/** Human readable message for any thrown value. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Flatten DRF validation errors ({ field: ["msg"] }) into { field: "msg" }. */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || typeof error.data !== "object" || error.data === null || Array.isArray(error.data)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(error.data as Record<string, unknown>)) {
    if (key === "detail") continue;
    if (Array.isArray(value)) result[key] = value.map(String).join(" ");
    else if (typeof value === "string") result[key] = value;
  }
  return result;
}
