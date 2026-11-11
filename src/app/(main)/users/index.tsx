import { FlatList, Image, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useUsers } from "@/hooks/useUsers";
import { Button, Loading, Message, Field, Page, s } from "@/components/ui/kit";
export default function UsersScreen() {
  const { session, signOut } = useAuth();
  const {
    users,
    query,
    setQuery,
    reverse,
    setReverse,
    limit,
    setLimit,
    error,
    busy,
    exporting,
    exportText,
    setExportText,
    updatedAt,
    load,
    filtered,
    exportData,
  } = useUsers(Boolean(session?.isAdmin));
  if (!session?.isAdmin) return <Redirect href="/profile" />;
  return (
    <Page
      title="Quản lý người dùng"
      subtitle={`Xin chào, ${session.user.hoten}. ${users.length} tài khoản trong hệ thống.`}
    >
      <View style={s.row}>
        <Button
          title="+ Thêm người dùng"
          onPress={() => router.push("/users/create")}
        />
        <Button
          title={exporting ? "Đang xuất…" : "Xuất JSON"}
          disabled={exporting}
          tone="secondary"
          onPress={() => void exportData()}
        />
        <Button
          title="Đăng xuất"
          tone="secondary"
          onPress={() => void signOut()}
        />
      </View>
      <View style={s.card}>
        <Field
          label="Tìm theo họ tên hoặc email"
          value={query}
          onChangeText={(value) => {
            setQuery(value);
            setLimit(12);
          }}
          placeholder="Nhập từ khóa…"
        />
        <View style={s.row}>
          <Button
            title={reverse ? "Tên: Z → A" : "Tên: A → Z"}
            tone="secondary"
            onPress={() => {
              setReverse(!reverse);
              setLimit(12);
            }}
          />
          <Button
            title="Làm mới"
            tone="secondary"
            disabled={busy}
            onPress={() => void load(true)}
          />
          <Text style={s.muted}>
            {filtered.length} kết quả · Tự cập nhật mỗi 5 giây
            {updatedAt ? ` · ${updatedAt}` : ""}
          </Text>
        </View>
      </View>
      <Message text={error} />
      {busy && <Loading />}
      <FlatList
        scrollEnabled={false}
        data={filtered.slice(0, limit)}
        keyExtractor={(user) => user.id}
        contentContainerStyle={{ gap: 12 }}
        ListEmptyComponent={
          !busy ? (
            <View style={s.card}>
              <Text style={s.muted}>
                {query
                  ? "Không có kết quả phù hợp."
                  : "Chưa có người dùng. Hãy thêm tài khoản đầu tiên."}
              </Text>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              {item.hinhanh ? (
                <Image source={{ uri: item.hinhanh }} style={s.avatar} />
              ) : (
                <View
                  style={[
                    s.avatar,
                    { alignItems: "center", justifyContent: "center" },
                  ]}
                >
                  <Text style={{ fontSize: 26 }}>{item.hoten[0]}</Text>
                </View>
              )}
              <View style={{ flex: 1, minWidth: 150, gap: 5 }}>
                <Text style={[s.label, { fontSize: 18 }]}>{item.hoten}</Text>
                <Text style={s.muted}>{item.email}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button
                  title="Chi tiết"
                  tone="secondary"
                  onPress={() =>
                    router.push({
                      pathname: "/users/[id]",
                      params: { id: item.id },
                    })
                  }
                />
                <Button
                  title="Sửa"
                  tone="secondary"
                  onPress={() =>
                    router.push({
                      pathname: "/users/edit/[id]",
                      params: { id: item.id },
                    })
                  }
                />
                <Button
                  title="Xóa"
                  tone="danger"
                  onPress={() =>
                    router.push({
                      pathname: "/users/[id]",
                      params: { id: item.id, confirmDelete: "1" },
                    })
                  }
                />
              </View>
            </View>
          </View>
        )}
      />
      {limit < filtered.length && (
        <Button
          title="Tải thêm"
          tone="secondary"
          onPress={() => setLimit(limit + 12)}
        />
      )}
      {Boolean(exportText) && (
        <View style={s.card}>
          <Text style={s.label}>Dữ liệu JSON (nhấn giữ để sao chép)</Text>
          <Text selectable>{exportText}</Text>
          <Button
            title="Đóng"
            tone="secondary"
            onPress={() => setExportText("")}
          />
        </View>
      )}
    </Page>
  );
}
