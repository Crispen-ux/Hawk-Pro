import { Link } from "react-router-dom";
import { LOGO_URL } from "@/data/site.ts";

export default function Logo({ className = "h-14" }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="HAWK home"
      className="inline-flex items-center focus-visible:outline-2 focus-visible:outline-primary"
    >
      <img
        src={LOGO_URL}
        alt="HAWK"
        className={`${className} w-auto object-contain invert dark:invert-0`}
      />
    </Link>
  );
}
