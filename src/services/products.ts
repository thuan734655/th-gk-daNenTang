import { api } from "./api";
import type { Product, ProductInput } from "@/types/product";

const path = (id: string) => `/products/${encodeURIComponent(id)}`;
export const listProducts = () => api<{ products: Product[] }>("/products");
export const getProduct = (id: string) => api<{ product: Product }>(path(id));
export const createProduct = (body: ProductInput) =>
  api<{ product: Product }>("/products", { method: "POST", body });
export const editProduct = (id: string, body: ProductInput) =>
  api<{ product: Product; warning?: string }>(path(id), {
    method: "PATCH",
    body,
  });
export const deleteProduct = (id: string) =>
  api<{ warning?: string }>(path(id), { method: "DELETE" });
export const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 2,
  }).format(price);
