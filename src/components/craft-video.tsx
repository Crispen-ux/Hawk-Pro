import { useWebsiteContent } from "@/hooks/use-website-content";
export default function CraftVideo() {
  const { video } = useWebsiteContent();
  if (!video.enabled || !video.src) return null;
  return (
    <section className="mx-auto max-w-7xl space-y-5 px-4 py-16 lg:px-8">
      <h2 className="font-serif text-4xl font-bold uppercase">{video.title}</h2>
      <p className="text-muted-foreground">{video.body}</p>
      <video
        key={video.src}
        controls
        playsInline
        preload="none"
        poster={video.poster || undefined}
        className="aspect-video w-full bg-black"
        aria-label={video.title}
      >
        <source src={video.src} />
        <track kind="captions" />
        Your browser does not support video playback.
      </video>
    </section>
  );
}
