import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { request } from "@/lib/api";

import {
  contentSchema,
  SLOTS,
  SLOT_IDS,
  type Slot,
  type WebsiteContent,
} from "../../../../db/website-content";
import type { ContentState } from "../../../../db/website-content-store";
import ImageEditor from "./image-editor";

const endpoint = "/api/settings?section=website-content&admin=1";
const inputClass = "w-full rounded border bg-background p-2";
export default function WebsiteContentEditor() {
  const [state, setState] = useState<ContentState | null>(null);
  const [draft, setDraft] = useState<WebsiteContent | null>(null);
  const [slot, setSlot] = useState<Slot>("home-hero");
  const [tab, setTab] = useState("images");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const [mobile, setMobile] = useState(false);
  const query = useQueryClient();
  function load() {
    setError("");
    request<ContentState>(endpoint)
      .then((v) => {
        setState(v);
        setDraft(v.draft);
      })
      .catch((e) => setError(e.message));
  }
  useEffect(() => {
    let active = true;
    request<ContentState>(endpoint)
      .then((v) => {
        if (active) {
          setState(v);
          setDraft(v.draft);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (preview && draft) {
      try {
        sessionStorage.setItem("hawk-content-preview", JSON.stringify(draft));
      } catch {
        /* storage unavailable */
      }
    }
  }, [draft, preview]);
  const dirty =
    !!state && !!draft && JSON.stringify(state.draft) !== JSON.stringify(draft);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  async function save(action: "save" | "publish" | "restore") {
    if (!draft || !state) return;
    setError("");
    setMessage("");
    const parsed = contentSchema.safeParse(draft);
    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((i) => i.path.join(".") + ": " + i.message)
          .join("; "),
      );
      return;
    }
    setBusy(true);
    try {
      const next = await request<ContentState>(endpoint, {
        method: "PUT",
        body: { action, content: parsed.data, revision: state.revision },
        admin: true,
      });
      setState(next);
      setDraft(next.draft);
      setMessage(
        action === "save"
          ? "Draft saved. Visitors still see the published version."
          : action === "publish"
            ? "Website content published."
            : "Previous published version restored.",
      );
      void query.invalidateQueries({ queryKey: ["website-content"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File) {
    setBusy(true);
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        throw new Error("Choose a JPEG, PNG or WebP image.");
      if (file.size > 25 * 1024 * 1024)
        throw new Error("Choose an original smaller than 25 MB.");
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas
        .getContext("2d")!
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) =>
            b ? resolve(b) : reject(new Error("Could not process image")),
          "image/webp",
          0.88,
        ),
      );
      if (blob.size > 4 * 1024 * 1024)
        throw new Error("Image remains too large. Choose a smaller file.");
      const response = await fetch("/api/upload", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed");
      setDraft((current) =>
        current
          ? {
              ...current,
              library: [
                { url: result.url, name: file.name.slice(0, 200) },
                ...current.library.filter((i) => i.url !== result.url),
              ].slice(0, 100),
            }
          : current,
      );
      return result.url as string;
    } finally {
      setBusy(false);
    }
  }
  if (!draft || !state)
    return (
      <div className="p-8">
        {error ? (
          <>
            <p role="alert">{error}</p>
            <Button onClick={load}>Retry</Button>
          </>
        ) : (
          <p role="status">Loading website content…</p>
        )}
      </div>
    );
  const patch = (value: Partial<WebsiteContent>) =>
    setDraft((current) => (current ? { ...current, ...value } : current));
  const field = (
    label: string,
    value: string,
    change: (value: string) => void,
    type = "text",
  ) => (
    <label className="grid gap-2 text-sm">
      {label}
      <input
        className={inputClass}
        type={type}
        value={value}
        onChange={(e) => change(e.target.value)}
      />
    </label>
  );
  const page = SLOTS[slot][0];
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-5 lg:p-9">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[.3em] text-primary">
          Settings / Website content
        </p>
        <h1>Make it your own.</h1>
        <p className="text-muted-foreground">
          Manage page imagery, CNC footage and sales banners. Save privately,
          preview, then publish when ready.
        </p>
      </header>
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border bg-card p-4">
        <Button disabled={busy} onClick={() => void save("save")}>
          Save draft
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            try {
              sessionStorage.setItem(
                "hawk-content-preview",
                JSON.stringify(draft),
              );
              setPreview(!preview);
            } catch {
              setError("Preview storage is unavailable in this browser.");
            }
          }}
        >
          {preview ? "Close preview" : "Preview page"}
        </Button>
        <Button disabled={busy} onClick={() => void save("publish")}>
          Publish content
        </Button>
        <Button
          disabled={busy || !state.previous}
          variant="outline"
          onClick={() => void save("restore")}
        >
          Restore previous publication
        </Button>
        <span className="text-xs text-muted-foreground">
          {busy ? "Saving…" : dirty ? "Unsaved changes" : "Draft saved"}
        </span>
      </div>
      {error ? (
        <p
          role="alert"
          className="border border-destructive p-4 text-destructive"
        >
          {error}
          <Button variant="outline" className="ml-3" onClick={load}>
            Reload saved draft (discard local changes)
          </Button>
        </p>
      ) : null}
      {message ? (
        <p role="status" className="border p-4">
          {message}
        </p>
      ) : null}
      {preview ? (
        <section className="space-y-3">
          <div className="flex gap-3 items-center">
            <h2>{page} page preview</h2>
            <Button variant="outline" onClick={() => setMobile(!mobile)}>
              {mobile ? "Show desktop" : "Show mobile"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Image framing matches the selected device. Navigation links are
            disabled in this preview.
          </p>
          <iframe
            key={JSON.stringify(draft) + mobile}
            title={page + " draft preview"}
            src={"/admin/content-preview?page=" + encodeURIComponent(page)}
            className="mx-auto block h-[650px] border bg-background"
            style={{ width: mobile ? 390 : "100%", maxWidth: "100%" }}
          />
        </section>
      ) : null}
      <fieldset disabled={busy} className="space-y-6 min-w-0">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Content sections"
        >
          {["images", "hero text", "CNC video", "promotions"].map((t) => (
            <Button
              key={t}
              variant={t === tab ? "default" : "outline"}
              onClick={() => setTab(t)}
            >
              {t}
            </Button>
          ))}
        </div>
        {tab === "images" ? (
          <div className="grid items-start gap-6 lg:grid-cols-[240px_1fr]">
            <nav className="admin-panel space-y-4" aria-label="Image positions">
              {["Home", "Rentals", "Repairs", "About"].map((group) => (
                <div key={group}>
                  <h3 className="mb-2 text-sm font-semibold">{group}</h3>
                  {SLOT_IDS.filter((id) => SLOTS[id][0] === group).map((id) => (
                    <button
                      className={
                        "block w-full rounded p-2 text-left text-sm " +
                        (slot === id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted")
                      }
                      key={id}
                      onClick={() => setSlot(id)}
                    >
                      {SLOTS[id][1]}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
            <div className="admin-panel">
              <ImageEditor
                key={slot}
                slot={slot}
                image={draft.images[slot]}
                onChange={(image) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          images: { ...current.images, [slot]: image },
                        }
                      : current,
                  )
                }
                onUpload={upload}
                library={draft.library}
              />
            </div>
          </div>
        ) : null}
        {tab === "hero text" ? (
          <section className="admin-panel max-w-3xl space-y-4">
            <h2>Homepage hero text</h2>
            {field("Heading", draft.hero.title, (v) =>
              patch({ hero: { ...draft.hero, title: v } }),
            )}
            {field("Supporting text", draft.hero.body, (v) =>
              patch({ hero: { ...draft.hero, body: v } }),
            )}
            {field("Button text", draft.hero.button, (v) =>
              patch({ hero: { ...draft.hero, button: v } }),
            )}
            {field("Button destination", draft.hero.href, (v) =>
              patch({ hero: { ...draft.hero, href: v } }),
            )}
          </section>
        ) : null}
        {tab === "CNC video" ? (
          <section className="admin-panel max-w-3xl space-y-4">
            <h2>CNC footage</h2>
            <p className="text-muted-foreground">
              One video appears on Home and About. Use a direct HTTPS MP4 or
              WebM URL. Playback starts when visitors press play.
            </p>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={draft.video.enabled}
                onChange={(e) =>
                  patch({
                    video: { ...draft.video, enabled: e.target.checked },
                  })
                }
              />
              Show CNC video section
            </label>
            {field("Video URL", draft.video.src, (v) =>
              patch({ video: { ...draft.video, src: v } }),
            )}
            {field("Poster image URL", draft.video.poster, (v) =>
              patch({ video: { ...draft.video, poster: v } }),
            )}
            <label className="grid gap-2">
              Upload poster
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setBusy(true);
                  try {
                    const url = await upload(file);
                    setDraft((c) =>
                      c ? { ...c, video: { ...c.video, poster: url } } : c,
                    );
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Upload failed");
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </label>
            {field("Video heading", draft.video.title, (v) =>
              patch({ video: { ...draft.video, title: v } }),
            )}
            {field("Description", draft.video.body, (v) =>
              patch({ video: { ...draft.video, body: v } }),
            )}
            {draft.video.src ? (
              <video
                controls
                preload="none"
                poster={draft.video.poster || undefined}
                src={draft.video.src}
                className="aspect-video w-full bg-black"
              />
            ) : null}
          </section>
        ) : null}
        {tab === "promotions" ? (
          <section className="space-y-5">
            <div className="admin-panel space-y-3">
              <h2>Promotional banners</h2>
              <p>
                Schedule in South African time (UTC+02:00). These banners
                advertise offers; product prices and checkout discounts are
                managed separately.
              </p>
              <Button
                disabled={draft.promotions.length >= 12}
                onClick={() =>
                  patch({
                    promotions: [
                      ...draft.promotions,
                      {
                        id: crypto.randomUUID(),
                        enabled: false,
                        placement: "strip",
                        title: "New promotion",
                        body: "",
                        button: "Shop now",
                        href: "/shop",
                        image: "",
                        start: "",
                        end: "",
                      },
                    ],
                  })
                }
              >
                Add promotion
              </Button>
            </div>
            {draft.promotions.map((p, index) => {
              const update = (value: Partial<typeof p>) =>
                patch({
                  promotions: draft.promotions.map((item, i) =>
                    i === index ? { ...item, ...value } : item,
                  ),
                });
              return (
                <div className="admin-panel space-y-4" key={p.id}>
                  <label className="flex gap-2">
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={(e) => update({ enabled: e.target.checked })}
                    />
                    Enable promotion
                  </label>
                  <label className="grid gap-2">
                    Placement
                    <select
                      className={inputClass}
                      value={p.placement}
                      onChange={(e) =>
                        update({
                          placement: e.target.value as typeof p.placement,
                        })
                      }
                    >
                      <option value="strip">
                        Announcement strip (all pages)
                      </option>
                      <option value="home">Homepage banner</option>
                      <option value="shop">Shop banner</option>
                    </select>
                  </label>
                  {field("Headline", p.title, (v) => update({ title: v }))}
                  {field("Description", p.body, (v) => update({ body: v }))}
                  {field("Button text", p.button, (v) => update({ button: v }))}
                  {field("Button destination", p.href, (v) =>
                    update({ href: v }),
                  )}
                  {field("Image URL (optional)", p.image, (v) =>
                    update({ image: v }),
                  )}
                  <label className="grid gap-2">
                    Upload banner image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={busy}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setBusy(true);
                        try {
                          const url = await upload(f);
                          setDraft((c) =>
                            c
                              ? {
                                  ...c,
                                  promotions: c.promotions.map((item) =>
                                    item.id === p.id
                                      ? { ...item, image: url }
                                      : item,
                                  ),
                                }
                              : c,
                          );
                        } catch (e) {
                          setError(
                            e instanceof Error ? e.message : "Upload failed",
                          );
                        } finally {
                          setBusy(false);
                        }
                      }}
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(["start", "end"] as const).map((k) =>
                      field(
                        k === "start"
                          ? "Starts (SAST, optional)"
                          : "Ends (SAST, optional)",
                        p[k]
                          ? new Date(Date.parse(p[k]) + 7200000)
                              .toISOString()
                              .slice(0, 16)
                          : "",
                        (v) => update({ [k]: v ? v + ":00+02:00" : "" }),
                        "datetime-local",
                      ),
                    )}
                  </div>
                  <div className="border bg-muted p-5">
                    <p className="text-xs uppercase text-muted-foreground">
                      Banner preview
                    </p>
                    {p.image ? (
                      <img
                        src={p.image}
                        alt=""
                        className="mt-3 max-h-48 w-full object-cover"
                      />
                    ) : null}
                    <h3 className="mt-3 font-semibold">{p.title}</h3>
                    <p>{p.body}</p>
                    <span className="underline">{p.button}</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      patch({
                        promotions: draft.promotions.filter(
                          (item) => item.id !== p.id,
                        ),
                      })
                    }
                  >
                    Remove promotion
                  </Button>
                </div>
              );
            })}
          </section>
        ) : null}
      </fieldset>
    </div>
  );
}
