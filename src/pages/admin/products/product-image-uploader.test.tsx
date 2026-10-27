import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import ProductImageUploader from "./product-image-uploader";
const uploaded = vi.fn(),
  busy = vi.fn();
const image = (name: string) =>
  new File(["test-image"], name, { type: "image/png" });
const ok = (name: string) =>
  new Response(JSON.stringify({ url: "https://images.example/" + name }), {
    status: 200,
  });
beforeEach(() => {
  uploaded.mockReset();
  busy.mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("uploads a multi-selection in order and keeps successful images when one fails", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(ok("front.png"))
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: "Storage temporarily unavailable" }),
        { status: 503 },
      ),
    )
    .mockResolvedValueOnce(ok("side.png"));
  vi.stubGlobal("fetch", fetcher);
  render(
    <ProductImageUploader
      remaining={8}
      onUploaded={uploaded}
      onBusyChange={busy}
    />,
  );
  const input = screen.getByLabelText("Upload product images");
  expect(input).toHaveAttribute("multiple");
  fireEvent.change(input, {
    target: {
      files: [image("front.png"), image("back.png"), image("side.png")],
    },
  });
  await waitFor(() =>
    expect(uploaded).toHaveBeenCalledWith([
      "https://images.example/front.png",
      "https://images.example/side.png",
    ]),
  );
  expect(
    screen.getByText("Storage temporarily unavailable"),
  ).toBeInTheDocument();
  expect(busy.mock.calls[0][0]).toBe(true);
  expect(busy.mock.calls.at(-1)?.[0]).toBe(false);
  fetcher.mockResolvedValueOnce(ok("back.png"));
  fireEvent.click(screen.getByRole("button", { name: "Retry back.png" }));
  await waitFor(() =>
    expect(uploaded).toHaveBeenLastCalledWith([
      "https://images.example/back.png",
    ]),
  );
  expect(fetcher).toHaveBeenCalledTimes(4);
});
it("does not partially upload a selection that exceeds the available gallery spaces", () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  render(
    <ProductImageUploader
      remaining={1}
      onUploaded={uploaded}
      onBusyChange={busy}
    />,
  );
  fireEvent.change(screen.getByLabelText("Upload product images"), {
    target: { files: [image("one.png"), image("two.png")] },
  });
  expect(screen.getByRole("status")).toHaveTextContent(
    "You can add 1 more image",
  );
  expect(fetcher).not.toHaveBeenCalled();
});
it("rejects unsupported and oversized files before sending while accepting other images", async () => {
  const fetcher = vi.fn().mockResolvedValue(ok("good.png"));
  vi.stubGlobal("fetch", fetcher);
  const large = image("large.png");
  Object.defineProperty(large, "size", { value: 4 * 1024 * 1024 + 1 });
  render(
    <ProductImageUploader
      remaining={8}
      onUploaded={uploaded}
      onBusyChange={busy}
    />,
  );
  fireEvent.change(screen.getByLabelText("Upload product images"), {
    target: {
      files: [
        new File(["text"], "notes.txt", { type: "text/plain" }),
        large,
        image("good.png"),
      ],
    },
  });
  await waitFor(() =>
    expect(uploaded).toHaveBeenCalledWith(["https://images.example/good.png"]),
  );
  expect(
    screen.getByText("Use a JPEG, PNG or WebP image."),
  ).toBeInTheDocument();
  expect(screen.getByText("Maximum image size is 4 MB.")).toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/1 of 3 images uploaded/)).toBeInTheDocument();
});
it("prevents overlapping batches until the current upload has completed", async () => {
  let resolve!: (response: Response) => void;
  const fetcher = vi.fn(
    () =>
      new Promise<Response>((r) => {
        resolve = r;
      }),
  );
  vi.stubGlobal("fetch", fetcher);
  render(
    <ProductImageUploader
      remaining={8}
      onUploaded={uploaded}
      onBusyChange={busy}
    />,
  );
  const input = screen.getByLabelText("Upload product images");
  fireEvent.change(input, { target: { files: [image("one.png")] } });
  expect(input).toBeDisabled();
  expect(screen.getByRole("progressbar")).toHaveAttribute("max", "1");
  resolve(ok("one.png"));
  await waitFor(() => expect(input).toBeEnabled());
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("accepts multiple images dropped into the upload area", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(ok("front.png"))
    .mockResolvedValueOnce(ok("rear.png"));
  vi.stubGlobal("fetch", fetcher);
  render(
    <ProductImageUploader
      remaining={8}
      onUploaded={uploaded}
      onBusyChange={busy}
    />,
  );
  fireEvent.drop(
    screen.getByRole("group", { name: "Product image upload area" }),
    { dataTransfer: { files: [image("front.png"), image("rear.png")] } },
  );
  await waitFor(() =>
    expect(uploaded).toHaveBeenCalledWith([
      "https://images.example/front.png",
      "https://images.example/rear.png",
    ]),
  );
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it("aborts when the editor is left and never appends images after unmount", async () => {
  let resolve!: (response: Response) => void;
  const fetcher = vi.fn<typeof fetch>(
    () =>
      new Promise<Response>((r) => {
        resolve = r;
      }),
  );
  vi.stubGlobal("fetch", fetcher);
  const view = render(
    <ProductImageUploader
      remaining={8}
      onUploaded={uploaded}
      onBusyChange={busy}
    />,
  );
  fireEvent.change(screen.getByLabelText("Upload product images"), {
    target: { files: [image("one.png")] },
  });
  const signal = fetcher.mock.calls[0][1]?.signal;
  view.unmount();
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    resolve(ok("one.png"));
  });
  expect(uploaded).not.toHaveBeenCalled();
  expect(busy.mock.calls.at(-1)?.[0]).toBe(false);
});
