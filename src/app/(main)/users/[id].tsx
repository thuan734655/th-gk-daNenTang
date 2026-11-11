import { useCallback, useState } from "react";
import { Image, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { Button, Loading, Message, Page, s } from "@/components/ui/kit";
import type { PublicUser } from "@/types/user";
export default function UserDetail() {
  const { id, confirmDelete } = useLocalSearchParams<{
    id: string;
    confirmDelete?: string;
  }>();
  const { session } = useAuth();
  const [user, setUser] = useState<PublicUser>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [confirm, setConfirm] = useState(
    session?.isAdmin === true && confirmDelete === "1",
  );
  const [deleting, setDeleting] = useState(false);
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      setUser(
        (
          await api<{
            user: PublicUser;
          }>(`/users/${encodeURIComponent(id)}`)
        ).user,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được.");
    } finally {
      setBusy(false);
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function remove() {
    setDeleting(true);
    setError("");
    try {
      const result = await api<{
        warning?: string;
      }>(`/users/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (result.warning) {
        setUser(undefined);
        setConfirm(false);
        setError(result.warning);
      } else router.replace("/users");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không xóa được.");
    } finally {
      setDeleting(false);
    }
  }
  return (
    <Page title="Thông tin người dùng">
      <Message text={error} />
      {busy ? (
        <Loading />
      ) : (
        user && (
          <View style={s.card}>
            {Boolean(user.hinhanh) && (
              <Image
                source={{ uri: user.hinhanh }}
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 28,
                  alignSelf: "center",
                }}
              />
            )}
            <Text style={s.title}>{user.hoten}</Text>
            <Text selectable style={s.muted}>
              {user.email}
            </Text>
            <Text style={s.muted}>Mật khẩu: ••••••••</Text>
            <Button
              title="Chỉnh sửa"
              onPress={() =>
                router.push({ pathname: "/users/edit/[id]", params: { id } })
              }
            />
            {session?.isAdmin && !confirm && (
              <Button
                title="Xóa người dùng"
                tone="danger"
                onPress={() => setConfirm(true)}
              />
            )}
            {confirm && (
              <View style={[s.card, { borderColor: "#fda4af" }]}>
                <Text style={s.label}>
                  Xóa {user.hoten}? Tài khoản và ảnh đại diện sẽ bị xóa.
                </Text>
                <Button
                  title={deleting ? "Đang xóa…" : "Xác nhận xóa"}
                  tone="danger"
                  disabled={deleting}
                  onPress={() => void remove()}
                />
                <Button
                  title="Hủy"
                  tone="secondary"
                  disabled={deleting}
                  onPress={() => setConfirm(false)}
                />
              </View>
            )}
          </View>
        )
      )}
      {!busy && !user && (
        <Button title="Thử lại" tone="secondary" onPress={() => void load()} />
      )}
      <Button
        title="Quay lại"
        tone="secondary"
        onPress={() => router.replace(session?.isAdmin ? "/users" : "/profile")}
      />
    </Page>
  );
}
