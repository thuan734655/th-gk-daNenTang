import { useState } from "react";
import { Image, Text, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Loading, Message, Page, colors, s } from "@/components/ui/kit";
import { useProduct } from "@/hooks/useProduct";
import { deleteProduct, formatPrice } from "@/services/products";

export default function ProductDetail() {
  const { id, confirmDelete } = useLocalSearchParams<{
    id: string;
    confirmDelete?: string;
  }>();
  const { width } = useWindowDimensions();
  const { product, setProduct, error, loading, load } = useProduct(id);
  const [confirm, setConfirm] = useState(confirmDelete === "1");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const wide = width >= 720;

  async function remove() {
    setBusy(true);
    setActionError("");
    setNotice("");
    try {
      const result = await deleteProduct(id);
      if (!result.warning) {
        router.replace("/products");
        return;
      }
      setProduct(undefined);
      setConfirm(false);
      setNotice(result.warning);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Không xóa được sản phẩm.",
      );
    } finally {
      setBusy(false);
    }
  }

  const actions =
    product && !loading ? (
      confirm ? (
        <View style={{ gap: 8 }}>
          <Text style={s.label}>Xóa “{product.name}” và ảnh của sản phẩm?</Text>
          <View style={s.row}>
            <Button
              title={busy ? "Đang xóa…" : "Xác nhận xóa"}
              tone="danger"
              disabled={busy}
              onPress={() => void remove()}
            />
            <Button
              title="Hủy"
              tone="secondary"
              disabled={busy}
              onPress={() => setConfirm(false)}
            />
          </View>
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            justifyContent: wide ? "flex-start" : "center",
          }}
        >
          <Button
            title="Sửa"
            disabled={busy || confirm}
            onPress={() =>
              router.push({ pathname: "/products/edit/[id]", params: { id } })
            }
          />
          <Button
            title="Xóa"
            tone="danger"
            disabled={busy || confirm}
            onPress={() => setConfirm(true)}
          />
        </View>
      )
    ) : null;

  return (
    <Page title="Chi tiết sản phẩm" footer={wide ? null : actions}>
      <Message text={error || actionError} />
      <Message text={notice} success />
      {loading ? (
        <Loading />
      ) : product ? (
        <View style={[s.card, { flexDirection: wide ? "row" : "column" }]}>
          <Image
            source={{ uri: product.image }}
            resizeMode="contain"
            style={{
              width: wide ? "48%" : "100%",
              height: wide ? 400 : 320,
              borderRadius: 12,
              backgroundColor: colors.bg,
            }}
          />
          <View style={{ gap: 14, flex: wide ? 1 : undefined }}>
            <Text style={[s.title, { color: colors.danger }]}>
              {formatPrice(product.price)}
            </Text>
            <Text style={s.title}>{product.name}</Text>
            <Text style={s.muted}>Số lượng: {product.soluong}</Text>
            {wide && actions}
          </View>
        </View>
      ) : error ? (
        <Button title="Thử lại" tone="secondary" onPress={() => void load()} />
      ) : null}
      <Button
        title="Quay lại danh sách"
        tone="secondary"
        onPress={() => router.replace("/products")}
      />
    </Page>
  );
}
