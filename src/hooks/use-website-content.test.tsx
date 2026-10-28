import { expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ContentImage from "@/components/content-image";
import { request } from "@/lib/api";
import { DEFAULT_CONTENT } from "../../db/website-content";
vi.mock("@/lib/api", () => ({ request: vi.fn() }));
it("never flashes the original image while published content is loading", async () => {
  let resolve!: (v: unknown) => void;
  vi.mocked(request).mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const { container } = render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ContentImage slot="home-hero" className="aspect-video" />
    </QueryClientProvider>,
  );
  expect(screen.getByRole("img", { name: "Loading image" })).toHaveAttribute(
    "aria-busy",
    "true",
  );
  expect(container.querySelector("img")).toBeNull();
  const content = structuredClone(DEFAULT_CONTENT);
  content.images["home-hero"].src = "https://example.com/published-hero.webp";
  content.images["home-hero"].alt = "Published hero";
  await act(async () => {
    resolve({ content });
  });
  expect(await screen.findByAltText("Published hero")).toHaveAttribute(
    "src",
    "https://example.com/published-hero.webp",
  );
});
it("does not restore the original image when loading fails", async () => {
  vi.mocked(request).mockRejectedValue(new Error("Offline"));
  const { container } = render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ContentImage slot="repairs-hero" />
    </QueryClientProvider>,
  );
  expect(
    await screen.findByRole("img", { name: "Image unavailable" }),
  ).toHaveAttribute("aria-busy", "false");
  expect(container.querySelector("img")).toBeNull();
});
