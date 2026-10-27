import { adjustOrderStock } from "./stock-orders.ts";
export function dispatchOrder(
  id: string,
  expected: Record<string, unknown>,
  data: Record<string, unknown>,
) {
  return adjustOrderStock(id, expected, data, "dispatch");
}
