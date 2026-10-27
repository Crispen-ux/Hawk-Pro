// Standard free-field audio formulas. Inputs come from the user's own equipment data sheets.

const log10 = Math.log10;

/** SPL at a distance from a source, ignoring room effects (inverse square law). */
export function splAtDistance(
  sensitivityDb: number,
  powerW: number,
  distanceM: number,
): number {
  return sensitivityDb + 10 * log10(powerW) - 20 * log10(distanceM);
}

/** Amplifier power needed to hit a target SPL at a distance, including headroom for peaks. */
export function powerNeededW(
  sensitivityDb: number,
  targetSpl: number,
  distanceM: number,
  headroomDb: number,
): number {
  return (
    10 **
    ((targetSpl + headroomDb - sensitivityDb + 20 * log10(distanceM)) / 10)
  );
}

/** Combined impedance (ohms) of speakers wired in series or parallel. */
export function combinedImpedance(
  ohms: number[],
  mode: "series" | "parallel",
): number {
  if (ohms.length === 0 || ohms.some((o) => !(o > 0))) return NaN;
  if (mode === "series") return ohms.reduce((a, b) => a + b, 0);
  return 1 / ohms.reduce((a, b) => a + 1 / b, 0);
}

/** Speed of sound in air (m/s) at a temperature in degrees Celsius. */
export function speedOfSound(tempC: number): number {
  return 331.3 + 0.606 * tempC;
}

/** Delay in milliseconds for sound to travel a distance. */
export function delayMs(distanceM: number, tempC: number): number {
  return (distanceM / speedOfSound(tempC)) * 1000;
}

const COPPER_OHM_MM2_PER_M = 0.0172;

/** Round-trip resistance (ohms) of a copper speaker cable. */
export function cableResistance(lengthM: number, areaMm2: number): number {
  return (COPPER_OHM_MM2_PER_M * 2 * lengthM) / areaMm2;
}

/** Share of amplifier power lost as heat in the cable, and the level drop at the speaker in dB. */
export function cableLoss(
  lengthM: number,
  areaMm2: number,
  loadOhm: number,
): { powerLossPct: number; levelDropDb: number } {
  const r = cableResistance(lengthM, areaMm2);
  return {
    powerLossPct: (r / (r + loadOhm)) * 100,
    levelDropDb: -20 * log10(loadOhm / (loadOhm + r)),
  };
}

/** First axial room resonances (Hz) along one dimension in metres. */
export function axialModes(dimensionM: number, count: number): number[] {
  return Array.from(
    { length: count },
    (_, i) => ((i + 1) * speedOfSound(20)) / (2 * dimensionM),
  );
}
