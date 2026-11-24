import { render, screen } from "@testing-library/react";
import { ProjectCard } from "./ProjectCard";
import type { ProjectCardData } from "@/types/api";

const project: ProjectCardData = {
  id: 1,
  title: "School Management System",
  slug: "school-management-system",
  short_description: "Manages students and results.",
  cover_image: null,
  cover_alt: "",
  category: { id: 1, name: "Management Systems", slug: "management-systems" },
  technologies: ["Django", "PostgreSQL", "React", "Docker", "Redis"],
  project_status: "in_progress",
  is_featured: false,
  completion_date: null,
  published_at: null,
};

describe("ProjectCard", () => {
  it("links to the SEO-friendly project URL", () => {
    render(<ProjectCard project={project} />);
    expect(screen.getByRole("link", { name: "School Management System" })).toHaveAttribute("href", "/projects/school-management-system");
  });

  it("shows category, description, limited technologies and status", () => {
    render(<ProjectCard project={project} />);
    expect(screen.getByText("Management Systems")).toBeInTheDocument();
    expect(screen.getByText("Manages students and results.")).toBeInTheDocument();
    expect(screen.getByText("Django")).toBeInTheDocument();
    expect(screen.queryByText("Redis")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  it("renders a placeholder when there is no cover image", () => {
    render(<ProjectCard project={project} />);
    expect(screen.getByText("SM")).toBeInTheDocument();
  });
});
