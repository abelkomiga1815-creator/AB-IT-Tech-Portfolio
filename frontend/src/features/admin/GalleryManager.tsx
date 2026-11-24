"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Replace, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field, Input } from "@/components/ui/Field";
import { SafeImage } from "@/components/ui/SafeImage";
import { deleteImage, reorderImages, replaceImage, updateImage, uploadImages } from "@/lib/api/admin";
import type { GalleryImage } from "@/types/api";
import { getErrorMessage } from "@/utils/errors";
import { Notice } from "./PageHeader";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

function GalleryItem({
  image,
  index,
  count,
  onChange,
  onMove,
  onDelete,
  onError,
}: {
  image: GalleryImage;
  index: number;
  count: number;
  onChange: (image: GalleryImage) => void;
  onMove: (delta: number) => void;
  onDelete: () => void;
  onError: (message: string) => void;
}) {
  const [caption, setCaption] = useState(image.caption);
  const [alt, setAlt] = useState(image.alt_text);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = caption !== image.caption || alt !== image.alt_text;

  async function save() {
    setBusy(true);
    try {
      onChange(await updateImage(image.id, { caption, alt_text: alt }));
    } catch (err) {
      onError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function replace(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await replaceImage(image.id, file));
    } catch (err) {
      onError(getErrorMessage(err));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-white/10 bg-ink-850/60 p-4 sm:flex-row">
      <SafeImage src={image.image} alt={image.alt_text || image.caption || `Gallery image ${index + 1}`} className="h-32 w-full rounded-lg object-cover sm:w-48" />
      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        <Field label="Caption" htmlFor={`caption-${image.id}`}>
          <Input id={`caption-${image.id}`} value={caption} maxLength={255} onChange={(e) => setCaption(e.target.value)} />
        </Field>
        <Field label="Alternative text" htmlFor={`alt-${image.id}`} hint="Describe the image for screen readers.">
          <Input id={`alt-${image.id}`} value={alt} maxLength={255} onChange={(e) => setAlt(e.target.value)} />
        </Field>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
          <Button size="sm" onClick={save} disabled={!dirty} loading={busy}>
            <Save className="h-4 w-4" /> Save details
          </Button>
          <input ref={fileRef} type="file" accept={ACCEPT} className="sr-only" id={`replace-${image.id}`} aria-label={`Replace image ${index + 1}`} onChange={(e) => replace(e.target.files?.[0])} />
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
            <Replace className="h-4 w-4" /> Replace file
          </Button>
          <Button size="sm" variant="ghost" aria-label="Move image up" disabled={index === 0 || busy} onClick={() => onMove(-1)}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" aria-label="Move image down" disabled={index === count - 1 || busy} onClick={() => onMove(1)}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="danger" disabled={busy} onClick={onDelete} className="ml-auto">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>
    </li>
  );
}

export function GalleryManager({ projectId, initialImages }: { projectId: number; initialImages: GalleryImage[] }) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<GalleryImage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload() {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      const created = await uploadImages(projectId, files, caption, altText);
      setImages((list) => [...list, ...created]);
      setFiles([]);
      setCaption("");
      setAltText("");
      if (inputRef.current) inputRef.current.value = "";
      setNotice(`${created.length} image${created.length === 1 ? "" : "s"} uploaded.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const previous = images;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
    try {
      await reorderImages(projectId, next.map((image) => image.id));
    } catch (err) {
      setImages(previous);
      setError(getErrorMessage(err));
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteImage(toDelete.id);
      setImages((list) => list.filter((image) => image.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      setError(getErrorMessage(err));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="glass rounded-2xl p-6" aria-labelledby="gallery-heading">
      <h2 id="gallery-heading" className="font-display text-lg text-white">
        Screenshots gallery
      </h2>
      <p className="mt-1 text-sm text-silver-400">JPEG, PNG, WebP or GIF. Upload several at once; reorder, caption or replace them below.</p>

      <div className="mt-5 space-y-3">
        {error && <Notice tone="error">{error}</Notice>}
        {notice && <Notice tone="success">{notice}</Notice>}
      </div>

      <div className="mt-5 grid gap-3 rounded-xl border border-dashed border-white/15 p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="gallery-files" className="mb-1.5 block text-sm font-medium text-silver-200">
            Choose images
          </label>
          <input
            ref={inputRef}
            id="gallery-files"
            type="file"
            multiple
            accept={ACCEPT}
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-silver-300 file:mr-3 file:rounded-md file:border-0 file:bg-volt-500 file:px-3 file:py-2 file:text-sm file:text-white"
          />
          {files.length > 0 && <p className="mt-1 text-xs text-silver-500">{files.length} file{files.length === 1 ? "" : "s"} selected</p>}
        </div>
        <Field label="Caption (optional)" htmlFor="gallery-caption">
          <Input id="gallery-caption" value={caption} maxLength={255} onChange={(e) => setCaption(e.target.value)} />
        </Field>
        <Field label="Alternative text (optional)" htmlFor="gallery-alt">
          <Input id="gallery-alt" value={altText} maxLength={255} onChange={(e) => setAltText(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Button onClick={upload} loading={uploading} disabled={files.length === 0}>
            <Upload className="h-4 w-4" /> Upload {files.length > 0 ? `${files.length} image${files.length === 1 ? "" : "s"}` : "images"}
          </Button>
        </div>
      </div>

      {images.length === 0 ? (
        <p className="mt-6 text-sm text-silver-500">No gallery images yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {images.map((image, index) => (
            <GalleryItem
              key={`${image.id}-${image.image}`}
              image={image}
              index={index}
              count={images.length}
              onChange={(updated) => setImages((list) => list.map((item) => (item.id === updated.id ? updated : item)))}
              onMove={(delta) => move(index, delta)}
              onDelete={() => setToDelete(image)}
              onError={setError}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete image?"
        message="This image will be permanently removed from the project."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}
