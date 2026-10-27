import { useId } from "react";
import ProductCardImage from "@/components/shop/product-card-image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ProductImageScale({
  src,
  name,
  value,
  disabled,
  onChange,
}: {
  src?: string;
  name: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>Image display scale</Label>
        <output htmlFor={id} className="text-sm tabular-nums">
          {value}%
        </output>
      </div>
      <input
        id={id}
        type="range"
        min="25"
        max="100"
        step="1"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-describedby={id + "-help"}
        className="w-full cursor-pointer accent-primary disabled:opacity-50"
      />
      <p id={id + "-help"} className="text-sm text-muted-foreground">
        Use a larger scale for complete sets and a smaller scale for single
        speakers. Applies to shop and featured cards only; detail-page images
        stay unchanged. Visual sizing does not represent exact physical
        dimensions.
      </p>
      <div
        className="relative aspect-[4/3] max-w-sm overflow-hidden border bg-muted"
        aria-label="Catalogue image preview"
      >
        {src ? (
          <ProductCardImage
            src={src}
            alt={name || "Product preview"}
            scale={value}
          />
        ) : (
          <p className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Upload an image to preview its display scale.
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          First gallery image · aligned to the bottom
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || value === 100}
          onClick={() => onChange(100)}
        >
          Reset to 100%
        </Button>
      </div>
    </div>
  );
}
