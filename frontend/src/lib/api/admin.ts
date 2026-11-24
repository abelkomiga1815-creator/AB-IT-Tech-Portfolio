import type {
  AdminCategory,
  AdminProject,
  AuthUser,
  DashboardData,
  GalleryImage,
  Paginated,
} from "@/types/api";
import { request, type Query } from "./client";
import { clearTokens, getRefreshToken, setTokens } from "./tokens";

// ---------- auth ----------
interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const data = await request<LoginResponse>("/auth/login/", { method: "POST", body: { username, password } });
  setTokens(data.access, data.refresh);
  return data.user;
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  clearTokens();
  if (refresh) {
    try {
      await request("/auth/logout/", { method: "POST", body: { refresh } });
    } catch {
      /* the token is already removed locally; server-side blacklisting is best effort */
    }
  }
}

export const getMe = () => request<AuthUser>("/auth/me/", { auth: true });

export const getDashboard = () => request<DashboardData>("/admin/dashboard/", { auth: true });

// ---------- projects ----------
export interface AdminProjectQuery {
  page?: number;
  page_size?: number;
  search?: string;
  publication_status?: string;
  category?: number | string;
  ordering?: string;
}

export const listAdminProjects = (query: AdminProjectQuery = {}) =>
  request<Paginated<AdminProject>>("/admin/projects/", { auth: true, query: query as Query });

export const getAdminProject = (id: number | string) => request<AdminProject>(`/admin/projects/${id}/`, { auth: true });

export const createProject = (data: FormData) =>
  request<AdminProject>("/admin/projects/", { method: "POST", body: data, auth: true });

export const updateProject = (id: number, data: FormData | Record<string, unknown>) =>
  request<AdminProject>(`/admin/projects/${id}/`, { method: "PATCH", body: data, auth: true });

export const deleteProject = (id: number) => request<void>(`/admin/projects/${id}/`, { method: "DELETE", auth: true });

export const publishProject = (id: number) =>
  request<AdminProject>(`/admin/projects/${id}/publish/`, { method: "POST", auth: true });

export const unpublishProject = (id: number) =>
  request<AdminProject>(`/admin/projects/${id}/unpublish/`, { method: "POST", auth: true });

export const reorderProjects = (ids: number[]) =>
  request<{ updated: number }>("/admin/projects/reorder/", { method: "POST", body: { ids }, auth: true });

export interface ProjectFormValues {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  objectives: string;
  problem_statement: string;
  solution: string;
  cover_alt: string;
  category: string;
  technologies: string;
  project_status: string;
  publication_status: string;
  is_featured: boolean;
  live_demo_url: string;
  source_code_url: string;
  client_name: string;
  completion_date: string;
  seo_title: string;
  seo_description: string;
}

export function buildProjectFormData(
  values: ProjectFormValues,
  options: { cover?: File | null; removeCover?: boolean } = {},
): FormData {
  const form = new FormData();
  (Object.keys(values) as Array<keyof ProjectFormValues>).forEach((key) => {
    const value = values[key];
    form.append(key, typeof value === "boolean" ? String(value) : value);
  });
  if (options.cover) form.append("cover_image", options.cover);
  if (options.removeCover && !options.cover) form.append("remove_cover_image", "true");
  return form;
}

// ---------- categories ----------
export interface CategoryInput {
  name: string;
  description: string;
  display_order: number;
}

export const listAdminCategories = () => request<AdminCategory[]>("/admin/categories/", { auth: true });

export const createCategory = (data: CategoryInput) =>
  request<AdminCategory>("/admin/categories/", { method: "POST", body: data, auth: true });

export const updateCategory = (id: number, data: Partial<CategoryInput>) =>
  request<AdminCategory>(`/admin/categories/${id}/`, { method: "PATCH", body: data, auth: true });

export const deleteCategory = (id: number) => request<void>(`/admin/categories/${id}/`, { method: "DELETE", auth: true });

// ---------- gallery ----------
export const listImages = (projectId: number) =>
  request<GalleryImage[]>(`/admin/projects/${projectId}/images/`, { auth: true });

export function uploadImages(projectId: number, files: File[], caption = "", altText = "") {
  const form = new FormData();
  files.forEach((file) => form.append("images", file));
  if (caption) form.append("caption", caption);
  if (altText) form.append("alt_text", altText);
  return request<GalleryImage[]>(`/admin/projects/${projectId}/images/`, { method: "POST", body: form, auth: true });
}

export const updateImage = (id: number, data: { caption?: string; alt_text?: string; order?: number }) =>
  request<GalleryImage>(`/admin/images/${id}/`, { method: "PATCH", body: data, auth: true });

export function replaceImage(id: number, file: File) {
  const form = new FormData();
  form.append("image", file);
  return request<GalleryImage>(`/admin/images/${id}/`, { method: "PATCH", body: form, auth: true });
}

export const deleteImage = (id: number) => request<void>(`/admin/images/${id}/`, { method: "DELETE", auth: true });

export const reorderImages = (projectId: number, ids: number[]) =>
  request<{ updated: number }>(`/admin/projects/${projectId}/images/reorder/`, {
    method: "POST",
    body: { ids },
    auth: true,
  });
