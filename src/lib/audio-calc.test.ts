import { describe, expect, it } from "vitest";
import {
  axialModes,
  cableLoss,
  combinedImpedance,
  delayMs,
  powerNeededW,
  splAtDistance,
} from "./audio-calc.ts";

describe("audio-calc", () => {
  it("loses 6 dB per doubling of distance", () => {
    const near = splAtDistance(95, 100, 2);
    const far = splAtDistance(95, 100, 4);
    expect(near - far).toBeCloseTo(6.02, 1);
  });

  it("gives sensitivity + 10log(P) at 1 m", () => {
    expect(splAtDistance(90, 100, 1)).toBeCloseTo(110, 5);
  });

  it("power needed is the inverse of the SPL calculation", () => {
    const p = powerNeededW(95, 100, 10, 0);
    expect(splAtDistance(95, p, 10)).toBeCloseTo(100, 5);
  });

  it("combines impedances", () => {
    expect(combinedImpedance([8, 8], "parallel")).toBeCloseTo(4);
    expect(combinedImpedance([8, 8], "series")).toBe(16);
    expect(combinedImpedance([8, 0], "parallel")).toBeNaN();
  });

  it("delays about 2.9 ms per metre at 20 C", () => {
    expect(delayMs(10, 20)).toBeCloseTo(29.15, 1);
  });

  it("cable loss grows with length and shrinks with thicker cable", () => {
    const thin = cableLoss(30, 1.5, 8);
    const thick = cableLoss(30, 4, 8);
    expect(thin.powerLossPct).toBeGreaterThan(thick.powerLossPct);
    expect(cableLoss(0.001, 4, 8).powerLossPct).toBeCloseTo(0, 1);
  });

  it("finds the first axial mode at c / 2L", () => {
    expect(axialModes(5, 2)[0]).toBeCloseTo(34.34, 1);
    expect(axialModes(5, 2)[1]).toBeCloseTo(68.68, 1);
  });
});
