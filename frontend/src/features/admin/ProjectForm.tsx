"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Eye, Save, Send, Undo2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { SafeImage } from "@/components/ui/SafeImage";
import { buildProjectFormData, createProject, listAdminCategories, updateProject, type ProjectFormValues } from "@/lib/api/admin";
import type { AdminCategory, AdminProject } from "@/types/api";
import { getErrorMessage, getFieldErrors } from "@/utils/errors";
import { PROJECT_STATUS_LABELS } from "@/utils/format";
import { Notice } from "./PageHeader";

const MAX_COVER_MB = 5;

function toValues(project?: AdminProject): ProjectFormValues {
  return {
    title: project?.title ?? "",
    slug: project?.slug ?? "",
    short_description: project?.short_description ?? "",
    description: project?.description ?? "",
    objectives: project?.objectives ?? "",
    problem_statement: project?.problem_statement ?? "",
    solution: project?.solution ?? "",
    cover_alt: project?.cover_alt ?? "",
    category: project?.category ? String(project.category) : "",
    technologies: project?.technologies.join(", ") ?? "",
    project_status: project?.project_status ?? "completed",
    publication_status: project?.publication_status ?? "draft",
    is_featured: project?.is_featured ?? false,
    live_demo_url: project?.live_demo_url ?? "",
    source_code_url: project?.source_code_url ?? "",
    client_name: project?.client_name ?? "",
    completion_date: project?.completion_date ?? "",
    seo_title: project?.seo_title ?? "",
    seo_description: project?.seo_description ?? "",
  };
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="font-display text-lg text-white">{title}</h2>
      {description && <p className="mt-1 text-sm text-silver-400">{description}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function ProjectForm({ project, justCreated = false }: { project?: AdminProject; justCreated?: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState<AdminProject | undefined>(project);
  const [values, setValues] = useState<ProjectFormValues>(() => toValues(project));
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [cover, setCover] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(justCreated ? "Project created. You can now add gallery images below." : null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    listAdminCategories().then(setCategories).catch(() => undefined);
  }, []);

  const coverPreview = useMemo(() => (cover ? URL.createObjectURL(cover) : null), [cover]);
  useEffect(() => () => { if (coverPreview) URL.revokeObjectURL(coverPreview); }, [coverPreview]);

  const set = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => setValues((current) => ({ ...current, [key]: value }));
  const existingCover = removeCover ? null : saved?.cover_image ?? null;
  const shownCover = coverPreview ?? existingCover;
  const isPublished = saved?.publication_status === "published";

  function onCoverChange(file: File | undefined) {
    setErrors((e) => ({ ...e, cover_image: "" }));
    if (!file) return setCover(null);
    if (file.size > MAX_COVER_MB * 1024 * 1024) {
      setErrors((e) => ({ ...e, cover_image: `Image is too large. Maximum size is ${MAX_COVER_MB} MB.` }));
      return;
    }
    setCover(file);
    setRemoveCover(false);
  }

  async function submit(event: FormEvent | null, publication: "draft" | "published" | "keep", label: string) {
    event?.preventDefault();
    if (!values.title.trim()) {
      setErrors({ title: "Title is required." });
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setBusy(label);
    setErrors({});
    setFormError(null);
    setNotice(null);
    const payload = { ...values, publication_status: publication === "keep" ? values.publication_status : publication };
    const body = buildProjectFormData(payload, { cover, removeCover });
    try {
      if (saved) {
        const updated = await updateProject(saved.id, body);
        setSaved(updated);
        setValues(toValues(updated));
        setCover(null);
        setRemoveCover(false);
        setNotice(publication === "published" ? "Saved and published." : publication === "draft" ? "Saved as draft." : "Changes saved.");
      } else {
        const created = await createProject(body);
        router.push(`/admin/projects/${created.id}?created=1`);
      }
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      setErrors(fieldErrors);
      setFormError(Object.keys(fieldErrors).length ? "Please fix the highlighted fields." : getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const err = (key: string) => errors[key] || undefined;

  return (
    <form onSubmit={(e) => submit(e, "keep", "save")} className="space-y-6" noValidate>
      <div className="space-y-3">
        {formError && <Notice tone="error">{formError}</Notice>}
        {notice && <Notice tone="success">{notice}</Notice>}
      </div>

      <Section title="Basics">
        <Field label="Title *" htmlFor="title" error={err("title")} className="sm:col-span-2">
          <Input id="title" value={values.title} maxLength={200} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Slug" htmlFor="slug" error={err("slug")} hint={saved ? "Changing the slug changes the project's public URL." : "Leave empty to generate it from the title."}>
          <Input id="slug" value={values.slug} maxLength={220} onChange={(e) => set("slug", e.target.value)} />
        </Field>
        <Field label="Category" htmlFor="category" error={err("category")} hint={categories.length === 0 ? "No categories yet - create one under Categories." : undefined}>
          <Select id="category" value={values.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Short description" htmlFor="short_description" error={err("short_description")} hint="Shown on project cards (max 300 characters)." className="sm:col-span-2">
          <Textarea id="short_description" rows={2} maxLength={300} value={values.short_description} onChange={(e) => set("short_description", e.target.value)} />
        </Field>
        <Field label="Technologies" htmlFor="technologies" error={err("technologies")} hint="Comma separated, e.g. Django, PostgreSQL, Next.js" className="sm:col-span-2">
          <Input id="technologies" value={values.technologies} onChange={(e) => set("technologies", e.target.value)} />
        </Field>
        <Field label="Project status" htmlFor="project_status" error={err("project_status")}>
          <Select id="project_status" value={values.project_status} onChange={(e) => set("project_status", e.target.value)}>
            {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Completion date" htmlFor="completion_date" error={err("completion_date")}>
          <Input id="completion_date" type="date" value={values.completion_date} onChange={(e) => set("completion_date", e.target.value)} />
        </Field>
        <Field label="Client or organisation" htmlFor="client_name" error={err("client_name")} className="sm:col-span-2">
          <Input id="client_name" value={values.client_name} maxLength={200} onChange={(e) => set("client_name", e.target.value)} />
        </Field>
      </Section>

      <Section title="Content" description="Plain text. Blank lines create paragraph breaks on the public page.">
        <Field label="Full description" htmlFor="description" error={err("description")} className="sm:col-span-2">
          <Textarea id="description" rows={6} value={values.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <Field label="Objectives" htmlFor="objectives" error={err("objectives")} className="sm:col-span-2">
          <Textarea id="objectives" rows={4} value={values.objectives} onChange={(e) => set("objectives", e.target.value)} />
        </Field>
        <Field label="Problem statement" htmlFor="problem_statement" error={err("problem_statement")}>
          <Textarea id="problem_statement" rows={5} value={values.problem_statement} onChange={(e) => set("problem_statement", e.target.value)} />
        </Field>
        <Field label="Solution" htmlFor="solution" error={err("solution")}>
          <Textarea id="solution" rows={5} value={values.solution} onChange={(e) => set("solution", e.target.value)} />
        </Field>
      </Section>

      <Section title="Cover image" description={`JPEG, PNG, WebP or GIF, up to ${MAX_COVER_MB} MB.`}>
        <div className="sm:col-span-2">
          {shownCover ? (
            <SafeImage src={shownCover} alt="Cover preview" className="aspect-[16/8] w-full max-w-xl rounded-xl border border-white/10 object-cover" />
          ) : (
            <p className="text-sm text-silver-500">No cover image.</p>
          )}
        </div>
        <Field label={existingCover || cover ? "Replace cover image" : "Upload cover image"} htmlFor="cover_image" error={err("cover_image")}>
          <input
            id="cover_image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => onCoverChange(e.target.files?.[0])}
            className="block w-full text-sm text-silver-300 file:mr-3 file:rounded-md file:border-0 file:bg-volt-500 file:px-3 file:py-2 file:text-sm file:text-white"
          />
        </Field>
        <Field label="Cover alternative text" htmlFor="cover_alt" error={err("cover_alt")}>
          <Input id="cover_alt" value={values.cover_alt} maxLength={255} onChange={(e) => set("cover_alt", e.target.value)} />
        </Field>
        {(existingCover || cover) && (
          <div className="sm:col-span-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setCover(null);
                setRemoveCover(true);
              }}
            >
              Remove cover image
            </Button>
          </div>
        )}
      </Section>

      <Section title="Links">
        <Field label="Live demo URL" htmlFor="live_demo_url" error={err("live_demo_url")}>
          <Input id="live_demo_url" type="url" placeholder="https://" value={values.live_demo_url} onChange={(e) => set("live_demo_url", e.target.value)} />
        </Field>
        <Field label="Source code URL" htmlFor="source_code_url" error={err("source_code_url")}>
          <Input id="source_code_url" type="url" placeholder="https://" value={values.source_code_url} onChange={(e) => set("source_code_url", e.target.value)} />
        </Field>
      </Section>

      <Section title="SEO">
        <Field label="SEO title" htmlFor="seo_title" error={err("seo_title")} hint="Up to 70 characters. Defaults to the project title.">
          <Input id="seo_title" maxLength={70} value={values.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
        </Field>
        <Field label="SEO description" htmlFor="seo_description" error={err("seo_description")} hint="Up to 200 characters. Defaults to the short description.">
          <Textarea id="seo_description" rows={2} maxLength={200} value={values.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
        </Field>
      </Section>

      <section className="glass rounded-2xl p-6">
        <label className="flex items-center gap-3 text-sm text-silver-200">
          <input type="checkbox" className="h-4 w-4 accent-volt-500" checked={values.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />
          Feature this project on the homepage
        </label>
      </section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur">
        {!isPublished && (
          <>
            <Button type="button" variant="secondary" loading={busy === "draft"} disabled={busy !== null} onClick={() => submit(null, "draft", "draft")}>
              <Save className="h-4 w-4" /> Save draft
            </Button>
            <Button type="button" loading={busy === "publish"} disabled={busy !== null} onClick={() => submit(null, "published", "publish")}>
              <Send className="h-4 w-4" /> {saved ? "Save & publish" : "Create & publish"}
            </Button>
          </>
        )}
        {isPublished && (
          <>
            <Button type="submit" loading={busy === "save"} disabled={busy !== null}>
              <Save className="h-4 w-4" /> Save changes
            </Button>
            <Button type="button" variant="secondary" loading={busy === "unpublish"} disabled={busy !== null} onClick={() => submit(null, "draft", "unpublish")}>
              <Undo2 className="h-4 w-4" /> Unpublish (save as draft)
            </Button>
          </>
        )}
        {saved && (
          <ButtonLink href={`/admin/projects/${saved.id}/preview`} variant="ghost">
            <Eye className="h-4 w-4" /> Preview
          </ButtonLink>
        )}
        <Link href="/admin/projects" className="ml-auto text-sm text-silver-400 hover:text-white">
          Back to projects
        </Link>
      </div>
    </form>
  );
}
