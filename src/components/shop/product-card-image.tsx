/** Shared catalogue presentation; detail-page galleries retain their own sizing. */
export default function ProductCardImage({
  src,
  alt,
  scale = 100,
}: {
  src: string;
  alt: string;
  scale?: number;
}) {
  const percent = Number.isFinite(scale)
    ? Math.max(25, Math.min(100, scale))
    : 100;
  return (
    <div className="absolute inset-4 flex items-end justify-center sm:inset-6">
      <div style={{ width: percent + "%", height: percent + "%" }}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="size-full origin-bottom object-contain object-bottom transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>
    </div>
  );
}
