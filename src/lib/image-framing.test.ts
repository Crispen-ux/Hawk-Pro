import { expect, it } from "vitest";
import { defaultImageFraming } from "../../db/image-framing";
import {
  normaliseProductDetails,
  productDetailsSchema,
  DEFAULT_PRODUCT_DETAILS,
} from "../../db/product-details";
import { promotionSchema } from "../../db/website-content";
it("preserves per-image product frames without altering legacy sizing", () => {
  const framing = defaultImageFraming();
  framing.mobile.zoom = 0.5;
  framing.desktop.x = 20;
  const saved = {
    ...DEFAULT_PRODUCT_DETAILS,
    imageDisplayScale: 75,
    imageFrames: [{ src: "https://example.com/a.webp", framing }],
  };
  expect(productDetailsSchema.parse(saved)).toEqual(saved);
  expect(normaliseProductDetails(saved)).toEqual(saved);
  expect(
    normaliseProductDetails({ imageDisplayScale: 75 }).imageFrames,
  ).toBeUndefined();
});
it("preserves promotion framing and accepts older promotions", () => {
  const p = {
    id: "p",
    enabled: true,
    placement: "home",
    title: "Sale",
    body: "",
    button: "Shop",
    href: "/shop",
    image: "https://example.com/p.webp",
    start: "",
    end: "",
  };
  expect(promotionSchema.safeParse(p).success).toBe(true);
  const imageFraming = defaultImageFraming();
  imageFraming.desktop.zoom = 3;
  expect(promotionSchema.parse({ ...p, imageFraming }).imageFraming).toEqual(
    imageFraming,
  );
  imageFraming.mobile.zoom = 0;
  expect(promotionSchema.safeParse({ ...p, imageFraming }).success).toBe(false);
});
