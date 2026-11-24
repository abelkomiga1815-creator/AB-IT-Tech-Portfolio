export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type ProjectStatus = "completed" | "in_progress" | "maintenance" | "concept";
export type PublicationStatus = "draft" | "published";

export interface CategoryMini {
  id: number;
  name: string;
  slug: string;
}

export interface Category extends CategoryMini {
  description: string;
  project_count: number;
}

export interface AdminCategory extends Category {
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Technology {
  id: number;
  name: string;
  slug: string;
  project_count: number;
}

export interface GalleryImage {
  id: number;
  image: string;
  caption: string;
  alt_text: string;
  order: number;
  created_at?: string;
}

export interface ProjectCardData {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  cover_image: string | null;
  cover_alt: string;
  category: CategoryMini | null;
  technologies: string[];
  project_status: ProjectStatus;
  is_featured: boolean;
  completion_date: string | null;
  published_at: string | null;
}

export interface ProjectDetail extends ProjectCardData {
  description: string;
  objectives: string;
  problem_statement: string;
  solution: string;
  live_demo_url: string;
  source_code_url: string;
  client_name: string;
  seo_title: string;
  seo_description: string;
  images: GalleryImage[];
  related_projects: ProjectCardData[];
}

/** Shape returned by /admin/projects/ (category is an id; category_detail is the nested object). */
export interface AdminProject
  extends Omit<ProjectDetail, "category" | "related_projects" | "published_at"> {
  category: number | null;
  category_detail: CategoryMini | null;
  publication_status: PublicationStatus;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityItem {
  id: number;
  action: string;
  target_type: string;
  target_id: number | null;
  target_label: string;
  actor_name: string;
  created_at: string;
}

export interface DashboardData {
  stats: {
    total_projects: number;
    published_projects: number;
    draft_projects: number;
    featured_projects: number;
    categories: number;
    technologies: number;
    gallery_images: number;
  };
  recent_projects: {
    id: number;
    title: string;
    slug: string;
    publication_status: PublicationStatus;
    is_featured: boolean;
    updated_at: string;
  }[];
  recent_activity: ActivityItem[];
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
}
