import { expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
vi.mock("@/hooks/use-catalogue", () => ({
  useCatalogue: () => ({
    products: [
      {
        slug: "speaker-a",
        name: "HAWK Speaker A",
        shortDescription: "A speaker for events",
        images: ["https://example.com/speaker.webp"],
      },
    ],
    loading: false,
  }),
}));
import SiteSeo from "./site-seo";
it("loads product metadata from the catalogue", () => {
  render(
    <MemoryRouter initialEntries={["/shop/speaker-a"]}>
      <SiteSeo />
    </MemoryRouter>,
  );
  expect(document.title).toBe("HAWK Speaker A | HAWK Audio");
  expect(
    document.head.querySelector('meta[property="og:image"]'),
  ).toHaveAttribute("content", "https://example.com/speaker.webp");
});
it("handles malformed product URLs and prevents indexing private pages", () => {
  const { unmount } = render(
    <MemoryRouter initialEntries={["/shop/%E0%A4"]}>
      <SiteSeo />
    </MemoryRouter>,
  );
  expect(document.title).toBe("Page not found | HAWK Audio");
  unmount();
  render(
    <MemoryRouter initialEntries={["/admin/settings"]}>
      <SiteSeo />
    </MemoryRouter>,
  );
  expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
});
