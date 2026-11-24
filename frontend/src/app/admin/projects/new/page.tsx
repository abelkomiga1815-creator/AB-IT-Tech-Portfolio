import { PageHeader } from "@/features/admin/PageHeader";
import { ProjectForm } from "@/features/admin/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader title="New project" description="Save it as a draft first, or publish it right away. Gallery images can be added after the first save." />
      <ProjectForm />
    </div>
  );
}
