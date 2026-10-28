import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { DEFAULT_CONTENT, type WebsiteContent } from "../../db/website-content";
export const ContentPreview = createContext<{
  content: WebsiteContent;
  mobile?: boolean;
} | null>(null);
export function useWebsiteContentState() {
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
  return {
    content: preview?.content ?? query.data?.content ?? DEFAULT_CONTENT,
    ready: !!preview || !!query.data,
    error: !preview && query.isError,
  };
}

export function useWebsiteContent() {
  return useWebsiteContentState().content;
}
