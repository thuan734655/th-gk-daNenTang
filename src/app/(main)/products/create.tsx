import { router } from "expo-router";
import { ProductForm } from "@/components/ProductForm";
import { Button, Page } from "@/components/ui/kit";
import { createProduct } from "@/services/products";

export default function CreateProduct() {
  return (
    <Page title="Thêm sản phẩm">
      <ProductForm
        onSave={async (input) => {
          await createProduct(input);
          router.replace("/products");
        }}
      />
      <Button
        title="Quay lại danh sách"
        tone="secondary"
        onPress={() => router.replace("/products")}
      />
    </Page>
  );
}
