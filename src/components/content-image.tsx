import {
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
  const host = useRef<HTMLDivElement>(null);
  const picture = useRef<HTMLImageElement>(null);
  const [cover, setCover] = useState({ width: 100, height: 100 });
  const measure = () => {
    const box = host.current;
    const img = picture.current;
    if (!box || !img?.naturalWidth || !box.clientWidth || !box.clientHeight)
      return;
    const scale = Math.max(
      box.clientWidth / img.naturalWidth,
      box.clientHeight / img.naturalHeight,
    );
    const width = ((img.naturalWidth * scale) / box.clientWidth) * 100;
    const height = ((img.naturalHeight * scale) / box.clientHeight) * 100;
    setCover((old) =>
      old.width === width && old.height === height ? old : { width, height },
    );
  };
  useEffect(() => {
    if (!host.current) return;
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(host.current);
    return () => observer.disconnect();
  }, [image.src]);
  const style = {
    "--cover-width": cover.width + "%",
    "--cover-height": cover.height + "%",
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
    <div
      ref={host}
      className={"content-image overflow-hidden bg-muted " + className}
      style={style}
    >
      <div className="relative size-full">
        <img
          ref={picture}
          onLoad={measure}
          draggable={false}
          src={image.src}
          alt={image.alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          style={
            f
              ? {
                  left: f.x + "%",
                  top: f.y + "%",
                  transformOrigin: f.x + "% " + f.y + "%",
                  transform:
                    "translate(-" +
                    f.x +
                    "%, -" +
                    f.y +
                    "%) scale(" +
                    f.zoom +
                    ")",
                }
              : undefined
          }
        />
      </div>
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
