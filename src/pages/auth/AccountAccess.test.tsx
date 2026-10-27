import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, it, expect, vi } from "vitest";
import AccountAccess from "./AccountAccess";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("shows the current login error and clears the stale session failure message", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ error: { message: "Sign-in service unavailable" } }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        ),
      ),
  );
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/admin/login",
          state: { authError: "We could not verify your session." },
        },
      ]}
    >
      <AccountAccess admin />
    </MemoryRouter>,
  );
  expect(
    screen.getByText("We could not verify your session."),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "admin@hawk.example" },
  });
  fireEvent.change(screen.getByLabelText(/Password/), {
    target: { value: "test-password-123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Sign-in service unavailable",
    ),
  );
  expect(
    screen.queryByText("We could not verify your session."),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("[object Object]")).not.toBeInTheDocument();
});
