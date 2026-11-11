import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { getProduct } from "@/services/products";
import type { Product } from "@/types/product";

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProduct((await getProduct(id)).product);
    } catch (e) {
      setProduct(undefined);
      setError(e instanceof Error ? e.message : "Không tải được sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  return { product, setProduct, error, loading, load };
}
