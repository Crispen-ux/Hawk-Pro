import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FramedImage } from "@/components/content-image";
import {
  DEFAULT_FRAME,
  SLOTS,
  type Slot,
  type ContentImage,
} from "../../../../db/website-content";
export default function ImageEditor({
  slot,
  image,
  onChange,
  onUpload,
  library,
}: {
  slot: Slot;
  image: ContentImage;
  onChange: (v: ContentImage) => void;
  onUpload: (f: File) => Promise<string>;
  library: { url: string; name: string }[];
}) {
  const [mobile, setMobile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [size, setSize] = useState(0);
  const drag = useRef<{ x: number; y: number; fx: number; fy: number } | null>(
    null,
  );
  useEffect(() => {
    let active = true;
    setSize(0);
    const original = new Image();
    original.onload = () => {
      if (active) setSize(original.naturalWidth);
    };
    original.src = image.src;
    return () => {
      active = false;
    };
  }, [image.src]);
  const mode = mobile ? "mobile" : "desktop";
  const frame = image[mode];
  const update = (v: Partial<typeof frame>) =>
    onChange({ ...image, [mode]: { ...frame, ...v } });
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange({ ...image, src: await onUpload(file) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <h2>{SLOTS[slot][1]}</h2>
        <span className="text-sm text-muted-foreground">
          Recommended {SLOTS[slot][4]} px
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          variant={!mobile ? "default" : "outline"}
          onClick={() => setMobile(false)}
        >
          Desktop crop
        </Button>
        <Button
          variant={mobile ? "default" : "outline"}
          onClick={() => setMobile(true)}
        >
          Mobile crop
        </Button>
      </div>
      <div
        className={
          "relative mx-auto overflow-hidden bg-muted touch-none cursor-move " +
          (mobile ? "w-[280px] max-w-full" : "w-full")
        }
        style={{
          aspectRatio:
            slot === "category-speakers"
              ? "4/5"
              : slot.startsWith("category") ||
                  (slot.startsWith("home-") && slot !== "home-hero")
                ? "4/3"
                : slot === "about-main"
                  ? "21/9"
                  : mobile
                    ? "3/4"
                    : "16/7",
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            fx: frame.x,
            fy: frame.y,
          };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const box = e.currentTarget.getBoundingClientRect();
          const picture = e.currentTarget
            .querySelector("img")
            ?.getBoundingClientRect();
          if (!picture) return;
          const gapX = box.width - picture.width;
          const gapY = box.height - picture.height;
          update({
            x:
              Math.abs(gapX) < 1
                ? drag.current.fx
                : Math.max(
                    0,
                    Math.min(
                      100,
                      drag.current.fx +
                        ((e.clientX - drag.current.x) / gapX) * 100,
                    ),
                  ),
            y:
              Math.abs(gapY) < 1
                ? drag.current.fy
                : Math.max(
                    0,
                    Math.min(
                      100,
                      drag.current.fy +
                        ((e.clientY - drag.current.y) / gapY) * 100,
                    ),
                  ),
          });
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <FramedImage
          image={image}
          mobile={mobile}
          className="absolute inset-0 size-full"
        />
        <div className="pointer-events-none absolute inset-0 border border-white/40" />
        {slot.endsWith("hero") ? (
          <div
            className="pointer-events-none absolute inset-0 bg-background"
            style={{ opacity: image.overlay / 100 }}
          />
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        Drag the picture to reposition it. Use the sliders for precise,
        keyboard-accessible adjustments.
      </p>
      {(
        [
          ["zoom", "Zoom", 0.1, 3, 0.01],
          ["x", "Horizontal position", 0, 100, 1],
          ["y", "Vertical position", 0, 100, 1],
        ] as const
      ).map(([key, label, min, max, step]) => (
        <label className="grid gap-2" key={key}>
          {label}:{" "}
          {key === "zoom"
            ? Math.round(frame[key] * 100) + "%"
            : Math.round(frame[key]) + "%"}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={frame[key]}
            onChange={(e) => update({ [key]: Number(e.target.value) })}
          />
        </label>
      ))}
      <p className="text-sm text-muted-foreground">
        100% fills the frame. Zoom out to 10% to show more of the picture; the
        frame background shows around smaller images.
      </p>
      <Button
        variant="outline"
        onClick={() => onChange({ ...image, [mode]: { ...DEFAULT_FRAME } })}
      >
        Reset this crop
      </Button>
      <label className="grid gap-2">
        Replace image (JPEG, PNG or WebP)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {busy ? <p role="status">Compressing and uploading…</p> : null}
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      <label className="grid gap-2">
        Image URL
        <input
          className="rounded border bg-background p-2"
          value={image.src}
          onChange={(e) => {
            setSize(0);
            onChange({ ...image, src: e.target.value });
          }}
          onBlur={() => {
            const im = new Image();
            im.onload = () => setSize(im.naturalWidth);
            im.src = image.src;
          }}
        />
      </label>
      {(size > 0 && size / frame.zoom < 800) || frame.zoom > 2 ? (
        <p className="text-amber-600">
          This crop may look soft on larger screens. Use a higher-resolution
          original or reduce zoom.
        </p>
      ) : null}
      <label className="grid gap-2">
        Alternative text
        <input
          className="rounded border bg-background p-2"
          maxLength={300}
          value={image.alt}
          onChange={(e) => onChange({ ...image, alt: e.target.value })}
        />
      </label>
      {slot.endsWith("hero") ? (
        <label className="grid gap-2">
          Text readability overlay: {image.overlay}%
          <input
            type="range"
            min={0}
            max={90}
            value={image.overlay}
            onChange={(e) =>
              onChange({ ...image, overlay: Number(e.target.value) })
            }
          />
        </label>
      ) : null}
      {library.length ? (
        <div>
          <h3 className="mb-3">Reuse from media library</h3>
          <div className="grid grid-cols-3 gap-2">
            {library.map((item) => (
              <button
                key={item.url}
                title={item.name}
                className="rounded border p-1 text-left"
                onClick={() => onChange({ ...image, src: item.url })}
              >
                <img
                  src={item.url}
                  alt={item.name}
                  className="aspect-video w-full object-cover"
                />
                <span className="block truncate text-xs">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
