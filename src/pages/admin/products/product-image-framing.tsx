import { useState } from "react";
import ImageFramingEditor from "@/components/image-framing-editor";
import { defaultImageFraming } from "../../../../db/image-framing";
import type { ProductDetails } from "../../../../db/product-details";
export default function ProductImageFraming({
  images,
  details,
  onChange,
  disabled,
}: {
  images: string[];
  details: ProductDetails;
  onChange: (value: ProductDetails) => void;
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState("");
  const src = images.includes(selected) ? selected : images[0];
  const [square, setSquare] = useState(false);
  if (!src)
    return (
      <p className="text-sm text-muted-foreground">
        Upload a product image to adjust zoom and positioning.
      </p>
    );
  const framing =
    details.imageFrames?.find((i) => i.src === src)?.framing ??
    defaultImageFraming();
  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-semibold">Product image zoom and position</h3>
      <p className="text-sm text-muted-foreground">
        Choose a gallery image to frame it. The first image appears on product
        cards; each gallery image also uses its framing on the product page.
        Click-to-enlarge still shows the original.
      </p>
      <label className="grid gap-2 text-sm">
        Gallery image
        <select
          className="rounded border bg-background p-2"
          value={src}
          disabled={disabled}
          onChange={(e) => setSelected(e.target.value)}
        >
          {images.map((url, i) => (
            <option key={url + i} value={url}>
              Image {i + 1}
              {i === 0 ? " · product card" : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm">
        Preview shape
        <select
          className="rounded border bg-background p-2"
          value={square ? "square" : "card"}
          onChange={(e) => setSquare(e.target.value === "square")}
        >
          <option value="card">Product card (4:3)</option>
          <option value="square">Product page (square)</option>
        </select>
      </label>
      <ImageFramingEditor
        key={src}
        src={src}
        value={framing}
        disabled={disabled}
        aspect={square ? "1/1" : "4/3"}
        onChange={(value) =>
          onChange({
            ...details,
            imageFrames: [
              ...(details.imageFrames ?? []).filter(
                (item) => item.src !== src && images.includes(item.src),
              ),
              { src, framing: value },
            ],
          })
        }
      />
    </div>
  );
}
