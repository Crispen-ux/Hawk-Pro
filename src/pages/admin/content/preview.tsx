import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { request } from "@/lib/api";
import { ContentPreview } from "@/hooks/use-website-content";
import {
  contentSchema,
  type WebsiteContent,
} from "../../../../db/website-content";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Promotions from "@/components/promotions";
import Index from "@/pages/Index";
import Rentals from "@/pages/rentals/page";
import Repairs from "@/pages/repairs/page";
import About from "@/pages/about/page";
export default function ContentPagePreview() {
  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [error, setError] = useState("");
  const [params] = useSearchParams();
  useEffect(() => {
    let active = true;
    const read = () => {
      try {
        const parsed = contentSchema.parse(
          JSON.parse(sessionStorage.getItem("hawk-content-preview") || "null"),
        );
        if (active) setContent(parsed);
      } catch {
        if (active) setError("Save a valid draft, then reopen the preview.");
      }
    };
    request<{ user: { role: string } }>("/api/account")
      .then(({ user }) => {
        if (user.role !== "admin")
          throw new Error("Administrator access required");
        read();
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  if (error)
    return (
      <p role="alert" className="p-6">
        {error}
      </p>
    );
  if (!content) return <p className="p-6">Loading draft preview…</p>;
  const page = params.get("page");
  return (
    <ContentPreview.Provider value={{ content }}>
      <div inert>
        <Header />
        <Promotions
          previewPath={
            page === "Home"
              ? "/"
              : page === "Rentals"
                ? "/rentals"
                : page === "Repairs"
                  ? "/repairs"
                  : "/about"
          }
        />
        {page === "Home" ? (
          <Index />
        ) : page === "Rentals" ? (
          <Rentals />
        ) : page === "Repairs" ? (
          <Repairs />
        ) : (
          <About />
        )}
        <Footer />
      </div>
    </ContentPreview.Provider>
  );
}
