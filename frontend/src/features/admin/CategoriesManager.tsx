"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { createCategory, deleteCategory, listAdminCategories, updateCategory, type CategoryInput } from "@/lib/api/admin";
import type { AdminCategory } from "@/types/api";
import { getErrorMessage, getFieldErrors } from "@/utils/errors";
import { Notice, PageHeader } from "./PageHeader";

const EMPTY: CategoryInput = { name: "", description: "", display_order: 0 };

function CategoryForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: CategoryInput;
  submitLabel: string;
  onSubmit: (values: CategoryInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const idPrefix = submitLabel.replace(/\s+/g, "-").toLowerCase();

  async function handle(event: FormEvent) {
    event.preventDefault();
    if (!values.name.trim()) {
      setErrors({ name: "Name is required." });
      return;
    }
    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      await onSubmit({ ...values, name: values.name.trim() });
      if (!onCancel) setValues(EMPTY);
    } catch (err) {
      const fields = getFieldErrors(err);
      setErrors(fields);
      if (!Object.keys(fields).length) setFormError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handle} className="grid gap-3 sm:grid-cols-[1fr_2fr_110px_auto] sm:items-start" noValidate>
      {formError && (
        <div className="sm:col-span-4">
          <Notice tone="error">{formError}</Notice>
        </div>
      )}
      <Field label="Name" htmlFor={`${idPrefix}-name`} error={errors.name}>
        <Input id={`${idPrefix}-name`} value={values.name} maxLength={80} onChange={(e) => setValues({ ...values, name: e.target.value })} />
      </Field>
      <Field label="Description" htmlFor={`${idPrefix}-description`} error={errors.description}>
        <Textarea id={`${idPrefix}-description`} rows={1} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
      </Field>
      <Field label="Order" htmlFor={`${idPrefix}-order`} error={errors.display_order}>
        <Input id={`${idPrefix}-order`} type="number" min={0} value={values.display_order} onChange={(e) => setValues({ ...values, display_order: Number(e.target.value) || 0 })} />
      </Field>
      <div className="flex gap-2 sm:pt-7">
        <Button type="submit" loading={busy} size="md">
          {onCancel ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            <X className="h-4 w-4" /> Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function CategoriesManager() {
  const [items, setItems] = useState<AdminCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setError(null);
    listAdminCategories().then(setItems).catch((err) => setError(getErrorMessage(err)));
  }, []);
  useEffect(load, [load]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      await deleteCategory(toDelete.id);
      setItems((list) => (list ?? []).filter((item) => item.id !== toDelete.id));
      setNotice(`Deleted "${toDelete.name}".`);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  return (
    <div>
      <PageHeader title="Categories" description="Group projects so visitors can filter the portfolio." />

      <section className="glass rounded-2xl p-6">
        <h2 className="mb-4 font-display text-lg text-white">Add a category</h2>
        <CategoryForm
          initial={EMPTY}
          submitLabel="Add category"
          onSubmit={async (values) => {
            const created = await createCategory(values);
            setItems((list) => [...(list ?? []), created].sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name)));
            setNotice(`Created "${created.name}".`);
          }}
        />
      </section>

      <div className="my-4 space-y-2">
        {actionError && <Notice tone="error">{actionError}</Notice>}
        {notice && <Notice tone="success">{notice}</Notice>}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items === null ? (
        <LoadingState label="Loading categories..." />
      ) : items.length === 0 ? (
        <EmptyState title="No categories yet" description="Add your first category above." />
      ) : (
        <ul className="space-y-3">
          {items.map((category) => (
            <li key={category.id} className="rounded-xl border border-white/10 bg-ink-850/60 p-4">
              {editingId === category.id ? (
                <CategoryForm
                  initial={{ name: category.name, description: category.description, display_order: category.display_order }}
                  submitLabel="Save"
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (values) => {
                    const updated = await updateCategory(category.id, values);
                    setItems((list) => (list ?? []).map((item) => (item.id === updated.id ? updated : item)));
                    setEditingId(null);
                    setNotice(`Updated "${updated.name}".`);
                  }}
                />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-silver-100">{category.name}</p>
                    <p className="text-xs text-silver-500">
                      /{category.slug} - {category.project_count} project{category.project_count === 1 ? "" : "s"} - order {category.display_order}
                    </p>
                    {category.description && <p className="mt-1 text-sm text-silver-400">{category.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(category.id)} aria-label={`Edit ${category.name}`}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setToDelete(category)} aria-label={`Delete ${category.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete category?"
        message={
          toDelete && toDelete.project_count > 0
            ? `"${toDelete.name}" still has ${toDelete.project_count} project(s) and cannot be deleted until they are moved or removed.`
            : toDelete
              ? `"${toDelete.name}" will be permanently deleted.`
              : ""
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
