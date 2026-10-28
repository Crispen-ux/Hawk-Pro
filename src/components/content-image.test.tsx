import { expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FramedImage } from "./content-image";
import { DEFAULT_CONTENT } from "../../db/website-content";
it("scales the full original image rather than an already cropped rectangle", () => {
  const image = structuredClone(DEFAULT_CONTENT.images["home-hero"]);
  image.desktop.zoom = 0.5;
  const { container } = render(<FramedImage image={image} mobile={false} />);
  const host = container.firstElementChild as HTMLElement;
  const img = screen.getByRole("img") as HTMLImageElement;
  Object.defineProperties(host, {
    clientWidth: { value: 800 },
    clientHeight: { value: 400 },
  });
  Object.defineProperties(img, {
    naturalWidth: { value: 1600 },
    naturalHeight: { value: 1600 },
  });
  fireEvent.load(img);
  expect(host.style.getPropertyValue("--cover-width")).toBe("100%");
  expect(host.style.getPropertyValue("--cover-height")).toBe("200%");
  expect(img.style.transform).toBe("translate(-50%, -50%) scale(0.5)");
});
