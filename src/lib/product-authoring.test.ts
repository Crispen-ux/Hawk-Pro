import { expect, it } from "vitest";
import { speaker } from "../test-fixtures/commerce";
import { productInputSchema } from "../../db/validation";
import {
  duplicateProduct,
  generateProductDescription,
} from "./product-authoring";
it("duplicates editable product content while removing publication, identity and stock", () => {
  const source = speaker();
  source.images = ["https://example.com/speaker.png"];
  source.specs = [{ label: "Driver", value: "15 inch" }];
  const copy = duplicateProduct(source, "abcd1234");
  expect(productInputSchema.safeParse(copy).success).toBe(true);
  expect(copy).toMatchObject({
    published: false,
    availability: "tbc",
    details: { sku: "" },
    name: source.name + " (copy)",
  });
  expect(copy.slug).not.toBe(source.slug);
  expect(copy).not.toHaveProperty("id");
  expect(copy).not.toHaveProperty("stockAvailable");
  copy.specs[0].value = "12 inch";
  copy.images.push("https://example.com/new.png");
  expect(source.specs[0].value).toBe("15 inch");
  expect(source.images).toHaveLength(1);
});
it("generates copy from confirmed details and includes pack contents", () => {
  const source = speaker();
  const copy = generateProductDescription(source);
  expect(copy.description).toContain("Continuous power: 500 W");
  expect(copy.description).toContain("Sold individually (1 unit)");
  expect(copy.description).toContain("One speaker and a manual");
  expect(productInputSchema.safeParse({ ...source, ...copy }).success).toBe(
    true,
  );
});
it("does not invent missing specifications or warranty and requires a name", () => {
  const source = speaker();
  source.details.continuousWatts = null;
  source.details.warranty = "";
  const copy = generateProductDescription(source);
  expect(copy.description).not.toContain("Continuous power");
  expect(copy.description).not.toContain("Warranty");
  expect(() => generateProductDescription({ ...source, name: "" })).toThrow(
    "Enter a product name",
  );
});
