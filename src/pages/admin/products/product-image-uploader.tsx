import { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Upload,
  CheckCircle2,
  LoaderCircle,
  TriangleAlert,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/api";
type Job = {
  id: number;
  file: File;
  status: "queued" | "uploading" | "uploaded" | "failed";
  error?: string;
  url?: string;
  retryable?: boolean;
};
type Props = {
  remaining: number;
  disabled?: boolean;
  onUploaded: (urls: string[]) => void;
  onBusyChange: (busy: boolean) => void;
};
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export default function ProductImageUploader({
  remaining,
  disabled = false,
  onUploaded,
  onBusyChange,
}: Props) {
  const [jobs, setJobs] = useState<Job[]>([]),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [dragging, setDragging] = useState(false);
  const locked = useRef(false),
    mounted = useRef(true),
    controller = useRef<AbortController | null>(null),
    sequence = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
      if (locked.current) onBusyChange(false);
    };
  }, [onBusyChange]);
  function update(id: number, patch: Partial<Job>) {
    if (mounted.current)
      setJobs((rows) =>
        rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
      );
  }
  async function run(selected: Job[], total = selected.length) {
    if (locked.current || disabled) return;
    if (selected.length > remaining) {
      setNotice(
        "You can add " +
          remaining +
          " more image" +
          (remaining === 1 ? "" : "s") +
          ". Choose a smaller batch.",
      );
      return;
    }
    locked.current = true;
    setBusy(true);
    setNotice("");
    onBusyChange(true);
    controller.current = new AbortController();
    const urls: string[] = [];
    try {
      for (const job of selected) {
        if (!mounted.current) break;
        update(job.id, { status: "uploading", error: undefined });
        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": job.file.type },
            credentials: "same-origin",
            body: job.file,
            signal: controller.current.signal,
          });
          let data: unknown = null;
          try {
            data = await response.json();
          } catch {}
          if (!response.ok)
            throw new Error(apiErrorMessage(data, response.status));
          const url =
            data && typeof data === "object" && "url" in data
              ? data.url
              : undefined;
          if (typeof url !== "string" || !url.startsWith("https://"))
            throw new Error("The upload did not return a valid image URL.");
          urls.push(url);
          update(job.id, { status: "uploaded", url, retryable: false });
        } catch (error) {
          if (!mounted.current) break;
          update(job.id, {
            status: "failed",
            retryable: true,
            error:
              error instanceof Error
                ? error.message
                : "Upload failed. Please retry.",
          });
        }
      }
      if (mounted.current) {
        if (urls.length) onUploaded(urls);
        setNotice(
          urls.length +
            " of " +
            total +
            " images uploaded. " +
            (urls.length < total
              ? "Successful images are kept. Review failed files below."
              : "Save the product to keep your gallery changes."),
        );
      }
    } finally {
      locked.current = false;
      controller.current = null;
      if (mounted.current) {
        setBusy(false);
        onBusyChange(false);
      }
    }
  }
  function select(files: File[]) {
    if (locked.current || disabled || !files.length) return;
    if (files.length > remaining) {
      setNotice(
        "You can add " +
          remaining +
          " more image" +
          (remaining === 1 ? "" : "s") +
          ". Choose a smaller batch.",
      );
      return;
    }
    const batch: Job[] = files.map((file) => {
      const error = !TYPES.has(file.type)
        ? "Use a JPEG, PNG or WebP image."
        : file.size === 0
          ? "This file is empty."
          : file.size > 4 * 1024 * 1024
            ? "Maximum image size is 4 MB."
            : undefined;
      return {
        id: ++sequence.current,
        file,
        status: error ? "failed" : "queued",
        error,
        retryable: false,
      };
    });
    setJobs(batch);
    const valid = batch.filter((j) => j.status === "queued");
    if (valid.length) void run(valid, batch.length);
    else setNotice("No images uploaded. Check the file errors below.");
  }
  const done = jobs.filter(
    (j) => j.status === "uploaded" || j.status === "failed",
  ).length;
  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label="Product image upload area"
        className={
          "border border-dashed p-5 space-y-3 transition-colors " +
          (dragging ? "border-primary bg-primary/5" : "bg-muted/30")
        }
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy && !disabled && remaining > 0) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          select(Array.from(event.dataTransfer.files));
        }}
      >
        <div className="flex items-start gap-3">
          <ImagePlus className="text-primary shrink-0 mt-1" size={22} />
          <div>
            <label
              htmlFor="product-images-upload"
              className="font-medium text-sm"
            >
              Upload product images
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              Choose multiple files or drag them here. JPEG, PNG or WebP · 4 MB
              per image.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {remaining} of 8 gallery spaces available. The first image is the
              main product photo.
            </p>
          </div>
        </div>
        <Input
          id="product-images-upload"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={busy || disabled || remaining <= 0}
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = "";
            select(files);
          }}
        />
      </div>
      {busy && (
        <div role="status" className="text-sm space-y-2">
          <span className="flex items-center gap-2">
            <LoaderCircle className="animate-spin" size={15} />
            Uploading batch · {done} of {jobs.length} files processed
          </span>
          <progress
            aria-label="Batch upload progress"
            value={done}
            max={jobs.length}
            className="w-full h-2 accent-primary"
          />
        </div>
      )}
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}
      {jobs.length > 0 && (
        <ul aria-label="Image upload results" className="space-y-2">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex items-start gap-3 border p-3 text-sm"
            >
              {job.status === "uploaded" ? (
                <CheckCircle2
                  size={16}
                  className="text-green-600 shrink-0 mt-1"
                />
              ) : job.status === "uploading" ? (
                <LoaderCircle
                  size={16}
                  className="animate-spin shrink-0 mt-1"
                />
              ) : job.status === "failed" ? (
                <TriangleAlert
                  size={16}
                  className="text-destructive shrink-0 mt-1"
                />
              ) : (
                <Upload
                  size={16}
                  className="text-muted-foreground shrink-0 mt-1"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="break-all font-medium">{job.file.name}</p>
                <p
                  className={
                    "text-xs mt-1 " +
                    (job.status === "failed"
                      ? "text-destructive"
                      : "text-muted-foreground")
                  }
                >
                  {job.status === "failed"
                    ? job.error
                    : job.status === "uploaded"
                      ? "Uploaded"
                      : job.status === "uploading"
                        ? "Uploading…"
                        : "Queued"}
                </p>
              </div>
              {job.status === "failed" && job.retryable && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy || disabled || remaining <= 0}
                  onClick={() => void run([job])}
                  aria-label={"Retry " + job.file.name}
                >
                  <RotateCcw size={13} />
                  Retry
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
