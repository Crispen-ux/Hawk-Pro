import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminLayout from "./layout";
import AccountAccess from "../auth/AccountAccess";
import { request } from "@/lib/api";

vi.mock("@/lib/api", () => ({ request: vi.fn() }));
vi.mock("@/hooks/use-settings", () => ({
  useSiteSettings: () => ({
    settings: { onboardingCompleted: true },
    ready: true,
    error: null,
  }),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

function renderAdmin() {
  return render(
    <MemoryRouter initialEntries={["/admin/orders"]}>
      <Routes>
        <Route path="/admin/login" element={<AccountAccess admin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="orders" element={<p>Private order records</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("administrator access", () => {
  it("does not render navigation or private content before verification", () => {
    vi.mocked(request).mockReturnValue(new Promise(() => {}));
    renderAdmin();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Checking administrator access",
    );
    expect(
      screen.queryByRole("navigation", { name: "Administration" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Private order records")).not.toBeInTheDocument();
  });

  it.each([401, 503])(
    "shows login without the admin shell when verification returns %s",
    async (status) => {
      vi.mocked(request).mockRejectedValue(
        Object.assign(new Error("Unavailable"), { status }),
      );
      renderAdmin();
      expect(
        await screen.findByRole("heading", { name: "Welcome back" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("navigation", { name: "Administration" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Private order records"),
      ).not.toBeInTheDocument();
    },
  );

  it("rejects customer sessions", async () => {
    vi.mocked(request).mockResolvedValue({
      user: { name: "Customer", role: "customer" },
    });
    renderAdmin();
    expect(
      await screen.findByRole("heading", { name: "Welcome back" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Private order records")).not.toBeInTheDocument();
  });

  it("renders private content after server approval and rechecks on focus", async () => {
    vi.mocked(request).mockResolvedValueOnce({
      user: { name: "Owner", role: "admin" },
    });
    renderAdmin();
    expect(
      await screen.findByText("Private order records"),
    ).toBeInTheDocument();
    vi.mocked(request).mockRejectedValue(
      Object.assign(new Error("Expired"), { status: 401 }),
    );
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    await waitFor(() =>
      expect(
        screen.queryByText("Private order records"),
      ).not.toBeInTheDocument(),
    );
    expect(
      await screen.findByRole("heading", { name: "Welcome back" }),
    ).toBeInTheDocument();
  });
});

describe("account screens", () => {
  it("provides a dedicated signup form", () => {
    render(
      <MemoryRouter>
        <AccountAccess initialMode="register" />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Create your account" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create account" }),
    ).toBeInTheDocument();
  });
  it("provides a dedicated administrator password reset screen", () => {
    render(
      <MemoryRouter>
        <AccountAccess admin initialMode="reset" />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Reset your password" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send reset code" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to sign in" }),
    ).toHaveAttribute("href", "/admin/login");
  });
  it("links login to the signup and reset routes", () => {
    render(
      <MemoryRouter>
        <AccountAccess />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("link", { name: "Create an account" }),
    ).toHaveAttribute("href", "/account/signup");
    expect(
      screen.getByRole("link", { name: "Forgot password?" }),
    ).toHaveAttribute("href", "/account/reset-password");
  });
});
