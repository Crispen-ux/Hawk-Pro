type Attempt = { key: string; access?: string };
let memory: Attempt | null = null;
let storageUnavailable = false;
const STORAGE = "hawk-checkout-attempt";
export function getCheckoutAttempt(): Attempt | null {
  if (typeof window === "undefined") return null;
  if (storageUnavailable) return memory;
  try {
    const raw = sessionStorage.getItem(STORAGE);
    if (!raw) {
      memory = null;
      return null;
    }
    const value = JSON.parse(raw);
    if (typeof value.key !== "string" || !/^[0-9a-f-]{36}$/i.test(value.key))
      return null;
    memory = value;
    return value;
  } catch {
    storageUnavailable = true;
    return memory;
  }
}
function save(value: Attempt) {
  memory = value;
  try {
    sessionStorage.setItem(STORAGE, JSON.stringify(value));
  } catch {
    storageUnavailable = true;
  }
}
// Keep one attempt until its outcome is verified. The server binds the order to its submitted details.
export async function checkoutAttemptKey(_payload?: unknown) {
  const previous = getCheckoutAttempt();
  if (previous) return previous.key;
  const key = crypto.randomUUID();
  save({ key });
  return key;
}
export function rememberCheckout(key: string, access: string) {
  save({ key, access });
}
export function clearCheckoutAttempt(id?: string) {
  if (id && getCheckoutAttempt()?.key !== id) return;
  memory = null;
  try {
    sessionStorage.removeItem(STORAGE);
  } catch {
    storageUnavailable = true;
  }
}
