import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DEFAULT_CONTENT } from "../../../../db/website-content";
import { request } from "@/lib/api";
import Editor from "./page";
vi.mock("@/lib/api", () => ({ request: vi.fn() }));
const saved = {
  draft: DEFAULT_CONTENT,
  published: DEFAULT_CONTENT,
  previous: null,
  revision: 0,
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(request).mockResolvedValue(structuredClone(saved));
});
function setup() {
  return render(
    <MemoryRouter>
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <Editor />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}
it("keeps mobile framing separate and saves a private draft before publishing", async () => {
  setup();
  await screen.findByText("Make it your own.");
  fireEvent.click(screen.getByRole("button", { name: "Mobile crop" }));
  fireEvent.change(screen.getByRole("slider", { name: /Zoom/ }), {
    target: { value: "0.5" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await waitFor(() =>
    expect(request).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.objectContaining({
          action: "save",
          revision: 0,
          content: expect.objectContaining({
            images: expect.objectContaining({
              "home-hero": expect.objectContaining({
                mobile: { x: 50, y: 50, zoom: 0.5 },
                desktop: { x: 50, y: 50, zoom: 1 },
              }),
            }),
          }),
        }),
      }),
    ),
  );
});
it("shows load failures without offering to overwrite stored content", async () => {
  vi.mocked(request).mockRejectedValue(new Error("Database unavailable"));
  setup();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Database unavailable",
  );
  expect(
    screen.queryByRole("button", { name: "Publish content" }),
  ).not.toBeInTheDocument();
});
it("shows save failures while retaining the local draft", async () => {
  setup();
  await screen.findByText("Make it your own.");
  fireEvent.change(screen.getByRole("textbox", { name: "Alternative text" }), {
    target: { value: "My new speaker image" },
  });
  vi.mocked(request).mockRejectedValueOnce(
    new Error("Content changed in another session"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Content changed");
  expect(screen.getByRole("textbox", { name: "Alternative text" })).toHaveValue(
    "My new speaker image",
  );
});

it("saves custom banner appearance with the draft", async () => {
  setup();
  await screen.findByText("Make it your own.");
  fireEvent.click(screen.getByRole("button", { name: "promotions" }));
  fireEvent.click(screen.getByRole("button", { name: "Add promotion" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Text size" }), {
    target: { value: "large" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Text alignment" }), {
    target: { value: "right" },
  });
  fireEvent.change(screen.getByLabelText("Background colour"), {
    target: { value: "#112233" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await waitFor(() =>
    expect(request).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.objectContaining({
          action: "save",
          content: expect.objectContaining({
            promotions: [
              expect.objectContaining({
                style: expect.objectContaining({
                  textSize: "large",
                  alignment: "right",
                  background: "#112233",
                }),
              }),
            ],
          }),
        }),
      }),
    ),
  );
});
