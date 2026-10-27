const STORAGE_KEY = "hawk-admin-passcode";

// The passcode lives in sessionStorage so it survives navigation but not a
// closed tab; the server re-checks it on every write regardless.
export function getAdminPasscode(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setAdminPasscode(passcode: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, passcode);
  } catch {
    /* storage unavailable: sign-in will not survive navigation */
  }
}

export function clearAdminPasscode(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable: nothing to clear */
  }
}

export function hasAdminPasscode(): boolean {
  return getAdminPasscode().length > 0;
}
