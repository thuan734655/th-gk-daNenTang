import { useState } from "react";
import { Image, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Page, s } from "@/components/ui/kit";
export default function Profile() {
  const { session, signOut } = useAuth();
  const [failed, setFailed] = useState(false);
  if (session?.isAdmin) return <Redirect href="/products" />;
  if (!session) return null;
  const { user } = session;
  return (
    <Page
      title="Tài khoản của tôi"
      subtitle="Quản lý thông tin cá nhân và bảo mật tài khoản."
    >
      <View style={s.card}>
        {user.hinhanh && !failed ? (
          <Image
            onError={() => setFailed(true)}
            source={{ uri: user.hinhanh }}
            style={{
              width: 140,
              height: 140,
              borderRadius: 30,
              alignSelf: "center",
            }}
          />
        ) : (
          <Text style={{ fontSize: 60, textAlign: "center" }}>👤</Text>
        )}
        <Text style={s.title}>{user.hoten}</Text>
        <Text selectable style={s.muted}>
          {user.email}
        </Text>
        <Button
          title="Sửa thông tin / đổi ảnh"
          onPress={() =>
            router.push({
              pathname: "/users/edit/[id]",
              params: { id: user.id },
            })
          }
        />
        <Button
          title="Đổi mật khẩu"
          tone="secondary"
          onPress={() => router.push("/change-password")}
        />
        <Button
          title="Đăng xuất"
          tone="secondary"
          onPress={() => void signOut()}
        />
      </View>
    </Page>
  );
}
