import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectsExplorer } from "./ProjectsExplorer";
import type { ProjectCardData } from "@/types/api";

const replace = vi.fn();
let query = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/projects",
  useSearchParams: () => new URLSearchParams(query),
}));

const getProjects = vi.fn();
vi.mock("@/lib/api/public", () => ({
  getProjects: (...args: unknown[]) => getProjects(...args),
  getCategories: () => Promise.resolve([{ id: 1, name: "Web", slug: "web", description: "", project_count: 2 }]),
  getTechnologies: () => Promise.resolve([{ id: 1, name: "Django", slug: "django", project_count: 2 }]),
}));

const card = (id: number, title: string): ProjectCardData => ({
  id,
  title,
  slug: title.toLowerCase().replace(/\s+/g, "-"),
  short_description: `${title} description`,
  cover_image: null,
  cover_alt: "",
  category: null,
  technologies: [],
  project_status: "completed",
  is_featured: false,
  completion_date: null,
  published_at: null,
});

describe("ProjectsExplorer", () => {
  beforeEach(() => {
    replace.mockReset();
    getProjects.mockReset();
    query = "";
  });

  it("loads and lists projects with the total count", async () => {
    getProjects.mockResolvedValue({ count: 2, next: null, previous: null, results: [card(1, "Alpha"), card(2, "Beta")] });
    render(<ProjectsExplorer />);
    expect(await screen.findByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("2 projects")).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    query = "q=zzz";
    getProjects.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    render(<ProjectsExplorer />);
    expect(await screen.findByText("No projects match your search")).toBeInTheDocument();
    expect(getProjects.mock.calls[0][0]).toMatchObject({ search: "zzz" });
  });

  it("shows an error state with a working retry", async () => {
    getProjects.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce({ count: 1, next: null, previous: null, results: [card(1, "Alpha")] });
    render(<ProjectsExplorer />);
    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Alpha")).toBeInTheDocument();
  });

  it("updates the URL when a category chip is selected", async () => {
    getProjects.mockResolvedValue({ count: 1, next: null, previous: null, results: [card(1, "Alpha")] });
    render(<ProjectsExplorer />);
    await userEvent.click(await screen.findByRole("button", { name: /Web/ }));
    expect(replace).toHaveBeenCalledWith("/projects?category=web", { scroll: false });
  });
});
