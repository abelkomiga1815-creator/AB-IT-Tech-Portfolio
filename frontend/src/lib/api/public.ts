import type { Category, Paginated, ProjectCardData, ProjectDetail, Technology } from "@/types/api";
import { request, type Query } from "./client";

export interface ProjectQuery {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  technology?: string;
  featured?: boolean;
  status?: string;
  ordering?: string;
}

export const getProjects = (query: ProjectQuery = {}, signal?: AbortSignal) =>
  request<Paginated<ProjectCardData>>("/projects/", { query: query as Query, signal });

export const getFeaturedProjects = (limit = 6) =>
  request<ProjectCardData[]>("/projects/featured/", { query: { limit } });

export const getProject = (slug: string) => request<ProjectDetail>(`/projects/${encodeURIComponent(slug)}/`);

export const getCategories = (signal?: AbortSignal) => request<Category[]>("/categories/", { signal });

export const getTechnologies = (signal?: AbortSignal) => request<Technology[]>("/technologies/", { signal });
