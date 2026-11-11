import { useCallback, useRef, useState, type ComponentRef } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Field, Loading, Message, Page, s } from "@/components/ui/kit";
import { useProductFilters } from "@/hooks/useProductFilters";
import { formatPrice, listProducts } from "@/services/products";
import type { Product } from "@/types/product";

const sortOptions = [
  { key: "default", label: "Mặc định" },
  { key: "price-up", label: "Giá thấp đến cao" },
  { key: "price-down", label: "Giá cao đến thấp" },
  { key: "name", label: "Tên A–Z" },
] as const;
const isLowStock = (product: Product) =>
  product.soluong >= 1 && product.soluong <= 5;

export default function ProductsScreen() {
  const { signOut } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [panel, setPanel] = useState<"filters" | "sort" | null>(null);
  const [menu, setMenu] = useState<{
    id: string | null;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const menuButtons = useRef(new Map<string, ComponentRef<typeof Pressable>>());
  const headerMenuButton = useRef<ComponentRef<typeof Pressable>>(null);
  const exportOnDismiss = useRef(false);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const menuWidth =
    menu?.id === null
      ? Math.min(270, width - insets.left - insets.right - 16)
      : 156;
  const menuHeight = 168;
  const filters = useProductFilters(products);
  const results = lowStockOnly
    ? filters.results.filter(isLowStock)
    : filters.results;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProducts((await listProducts()).products);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách.");
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function openDetail(id: string) {
    setMenu(null);
    router.push({ pathname: "/products/[id]", params: { id } });
  }

  async function exportProducts() {
    setExporting(true);
    setExportError("");
    try {
      const { products } = await listProducts();
      const escapeCell = (value: string | number) => {
        const text = String(value);
        const safeText =
          typeof value === "string" && /^[\s]*[=+@-]/.test(text)
            ? "'" + text
            : text;
        return '"' + safeText.replaceAll('"', '""') + '"';
      };
      const csv = [
        "id,name,price,soluong,image",
        ...products.map(({ id, name, price, soluong, image }) =>
          [id, name, price, soluong, image ?? ""].map(escapeCell).join(","),
        ),
      ].join("\r\n");
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(
          new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = "products-export.csv";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        await Share.share({ message: csv });
      }
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Không xuất được CSV.");
    } finally {
      setExporting(false);
    }
  }

  function openMenu(id: string | null) {
    const anchor =
      id === null ? headerMenuButton.current : menuButtons.current.get(id);
    anchor?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) setMenu({ id, x, y, width, height });
    });
  }

  const below = menu ? menu.y + menu.height + 6 : 0;
  const top =
    below + menuHeight <= height - insets.bottom - 8
      ? below
      : Math.max(insets.top + 8, (menu?.y ?? 0) - menuHeight - 6);

  return (
    <Page>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text accessibilityRole="header" style={styles.title}>
            Quản lý sản phẩm
          </Text>
          <Text style={styles.muted}>Tổng: {products.length} sản phẩm</Text>
        </View>
        <Pressable
          ref={headerMenuButton}
          accessibilityRole="button"
          accessibilityLabel="Menu quản lý sản phẩm"
          accessibilityState={{ expanded: menu?.id === null }}
          onPress={() => openMenu(null)}
          style={styles.menuButton}
        >
          <Text style={styles.menuText}>☰</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/products/create")}
        style={styles.add}
      >
        <Text style={styles.addText}>＋ Thêm sản phẩm</Text>
      </Pressable>

      <View style={styles.search}>
        <View style={styles.magnifier} />
        <TextInput
          accessibilityLabel="Tìm sản phẩm"
          placeholder="Tìm sản phẩm..."
          placeholderTextColor="#7785a1"
          value={filters.query}
          onChangeText={filters.setQuery}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {filters.query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xóa từ khóa"
            onPress={() => filters.setQuery("")}
            hitSlop={8}
          >
            <Text style={styles.controlText}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.tools}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: panel === "filters" }}
          style={styles.control}
          onPress={() => setPanel(panel === "filters" ? null : "filters")}
        >
          <Text style={styles.controlText}>
            ≡ Lọc {panel === "filters" ? "⌃" : "⌄"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: panel === "sort" }}
          style={styles.control}
          onPress={() => setPanel(panel === "sort" ? null : "sort")}
        >
          <Text style={styles.controlText}>
            ↑↓ Sắp xếp {panel === "sort" ? "⌃" : "⌄"}
          </Text>
        </Pressable>
      </View>
      {lowStockOnly && (
        <View style={s.row}>
          <Text style={styles.lowStock}>Sắp hết hàng ({results.length})</Text>
          <Button
            title="Xem tất cả"
            tone="secondary"
            onPress={() => setLowStockOnly(false)}
          />
        </View>
      )}
      <Message text={exportError} />

      {panel === "filters" && (
        <View style={s.card}>
          <View style={s.row}>
            <View style={{ flex: 1, minWidth: 95 }}>
              <Field
                label="Giá từ (₫)"
                value={filters.minPrice}
                onChangeText={filters.setMinPrice}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1, minWidth: 95 }}>
              <Field
                label="Giá đến (₫)"
                value={filters.maxPrice}
                onChangeText={filters.setMaxPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <Button title="Xóa bộ lọc" tone="secondary" onPress={filters.reset} />
        </View>
      )}
      {panel === "sort" && (
        <View style={s.card}>
          {sortOptions.map(({ key, label }) => (
            <Button
              key={key}
              title={label}
              tone={filters.sort === key ? "primary" : "secondary"}
              onPress={() => {
                filters.setSort(key);
                setPanel(null);
              }}
            />
          ))}
        </View>
      )}
      {filters.priceError ? <Message text={filters.priceError} /> : null}

      {error ? <Message text={error} /> : null}
      {loading ? (
        <Loading />
      ) : error ? (
        <Button title="Thử lại" tone="secondary" onPress={() => void load()} />
      ) : !results.length ? (
        <Text style={styles.muted}>
          {lowStockOnly
            ? "Không có sản phẩm sắp hết hàng phù hợp."
            : products.length
              ? "Không có sản phẩm phù hợp."
              : "Chưa có sản phẩm."}
        </Text>
      ) : (
        <View style={styles.list}>
          {results.map((product) => (
            <View key={product.id} style={styles.card}>
              <View style={styles.cardRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Xem ${product.name}`}
                  onPress={() => openDetail(product.id)}
                  style={styles.product}
                >
                  <Image
                    source={{ uri: product.image }}
                    resizeMode="cover"
                    style={styles.image}
                  />
                  <View style={styles.productText}>
                    <Text style={styles.name}>{product.name}</Text>
                    <Text style={styles.price}>
                      {formatPrice(product.price)}
                    </Text>
                    <Text style={styles.muted}>
                      Số lượng: {product.soluong}
                    </Text>
                    {isLowStock(product) && (
                      <Text style={styles.lowStock}>Sắp hết hàng</Text>
                    )}
                  </View>
                </Pressable>
                <Pressable
                  ref={(view) => {
                    if (view) menuButtons.current.set(product.id, view);
                    else menuButtons.current.delete(product.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Thao tác với ${product.name}`}
                  accessibilityState={{ expanded: menu?.id === product.id }}
                  style={styles.menuButton}
                  onPress={() => openMenu(product.id)}
                >
                  <Text style={styles.menuText}>⋮</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
      <Modal
        transparent
        visible={menu !== null}
        onRequestClose={() => setMenu(null)}
        onDismiss={() => {
          if (exportOnDismiss.current) {
            exportOnDismiss.current = false;
            void exportProducts();
          }
        }}
        statusBarTranslucent
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng menu sản phẩm"
          style={StyleSheet.absoluteFill}
          onPress={() => setMenu(null)}
        />
        {menu && (
          <View
            accessibilityViewIsModal
            style={[
              s.card,
              styles.popup,
              {
                width: menuWidth,
                left: Math.max(
                  insets.left + 8,
                  Math.min(
                    menu.x + menu.width - menuWidth,
                    width - insets.right - menuWidth - 8,
                  ),
                ),
                top,
              },
            ]}
          >
            {menu.id === null ? (
              <>
                <Button
                  title="Xem hàng hóa sắp hết hàng"
                  tone="secondary"
                  onPress={() => {
                    setLowStockOnly(true);
                    setMenu(null);
                  }}
                />
                <Button
                  title={exporting ? "Đang xuất…" : "Xuất dữ liệu"}
                  tone="secondary"
                  disabled={exporting}
                  onPress={() => {
                    setMenu(null);
                    if (Platform.OS === "ios") exportOnDismiss.current = true;
                    else void exportProducts();
                  }}
                />
                <Button
                  title="Đăng xuất"
                  tone="secondary"
                  onPress={() => {
                    setMenu(null);
                    void signOut();
                  }}
                />
              </>
            ) : (
              <>
                <Button
                  title="Sửa"
                  tone="secondary"
                  onPress={() => {
                    setMenu(null);
                    router.push({
                      pathname: "/products/edit/[id]",
                      params: { id: menu.id! },
                    });
                  }}
                />
                <Button
                  title="Xóa"
                  tone="danger"
                  onPress={() => {
                    setMenu(null);
                    router.push({
                      pathname: "/products/[id]",
                      params: { id: menu.id!, confirmDelete: "1" },
                    });
                  }}
                />
                <Button
                  title="Chi tiết"
                  tone="secondary"
                  onPress={() => openDetail(menu.id!)}
                />
              </>
            )}
          </View>
        )}
      </Modal>
    </Page>
  );
}

const navy = "#13264d";
const line = "#dbe5ff";
const styles = StyleSheet.create({
  lowStock: {
    alignSelf: "flex-start",
    backgroundColor: "#fff2cc",
    color: "#784800",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    fontWeight: "700",
  },
  popup: {
    position: "absolute",
    padding: 8,
    gap: 6,
    elevation: 10,
    shadowColor: "#162d66",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
  },
  heading: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  headingText: { flex: 1, gap: 4 },
  title: { color: navy, fontSize: 25, fontWeight: "800" },
  muted: { color: "#5f7194", fontSize: 15 },
  control: {
    borderWidth: 1,
    borderColor: line,
    borderRadius: 16,
    backgroundColor: "#f9fbff",
    paddingHorizontal: 13,
    minHeight: 44,
    justifyContent: "center",
  },
  controlText: { color: "#153c85", fontWeight: "700", fontSize: 14 },
  add: {
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#0755ee",
  },
  addText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: line,
    backgroundColor: "#fff",
  },
  searchInput: { flex: 1, minHeight: 46, color: navy, fontSize: 16 },
  magnifier: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderColor: "#153c85",
    borderWidth: 2,
  },
  tools: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  list: { gap: 12 },
  card: {
    padding: 14,
    gap: 12,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: line,
    shadowColor: "#162d66",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  product: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  image: {
    width: "38%",
    maxWidth: 144,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#edf2ff",
  },
  productText: { flex: 1, minWidth: 0, gap: 7 },
  name: { color: navy, fontSize: 18, fontWeight: "800" },
  price: { color: "#ca1233", fontSize: 17, fontWeight: "800" },
  menuButton: {
    minWidth: 34,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef2fc",
    borderRadius: 10,
  },
  menuText: { color: navy, fontSize: 22, fontWeight: "800" },
});
