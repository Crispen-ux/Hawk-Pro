import { motion } from "motion/react";
import { VideoIcon } from "lucide-react";
import { CRAFT_VIDEO } from "@/data/site.ts";

// Full-width cinematic video band. Falls back to a clearly marked placeholder until footage is supplied.
export default function CraftVideo() {
  const hasVideo = CRAFT_VIDEO.src.length > 0;

  return (
    <section className="relative isolate overflow-hidden border-t bg-black text-white">
      {hasVideo ? (
        <video
          className="absolute inset-0 -z-20 size-full object-cover"
          src={CRAFT_VIDEO.src}
          poster={CRAFT_VIDEO.poster || undefined}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      ) : (
        <div className="absolute inset-0 -z-20 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/40 to-black/10" />
      <div className="mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-end gap-6 px-4 py-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl space-y-4"
        >
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.4em] text-primary">
            <span className="h-px w-8 bg-primary" /> The build
          </p>
          <h2 className="text-balance font-serif text-5xl font-extrabold uppercase leading-[0.92] sm:text-7xl">
            Precision, cut by cut.
          </h2>
          <p className="max-w-md text-white/75">
            A look at how speaker cabinets take shape: wood, cut with care on a
            CNC machine.
          </p>
          {!hasVideo && (
            <p className="inline-flex items-center gap-2 border border-white/20 px-3 py-2 text-xs text-white/70">
              <VideoIcon className="size-4" /> Placeholder: CNC footage to be
              added
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
