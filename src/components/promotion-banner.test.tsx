import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PromotionBanner, { type Promotion } from "./promotion-banner";
import {
  defaultPromotionStyle,
  promotionSchema,
} from "../../db/website-content";
const promotion: Promotion = {
  id: "sale",
  enabled: true,
  placement: "home",
  title: "Weekend sound sale",
  body: "Save on speakers",
  button: "Browse offers",
  href: "/shop",
  image: "https://example.com/speakers.webp",
  start: "",
  end: "",
};
it("uses the same text, image and styling for preview and storefront", () => {
  const p = {
    ...promotion,
    style: {
      ...defaultPromotionStyle(),
      textSize: "large" as const,
      alignment: "right" as const,
      background: "#112233",
      buttonStyle: "outline" as const,
    },
  };
  const { rerender, container } = render(
    <MemoryRouter>
      <PromotionBanner promotion={p} preview />
    </MemoryRouter>,
  );
  expect(screen.getByLabelText("Promotion")).toHaveStyle({
    backgroundColor: "#112233",
    textAlign: "right",
  });
  expect(screen.getByText(p.title)).toHaveStyle({ fontSize: "48px" });
  expect(screen.getByText(p.button).style.backgroundColor).toBe("transparent");
  expect(screen.queryByRole("link")).toBeNull();
  expect(container.querySelector("img")).toHaveAttribute("src", p.image);
  rerender(
    <MemoryRouter>
      <PromotionBanner promotion={p} />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: p.button })).toHaveAttribute(
    "href",
    "/shop",
  );
  expect(screen.getByLabelText("Promotion")).toHaveStyle({
    backgroundColor: "#112233",
    textAlign: "right",
  });
});
it("keeps strips text-only and supports older saved promotions", () => {
  expect(promotionSchema.safeParse(promotion).success).toBe(true);
  render(
    <MemoryRouter>
      <PromotionBanner promotion={{ ...promotion, placement: "strip" }} />
    </MemoryRouter>,
  );
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByText(promotion.title)).toBeVisible();
});
it("rejects invalid custom colours", () => {
  expect(
    promotionSchema.safeParse({
      ...promotion,
      style: { ...defaultPromotionStyle(), background: "url(evil)" },
    }).success,
  ).toBe(false);
});
