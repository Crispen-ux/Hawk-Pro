import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWebsiteContent } from "@/hooks/use-website-content";
import { promotionActive } from "../../db/website-content";
export default function Promotions({
  previewPath,
}: { previewPath?: string } = {}) {
  const { promotions } = useWebsiteContent();
  const location = useLocation();
  const pathname = previewPath ?? location.pathname;
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      {promotions
        .filter(
          (p) =>
            promotionActive(p, now) &&
            (p.placement === "strip" ||
              (p.placement === "home" && pathname === "/") ||
              (p.placement === "shop" && pathname === "/shop")),
        )
        .map((p) => (
          <aside
            key={p.id}
            aria-label="Promotion"
            className={
              p.placement === "strip"
                ? "bg-primary px-4 py-3 text-center text-primary-foreground"
                : "mx-auto my-6 grid max-w-7xl gap-6 border bg-card p-6 md:grid-cols-2"
            }
          >
            {p.image && p.placement !== "strip" ? (
              <img
                src={p.image}
                alt=""
                className="aspect-[3/1] w-full object-cover"
              />
            ) : null}
            <div className="space-y-2">
              <p className="font-semibold">{p.title}</p>
              {p.body ? <p>{p.body}</p> : null}
              {p.button ? (
                <Link
                  className="inline-block underline underline-offset-4"
                  to={p.href}
                >
                  {p.button}
                </Link>
              ) : null}
            </div>
          </aside>
        ))}
    </>
  );
}
