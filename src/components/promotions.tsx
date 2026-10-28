import PromotionBanner from "./promotion-banner";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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
          <div
            key={p.id}
            className={
              p.placement === "strip"
                ? ""
                : "mx-auto my-6 w-full max-w-7xl px-4 lg:px-8"
            }
          >
            <PromotionBanner promotion={p} />
          </div>
        ))}
    </>
  );
}
