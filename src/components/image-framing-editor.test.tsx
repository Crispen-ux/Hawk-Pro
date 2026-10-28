import { useState } from "react";
import { expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ImageFramingEditor from "./image-framing-editor";
import { defaultImageFraming } from "../../db/image-framing";
function Demo() {
  const [value, setValue] = useState(defaultImageFraming);
  return (
    <ImageFramingEditor
      src="https://example.com/image.webp"
      value={value}
      onChange={setValue}
    />
  );
}
it("keeps desktop and mobile framing independent and resets only the selected device", () => {
  render(<Demo />);
  fireEvent.change(screen.getByRole("slider", { name: /Zoom/ }), {
    target: { value: ".5" },
  });
  fireEvent.change(screen.getByRole("slider", { name: /Horizontal/ }), {
    target: { value: "25" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Mobile framing" }));
  expect(screen.getByRole("slider", { name: /Zoom/ })).toHaveValue("1");
  fireEvent.change(screen.getByRole("slider", { name: /Zoom/ }), {
    target: { value: "2" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Reset this framing" }));
  expect(screen.getByRole("slider", { name: /Zoom/ })).toHaveValue("1");
  fireEvent.click(screen.getByRole("button", { name: "Desktop framing" }));
  expect(screen.getByRole("slider", { name: /Zoom/ })).toHaveValue("0.5");
  expect(screen.getByRole("slider", { name: /Horizontal/ })).toHaveValue("25");
});
