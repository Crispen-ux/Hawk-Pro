import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { webcrypto } from "node:crypto";
import CheckoutPage from "./page";
import { speaker, store, ORDER_ID } from "../../test-fixtures/commerce";
import { calculateDelivery } from "../../../db/checkout-model";
import { request } from "@/lib/api";
vi.mock("@/lib/api", () => ({ request: vi.fn() }));
vi.mock("@/hooks/use-cart", () => ({
  useCart: () => ({
    items: [{ product: speaker(), quantity: 1 }],
    subtotal: 2500,
    setQuantity: vi.fn(),
    removeItem: vi.fn(),
  }),
}));
vi.mock("@/hooks/use-catalogue", () => ({
  useCatalogue: () => ({ loading: false, error: "", refresh: vi.fn() }),
}));
vi.mock("@/hooks/use-settings", () => ({
  useSiteSettings: () => ({ settings: store() }),
}));
vi.mock("@/hooks/use-delivery-quote", () => ({
  useDeliveryQuote: () => ({
    destination: { country: "BW", postcode: "", method: "delivery" },
    quote: {
      ...calculateDelivery(
        {
          lines: [{ productId: speaker().id, quantity: 1 }],
          destination: { country: "BW", postcode: "", method: "delivery" },
        },
        [speaker()],
        store().sales,
      ),
      quoteId: "test-quote",
    },
    busy: false,
    error: "",
    setDestination: vi.fn(),
    estimate: vi.fn(),
  }),
}));
beforeEach(() => {
  vi.stubGlobal("scrollTo", vi.fn());
  sessionStorage.clear();
  vi.stubGlobal("crypto", webcrypto);
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function setup() {
  render(
    <MemoryRouter initialEntries={["/checkout"]}>
      <Routes>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route
          path="/checkout/return/:orderId/:access"
          element={<p>Guest quote recorded</p>}
        />
      </Routes>
    </MemoryRouter>,
  );
}
async function review() {
  for (const [label, value] of [
    ["Full name", "Guest Buyer"],
    ["Email address", "guest@hawk.example"],
    ["Phone number", "+27 11 555 1234"],
    ["Street address", "42 Test Road"],
    ["Town / city", "Gaborone"],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Review quote request" }));
  await screen.findByRole("heading", { name: "Review your order" });
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: "I have checked my contact details, items and delivery selection.",
    }),
  );
}
describe("guest checkout", () => {
  it("allows a cross-border quote request without an account or password", async () => {
    vi.mocked(request).mockResolvedValue({
      receipt: { id: ORDER_ID, payment: "unpaid" },
      access:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      redirectUrl: null,
    });
    setup();
    expect(
      screen.getByText("Guest checkout. No account required."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
    await review();
    fireEvent.click(screen.getByRole("button", { name: "Send quote request" }));
    expect(await screen.findByText("Guest quote recorded")).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith(
      "/api/checkout",
      expect.objectContaining({
        body: expect.objectContaining({
          intent: "quote",
          consent: true,
          customer: expect.objectContaining({ email: "guest@hawk.example" }),
          destination: expect.objectContaining({ country: "BW" }),
        }),
      }),
    );
  });
  it("preserves entered details and the same attempt key after a network failure", async () => {
    vi.mocked(request).mockRejectedValue(
      new Error("Network interrupted. Your request can be retried."),
    );
    setup();
    await review();
    fireEvent.click(screen.getByRole("button", { name: "Send quote request" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Network interrupted",
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Send quote request" }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Send quote request" }));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    const first = vi.mocked(request).mock.calls[0][1]?.body as { key: string },
      second = vi.mocked(request).mock.calls[1][1]?.body as { key: string };
    expect(first.key).toBe(second.key);
    fireEvent.click(screen.getByRole("button", { name: "Back to details" }));
    expect(await screen.findByLabelText("Full name")).toHaveValue(
      "Guest Buyer",
    );
    expect(screen.getByLabelText("Email address")).toHaveValue(
      "guest@hawk.example",
    );
  });
  it("requires explicit review confirmation before sending a request", async () => {
    setup();
    await review();
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "I have checked my contact details, items and delivery selection.",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Send quote request" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "confirm your details",
    );
    expect(request).not.toHaveBeenCalled();
  });
});
