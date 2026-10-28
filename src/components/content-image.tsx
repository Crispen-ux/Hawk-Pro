import { useContext, type CSSProperties } from "react";
import { ContentPreview, useWebsiteContent } from "@/hooks/use-website-content";
import type {
  Slot,
  ContentImage as ImageValue,
} from "../../db/website-content";
export function FramedImage({
  image,
  mobile,
  className = "",
  priority = false,
}: {
  image: ImageValue;
  mobile?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const style = {
    "--frame-x": image.desktop.x + "%",
    "--frame-y": image.desktop.y + "%",
    "--frame-z": image.desktop.zoom,
    "--mobile-x": image.mobile.x + "%",
    "--mobile-y": image.mobile.y + "%",
    "--mobile-z": image.mobile.zoom,
  } as CSSProperties;
  const f =
    mobile === undefined ? undefined : mobile ? image.mobile : image.desktop;
  return (
    <div className={"content-image overflow-hidden " + className} style={style}>
      <img
        src={image.src}
        alt={image.alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        style={
          f
            ? {
                objectPosition: f.x + "% " + f.y + "%",
                transformOrigin: f.x + "% " + f.y + "%",
                transform: "scale(" + f.zoom + ")",
              }
            : undefined
        }
      />
    </div>
  );
}
export default function ContentImage({
  slot,
  className,
  priority,
}: {
  slot: Slot;
  className?: string;
  priority?: boolean;
}) {
  const content = useWebsiteContent();
  const preview = useContext(ContentPreview);
  return (
    <FramedImage
      image={content.images[slot]}
      mobile={preview?.mobile}
      className={className}
      priority={priority}
    />
  );
}
export function ContentOverlay({ slot }: { slot: Slot }) {
  const content = useWebsiteContent();
  return (
    <div
      className="absolute inset-0 -z-10 bg-background"
      style={{ opacity: content.images[slot].overlay / 100 }}
    />
  );
}
