import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { vi, it, expect, afterEach } from "vitest";
import ReportsPage from "./page";
vi.mock("@/hooks/use-commerce", () => ({
  useCommerce: () => ({ data: [], isPending: false, error: null }),
  money: (n: number) => "R " + n.toFixed(2),
}));
afterEach(cleanup);
it("keeps reports usable when a date is cleared and disables export until the range is valid", () => {
  render(<ReportsPage />);
  fireEvent.change(screen.getByLabelText("From"), { target: { value: "" } });
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Choose a valid date range",
  );
  expect(
    screen.getByRole("button", { name: "Export receipts & refunds" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Last 7 days" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Export receipts & refunds" }),
  ).toBeEnabled();
});
