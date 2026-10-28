import { useState } from "react";
import { Button } from "@/components/ui/button";
import PromotionBanner, { type Promotion } from "@/components/promotion-banner";
export default function PromotionPreview({
  promotion,
}: {
  promotion: Promotion;
}) {
  const [mobile, setMobile] = useState(false);
  return (
    <section className="space-y-4 rounded-lg border bg-muted/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Live banner preview</h3>
          <p className="text-sm text-muted-foreground">
            {promotion.placement === "strip"
              ? "Announcement strip · all pages"
              : "Homepage / shop banner"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mobile ? "outline" : "default"}
            aria-pressed={!mobile}
            onClick={() => setMobile(false)}
          >
            Desktop
          </Button>
          <Button
            type="button"
            variant={mobile ? "default" : "outline"}
            aria-pressed={mobile}
            onClick={() => setMobile(true)}
          >
            Mobile
          </Button>
        </div>
      </div>
      <div
        className="mx-auto overflow-hidden rounded-lg border bg-background"
        style={{ maxWidth: mobile ? 390 : undefined }}
      >
        <PromotionBanner promotion={promotion} preview />
      </div>
      <p className="text-xs text-muted-foreground">
        Preview shows your current edits, including disabled or scheduled
        banners.{" "}
        {promotion.placement === "strip"
          ? "Announcement strips show text and a button; choose a homepage or shop banner to display an image."
          : "The full image is fitted without cropping."}
      </p>
    </section>
  );
}
