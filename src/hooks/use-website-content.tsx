import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { DEFAULT_CONTENT, type WebsiteContent } from "../../db/website-content";
export const ContentPreview = createContext<{
  content: WebsiteContent;
  mobile?: boolean;
} | null>(null);
export function useWebsiteContent() {
  const preview = useContext(ContentPreview);
  const query = useQuery({
    queryKey: ["website-content"],
    queryFn: () =>
      request<{ content: WebsiteContent }>(
        "/api/settings?section=website-content",
      ),
    staleTime: 30000,
    refetchOnWindowFocus: true,
    enabled: !preview,
  });
  return preview?.content ?? query.data?.content ?? DEFAULT_CONTENT;
}
