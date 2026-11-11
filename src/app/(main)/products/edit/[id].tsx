import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ProductForm } from "@/components/ProductForm";
import { Button, Loading, Message, Page } from "@/components/ui/kit";
import { useProduct } from "@/hooks/useProduct";
import { editProduct } from "@/services/products";

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { product, error, loading, load } = useProduct(id);
  const [warning, setWarning] = useState("");
  const openDetail = () =>
    router.replace({ pathname: "/products/[id]", params: { id } });

  return (
    <Page title="Sửa sản phẩm">
      <Message text={error || warning} />
      {loading ? (
        <Loading />
      ) : product && !warning ? (
        <ProductForm
          key={id}
          product={product}
          onSave={async (input) => {
            const result = await editProduct(id, input);
            if (result.warning) setWarning(result.warning);
            else openDetail();
          }}
        />
      ) : !warning ? (
        <Button title="Thử lại" tone="secondary" onPress={() => void load()} />
      ) : null}
      <Button title="Quay lại chi tiết" tone="secondary" onPress={openDetail} />
    </Page>
  );
}
