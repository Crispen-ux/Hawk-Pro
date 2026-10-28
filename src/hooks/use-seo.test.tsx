import { expect, it } from "vitest";
import { render } from "@testing-library/react";
import { useSeo, type Seo } from "./use-seo";
function Page(props: Seo) {
  useSeo(props);
  return null;
}
it("replaces route metadata and clears stale structured data on navigation", () => {
  const { rerender, unmount } = render(
    <Page
      title="About HAWK"
      description="About description"
      canonical="https://hawk.example/about"
      image="https://hawk.example/logo.png"
      jsonLd={{ "@type": "Organization", name: "HAWK" }}
    />,
  );
  expect(document.title).toBe("About HAWK");
  expect(
    document.head.querySelector('meta[property="og:title"]'),
  ).toHaveAttribute("content", "About HAWK");
  expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://hawk.example/about",
  );
  expect(document.getElementById("hawk-seo-jsonld")).toBeInTheDocument();
  rerender(<Page title="Account" description="Secure account" noindex />);
  expect(document.title).toBe("Account");
  expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
  expect(document.getElementById("hawk-seo-jsonld")).toBeNull();
  rerender(
    <Page
      title="Shop"
      description="Shop audio"
      canonical="https://hawk.example/shop"
    />,
  );
  expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
    "content",
    "index, follow",
  );
  expect(
    document.head.querySelectorAll('meta[property="og:title"]'),
  ).toHaveLength(1);
  unmount();
});
