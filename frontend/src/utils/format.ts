import type { ProjectStatus } from "@/types/api";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  maintenance: "Maintenance",
  concept: "Concept",
};

export function formatDate(value: string | null | undefined, withDay = false): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    ...(withDay ? { day: "numeric" } : {}),
    timeZone: "UTC",
  }).format(date);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function initials(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
