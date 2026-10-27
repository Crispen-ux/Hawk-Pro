import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  DEFAULT_SETTINGS,
  normaliseSettings,
  settingsSchema,
  type SettingsInput,
} from "../../../../db/validation";
import { SiteSettingsProvider } from "@/hooks/use-settings";
import { fetchSettings, saveSettings } from "@/lib/api";
import StoreOnboarding from "./page";
import Footer from "@/components/layout/footer";
vi.mock("@/lib/api", () => ({ fetchSettings: vi.fn(), saveSettings: vi.fn() }));
let stored: SettingsInput;
beforeEach(() => {
  stored = structuredClone(DEFAULT_SETTINGS);
  vi.mocked(fetchSettings).mockImplementation(async () =>
    structuredClone(stored),
  );
  vi.mocked(saveSettings).mockImplementation(async (value) => {
    stored = structuredClone(value);
    return structuredClone(value);
  });
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
function setup() {
  return render(
    <MemoryRouter initialEntries={["/admin/onboarding"]}>
      <SiteSettingsProvider>
        <Routes>
          <Route path="/admin/onboarding" element={<StoreOnboarding />} />
          <Route path="/admin" element={<p>Store setup completed</p>} />
        </Routes>
        <Footer />
      </SiteSettingsProvider>
    </MemoryRouter>,
  );
}
const fill = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const advance = () =>
  fireEvent.click(screen.getByRole("button", { name: "Save & continue" }));
describe("store setup and storefront synchronisation", () => {
  it("saves each step, completes setup and updates customer-facing details", async () => {
    setup();
    await screen.findByLabelText("Store name");
    fill("Store name", "Hawk Johannesburg");
    fill("Store description", "Professional audio for every stage.");
    advance();
    await screen.findByLabelText("Customer support email");
    expect(stored.onboardingStep).toBe(1);
    fill("Customer support email", "support@hawk.example");
    fill("Customer support phone", "+27 11 555 1234");
    fill("Store address", "42 Audio Road, Johannesburg");
    advance();
    await screen.findByLabelText("Trading hours");
    expect(stored.onboardingStep).toBe(2);
    fill("Trading hours", "Mon–Fri 08:00–17:00\nSaturday 09:00–13:00");
    fill("Storefront announcement", "Discover the Hawk sound");
    advance();
    await screen.findByRole("button", { name: "Complete store setup" });
    expect(stored.onboardingStep).toBe(3);
    fireEvent.click(
      screen.getByRole("button", { name: "Complete store setup" }),
    );
    expect(
      await screen.findByText("Store setup completed"),
    ).toBeInTheDocument();
    expect(stored.onboardingCompleted).toBe(true);
    expect(
      screen.getByRole("link", { name: "support@hawk.example" }),
    ).toHaveAttribute("href", "mailto:support@hawk.example");
    expect(
      screen.getByRole("link", { name: "+27 11 555 1234" }),
    ).toHaveAttribute("href", "tel:+27115551234");
    expect(
      screen.getByText("Professional audio for every stage."),
    ).toBeInTheDocument();
    expect(saveSettings).toHaveBeenCalledTimes(4);
  });
  it("resumes the saved onboarding step", async () => {
    stored = {
      ...stored,
      onboardingStep: 2,
      contact: {
        ...stored.contact,
        email: "team@hawk.example",
        phone: "+27 11 555 0000",
        address: "Store address, Johannesburg",
      },
    };
    setup();
    expect(await screen.findByLabelText("Trading hours")).toBeInTheDocument();
    expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
  });
  it("does not claim setup succeeded when saving fails", async () => {
    vi.mocked(saveSettings).mockRejectedValue(
      new Error("Database unavailable"),
    );
    setup();
    await screen.findByLabelText("Store name");
    advance();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Database unavailable",
    );
    expect(screen.getByLabelText("Store name")).toBeInTheDocument();
    expect(stored.onboardingStep).toBe(0);
  });
  it("refreshes storefront details on window focus", async () => {
    render(
      <MemoryRouter>
        <SiteSettingsProvider>
          <Footer />
        </SiteSettingsProvider>
      </MemoryRouter>,
    );
    await screen.findByRole("link", { name: DEFAULT_SETTINGS.contact.email });
    stored = {
      ...stored,
      contact: { ...stored.contact, email: "new@hawk.example" },
    };
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(
      await screen.findByRole("link", { name: "new@hawk.example" }),
    ).toHaveAttribute("href", "mailto:new@hawk.example");
  });
});
describe("store configuration validation", () => {
  it("preserves existing store records and adds setup defaults", () => {
    const legacy = {
      announcement: "Existing store announcement",
      contact: {
        email: "hello@hawk.example",
        phone: "+27 11 123 4567",
        address: "10 Main Road",
        hours: "Mon–Fri 09:00–17:00",
      },
    };
    const result = normaliseSettings(legacy);
    expect(result.contact).toEqual(legacy.contact);
    expect(result.store.name).toBe("HAWK");
    expect(result.onboardingCompleted).toBe(false);
  });
  it("requires real contact details before completing setup", () => {
    expect(
      settingsSchema.safeParse({
        ...DEFAULT_SETTINGS,
        onboardingCompleted: true,
      }).success,
    ).toBe(false);
  });
});
