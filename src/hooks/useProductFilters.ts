import { useMemo, useState } from "react";
import type { Product } from "@/types/product";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .trim();

function parsePrice(value: string) {
  const input = value.trim();
  if (!input) return undefined;
  const amount = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(input)
    ? Number(input.replace(/\./g, "").replace(",", "."))
    : NaN;
  return amount <= Number.MAX_SAFE_INTEGER ? amount : NaN;
}

export function useProductFilters(products: Product[]) {
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<
    "default" | "price-up" | "price-down" | "name"
  >("default");
  const min = parsePrice(minPrice);
  const max = parsePrice(maxPrice);
  const priceError =
    Number.isNaN(min) || Number.isNaN(max)
      ? "Nhập giá hợp lệ, ví dụ 150000 hoặc 150.000."
      : min !== undefined && max !== undefined && min > max
        ? "Giá từ phải nhỏ hơn hoặc bằng giá đến."
        : "";
  const matching = useMemo(() => {
    const words = normalize(query).split(/\s+/);
    return products.filter((product) => {
      const name = normalize(product.name);
      return (
        words.every((word) => name.includes(word)) &&
        (priceError ||
          ((min === undefined || product.price >= min) &&
            (max === undefined || product.price <= max)))
      );
    });
  }, [products, query, min, max, priceError]);

  const results = [...matching];
  if (sort === "price-up") results.sort((a, b) => a.price - b.price);
  if (sort === "price-down") results.sort((a, b) => b.price - a.price);
  if (sort === "name")
    results.sort((a, b) => a.name.localeCompare(b.name, "vi"));

  function reset() {
    setMinPrice("");
    setMaxPrice("");
  }

  return {
    query,
    setQuery,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    priceError,
    sort,
    setSort,
    results,
    reset,
  };
}
