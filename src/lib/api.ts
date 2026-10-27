import {
  ADMIN_PASSCODE_HEADER,
  type EnquiryInput,
  type EnquiryRecord,
  type EnquiryStatus,
  type ProductInput,
  type ProductRecord,
  type SettingsInput,
} from "../../db/validation.ts";
import { getAdminPasscode } from "./admin-session.ts";

export class ApiError extends Error {
  readonly status: number;
  readonly payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
    this.name = "ApiError";
  }
}

export function apiErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const body = payload as Record<string, unknown>;
    const error = body.error;
    if (typeof error === "string" && error.trim()) return error;
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.trim()
    )
      return error.message;
    if (typeof body.message === "string" && body.message.trim())
      return body.message;
  }
  return status >= 500
    ? "The service is temporarily unavailable. Please try again shortly."
    : "Request failed (" + status + "). Please try again.";
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  admin?: boolean;
};

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.admin) headers[ADMIN_PASSCODE_HEADER] = getAdminPasscode();

  let res: Response;
  try {
    res = await fetch(path, {
      method: options.method ?? "GET",
      headers,
      credentials: "same-origin",
      cache: "no-store",
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError("Cannot reach the server", 0);
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* empty or non-JSON response */
  }

  if (!res.ok) {
    const message = apiErrorMessage(payload, res.status);
    throw new ApiError(message, res.status, payload);
  }
  return payload as T;
}

/* Catalogue (public) */

export async function fetchProducts(): Promise<ProductRecord[]> {
  const data = await request<{ products: ProductRecord[] }>("/api/products");
  return data.products;
}

/* Catalogue (admin) */

export async function fetchAllProducts(): Promise<ProductRecord[]> {
  const data = await request<{ products: ProductRecord[] }>(
    "/api/products?all=1",
    { admin: true },
  );
  return data.products;
}

export async function fetchProduct(id: string): Promise<ProductRecord> {
  const data = await request<{ product: ProductRecord }>(
    `/api/products/${id}`,
    { admin: true },
  );
  return data.product;
}

export async function createProduct(
  input: ProductInput,
): Promise<ProductRecord> {
  const data = await request<{ product: ProductRecord }>("/api/products", {
    method: "POST",
    body: input,
    admin: true,
  });
  return data.product;
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ProductRecord> {
  const data = await request<{ product: ProductRecord }>(
    `/api/products/${id}`,
    { method: "PUT", body: input, admin: true },
  );
  return data.product;
}

export async function deleteProduct(id: string): Promise<void> {
  await request<{ ok: true }>(`/api/products/${id}`, {
    method: "DELETE",
    admin: true,
  });
}

/* Enquiries */

export async function createEnquiry(
  input: EnquiryInput,
): Promise<EnquiryRecord> {
  const data = await request<{ enquiry: EnquiryRecord }>("/api/enquiries", {
    method: "POST",
    body: input,
  });
  return data.enquiry;
}

export async function fetchEnquiries(): Promise<EnquiryRecord[]> {
  const data = await request<{ enquiries: EnquiryRecord[] }>("/api/enquiries", {
    admin: true,
  });
  return data.enquiries;
}

export async function setEnquiryStatus(
  id: string,
  status: EnquiryStatus,
): Promise<EnquiryRecord> {
  const data = await request<{ enquiry: EnquiryRecord }>(
    `/api/enquiries/${id}`,
    { method: "PATCH", body: { status }, admin: true },
  );
  return data.enquiry;
}

/* Settings */

export async function fetchSettings(): Promise<SettingsInput> {
  const data = await request<{ settings: SettingsInput }>("/api/settings");
  return data.settings;
}

export async function saveSettings(
  input: SettingsInput,
): Promise<SettingsInput> {
  const data = await request<{ settings: SettingsInput }>("/api/settings", {
    method: "PUT",
    body: input,
    admin: true,
  });
  return data.settings;
}

/* Auth */

export async function verifyPasscode(passcode: string): Promise<void> {
  await request<{ ok: true }>("/api/auth", {
    method: "POST",
    body: { passcode },
  });
}
