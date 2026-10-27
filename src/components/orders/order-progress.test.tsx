import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, it, expect } from "vitest";
import OrderProgress from "./order-progress";
afterEach(cleanup);
describe("customer order tracking", () => {
  it("shows the current milestone and a safe courier tracking link", () => {
    render(
      <OrderProgress
        status="shipped"
        courier="Test courier"
        tracking="SHIP42"
        trackingUrl="https://courier.example/SHIP42"
        estimatedDelivery="2026-10-30"
        fulfillmentEvents={[{ status: "shipped", at: "2026-10-27T10:00:00Z" }]}
      />,
    );
    expect(screen.getByText("Test courier")).toBeInTheDocument();
    expect(screen.getByText("shipped")).toHaveAttribute("aria-current", "step");
    expect(
      screen.getByRole("link", { name: "Track with courier" }),
    ).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("SHIP42")).toBeInTheDocument();
  });
  it("does not render unsafe tracking links or delivered progress for cancelled orders", () => {
    render(
      <OrderProgress status="cancelled" trackingUrl="javascript:alert(1)" />,
    );
    expect(
      screen.getByRole("heading", { name: "Order cancelled" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("delivered")).not.toBeInTheDocument();
  });
});
