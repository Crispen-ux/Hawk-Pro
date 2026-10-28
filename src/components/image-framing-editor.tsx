import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FramedImage } from "./content-image";
import { defaultImageFraming, type ImageFraming } from "../../db/image-framing";
export default function ImageFramingEditor({
  src,
  value,
  onChange,
  disabled = false,
  aspect = "4/3",
  label = "Image framing",
}: {
  src: string;
  value: ImageFraming;
  onChange: (value: ImageFraming) => void;
  disabled?: boolean;
  aspect?: string;
  label?: string;
}) {
  const [mobile, setMobile] = useState(false);
  const drag = useRef<{ x: number; y: number; fx: number; fy: number } | null>(
    null,
  );
  const mode = mobile ? "mobile" : "desktop";
  const frame = value[mode];
  const update = (patch: Partial<typeof frame>) =>
    onChange({ ...value, [mode]: { ...frame, ...patch } });
  return (
    <fieldset
      disabled={disabled}
      className="min-w-0 space-y-4 rounded-lg border p-4"
    >
      <legend className="px-2 font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={mobile ? "outline" : "default"}
          aria-pressed={!mobile}
          onClick={() => setMobile(false)}
        >
          Desktop framing
        </Button>
        <Button
          type="button"
          variant={mobile ? "default" : "outline"}
          aria-pressed={mobile}
          onClick={() => setMobile(true)}
        >
          Mobile framing
        </Button>
      </div>
      <div
        className="relative mx-auto touch-none overflow-hidden rounded border bg-muted"
        style={{
          aspectRatio: aspect,
          maxWidth: mobile ? 320 : undefined,
          cursor: disabled ? "default" : "move",
        }}
        onPointerDown={(e) => {
          if (disabled) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            fx: frame.x,
            fy: frame.y,
          };
        }}
        onPointerMove={(e) => {
          if (disabled || !drag.current) return;
          const box = e.currentTarget.getBoundingClientRect();
          const img = e.currentTarget
            .querySelector("img")
            ?.getBoundingClientRect();
          if (!img) return;
          const gx = box.width - img.width,
            gy = box.height - img.height;
          update({
            x:
              Math.abs(gx) < 1
                ? drag.current.fx
                : Math.max(
                    0,
                    Math.min(
                      100,
                      drag.current.fx +
                        ((e.clientX - drag.current.x) / gx) * 100,
                    ),
                  ),
            y:
              Math.abs(gy) < 1
                ? drag.current.fy
                : Math.max(
                    0,
                    Math.min(
                      100,
                      drag.current.fy +
                        ((e.clientY - drag.current.y) / gy) * 100,
                    ),
                  ),
          });
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <FramedImage
          key={src}
          image={{ src, alt: "Image framing preview", overlay: 0, ...value }}
          mobile={mobile}
          fit="contain"
          className="absolute inset-0 size-full"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Drag to position. 100% fits the full image; zoom from 10% to 300%.
        Desktop and mobile adjustments save separately.
      </p>
      {(
        [
          ["zoom", "Zoom", 0.1, 3, 0.01],
          ["x", "Horizontal position", 0, 100, 1],
          ["y", "Vertical position", 0, 100, 1],
        ] as const
      ).map(([key, text, min, max, step]) => (
        <label className="grid gap-2 text-sm" key={key}>
          {text}: {Math.round(frame[key] * (key === "zoom" ? 100 : 1))}%
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
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange({ ...value, [mode]: defaultImageFraming()[mode] })
        }
      >
        Reset this framing
      </Button>
    </fieldset>
  );
}
