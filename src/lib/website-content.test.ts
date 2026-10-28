import { describe, it, expect } from "vitest";
import {
  contentSchema,
  DEFAULT_CONTENT,
  SLOT_IDS,
  promotionActive,
} from "../../db/website-content";
describe("website content validation", () => {
  it("preserves all eleven named image positions", () => {
    expect(SLOT_IDS).toHaveLength(11);
    expect(contentSchema.parse(DEFAULT_CONTENT)).toEqual(DEFAULT_CONTENT);
  });
  it.each([
    "javascript:alert(1)",
    "//evil.example/image",
    "/\\evil.example/image",
    "http://insecure.example/image",
  ])("rejects unsafe media %s", (src) => {
    const c = structuredClone(DEFAULT_CONTENT);
    c.images["home-hero"].src = src;
    expect(contentSchema.safeParse(c).success).toBe(false);
  });
  it("rejects excessive zoom and missing image positions", () => {
    const c = structuredClone(DEFAULT_CONTENT);
    c.images["home-hero"].mobile.zoom = 5;
    expect(contentSchema.safeParse(c).success).toBe(false);
  });
  it("requires footage before showing video", () => {
    const c = structuredClone(DEFAULT_CONTENT);
    c.video.enabled = true;
    expect(contentSchema.safeParse(c).success).toBe(false);
  });
  it("rejects external button destinations", () => {
    const c = structuredClone(DEFAULT_CONTENT);
    c.hero.href = "https://other.example";
    expect(contentSchema.safeParse(c).success).toBe(false);
  });
});
describe("promotion schedule", () => {
  const p = {
    id: "sale",
    enabled: true,
    placement: "strip" as const,
    title: "Sale",
    body: "",
    button: "Shop",
    href: "/shop",
    image: "",
    start: "2026-11-01T08:00:00+02:00",
    end: "2026-11-02T08:00:00+02:00",
  };
  it("honours SAST start inclusively and expiry exclusively", () => {
    expect(promotionActive(p, Date.parse("2026-11-01T05:59:59Z"))).toBe(false);
    expect(promotionActive(p, Date.parse("2026-11-01T06:00:00Z"))).toBe(true);
    expect(promotionActive(p, Date.parse("2026-11-02T06:00:00Z"))).toBe(false);
  });
  it("hides disabled promotions and rejects reversed schedules", () => {
    expect(promotionActive({ ...p, enabled: false }, Date.parse(p.start))).toBe(
      false,
    );
    const c = structuredClone(DEFAULT_CONTENT);
    c.promotions = [{ ...p, end: p.start }];
    expect(contentSchema.safeParse(c).success).toBe(false);
  });
});

it("allows zooming out but rejects zero and negative scales", () => {
  for (const zoom of [0.1, 0.5, 1, 3]) {
    const c = structuredClone(DEFAULT_CONTENT);
    c.images["home-hero"].desktop.zoom = zoom;
    expect(contentSchema.safeParse(c).success).toBe(true);
  }
  for (const zoom of [0, -1, 0.09]) {
    const c = structuredClone(DEFAULT_CONTENT);
    c.images["home-hero"].desktop.zoom = zoom;
    expect(contentSchema.safeParse(c).success).toBe(false);
  }
});
