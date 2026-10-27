import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { request, fetchAllProducts } from "@/lib/api";
import type {
  CommerceKind,
  CommerceRecord,
} from "../../db/commerce-validation";
export function useCommerce() {
  return useQuery({
    queryKey: ["commerce"],
    queryFn: async () =>
      (
        await request<{ records: CommerceRecord[] }>("/api/commerce", {
          admin: true,
        })
      ).records,
  });
}
export function useAdminProducts() {
  return useQuery({ queryKey: ["admin-products"], queryFn: fetchAllProducts });
}
export function useSaveCommerce() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      kind: CommerceKind;
      id?: string;
      data: Record<string, unknown>;
    }) =>
      request<{ record: CommerceRecord; emailWarning?: string }>(
        "/api/commerce",
        { method: body.id ? "PUT" : "POST", body, admin: true },
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: ["commerce"] }),
  });
}
export const money = (n: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
