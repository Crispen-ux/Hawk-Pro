import { useState } from "react";
import { expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProductImageFraming from "./product-image-framing";
import { DEFAULT_PRODUCT_DETAILS } from "../../../../db/product-details";
const images = ["https://example.com/one.webp", "https://example.com/two.webp"];
function Demo() {
  const [details, setDetails] = useState(DEFAULT_PRODUCT_DETAILS);
  return (
    <ProductImageFraming
      images={images}
      details={details}
      onChange={setDetails}
    />
  );
}
it("stores each gallery image independently when switching between them", () => {
  render(<Demo />);
  fireEvent.change(screen.getByRole("slider", { name: /Zoom/ }), {
    target: { value: "1.5" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Gallery image" }), {
    target: { value: images[1] },
  });
  expect(screen.getByRole("slider", { name: /Zoom/ })).toHaveValue("1");
  fireEvent.change(screen.getByRole("slider", { name: /Zoom/ }), {
    target: { value: ".5" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Gallery image" }), {
    target: { value: images[0] },
  });
  expect(screen.getByRole("slider", { name: /Zoom/ })).toHaveValue("1.5");
});
