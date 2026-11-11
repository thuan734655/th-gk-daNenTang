import { useState } from "react";
import { View } from "react-native";
import { AvatarPicker } from "./AvatarPicker";
import { Button, Field, Message, s } from "./ui/kit";
import { productFormSchema } from "@/schemas/product.schema";
import type { Product, ProductInput } from "@/types/product";

export function ProductForm({
  product,
  onSave,
}: {
  product?: Product;
  onSave: (input: ProductInput) => Promise<void>;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [soluong, setSoluong] = useState(
    product ? String(product.soluong) : "",
  );
  const [image, setImage] = useState<string>();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const parsed = productFormSchema.safeParse({ name, price, soluong });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (!image && !product?.image) {
      setError("Chọn ảnh sản phẩm.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ ...parsed.data, ...(image ? { image } : {}) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được sản phẩm.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={s.card}>
      <AvatarPicker
        label="Ảnh sản phẩm"
        placeholderIcon="📦"
        value={image ?? product?.image}
        onChange={setImage}
        disabled={saving}
      />
      <Field
        label="Tên sản phẩm"
        value={name}
        onChangeText={setName}
        editable={!saving}
      />
      <Field
        label="Giá (₫)"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        editable={!saving}
      />
      <Field
        label="Số lượng"
        value={soluong}
        onChangeText={setSoluong}
        keyboardType="number-pad"
        editable={!saving}
      />
      <Message text={error} />
      <Button
        title={
          saving ? "Đang lưu…" : product ? "Lưu thay đổi" : "Thêm sản phẩm"
        }
        disabled={saving}
        onPress={() => void submit()}
      />
    </View>
  );
}
