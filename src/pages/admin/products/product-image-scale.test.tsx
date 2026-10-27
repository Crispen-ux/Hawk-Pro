import { useState } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import ProductImageScale from "./product-image-scale";
import {
  normaliseProductDetails,
  productDetailsSchema,
} from "../../../../db/product-details";
afterEach(cleanup);
it("preserves older product details and defaults their display scale", () => {
  expect(
    normaliseProductDetails({ sku: "OLD-15", soldAs: "single" }),
  ).toMatchObject({ sku: "OLD-15", soldAs: "single", imageDisplayScale: 100 });
});
it("accepts saved scales and rejects out-of-range or fractional input", () => {
  expect(
    productDetailsSchema.parse({ imageDisplayScale: 50 }).imageDisplayScale,
  ).toBe(50);
  for (const imageDisplayScale of [0, 101, 50.5])
    expect(productDetailsSchema.safeParse({ imageDisplayScale }).success).toBe(
      false,
    );
});
it("updates the catalogue preview immediately and resets without submitting", () => {
  function Editor() {
    const [value, setValue] = useState(100);
    return (
      <ProductImageScale
        src="https://example.com/speaker.png"
        name="Single speaker"
        value={value}
        onChange={setValue}
      />
    );
  }
  render(<Editor />);
  fireEvent.change(
    screen.getByRole("slider", { name: "Image display scale" }),
    { target: { value: "50" } },
  );
  expect(screen.getByText("50%")).toBeTruthy();
  const image = screen.getByAltText("Single speaker");
  expect(image.parentElement?.style.height).toBe("50%");
  expect(image.parentElement?.style.width).toBe("50%");
  fireEvent.click(screen.getByRole("button", { name: "Reset to 100%" }));
  expect(image.parentElement?.style.height).toBe("100%");
});
