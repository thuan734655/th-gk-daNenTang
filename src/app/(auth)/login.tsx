import { useState } from "react";
import { Text, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { Button, Field, Message, Page, s } from "@/components/ui/kit";
import type { PublicUser } from "@/types/user";
export default function Login() {
  const { signIn, error: restoreError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function login() {
    if (!email.trim() || !password) {
      setError("Nhập email và mật khẩu.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signIn(
        await api<{
          token: string;
          user: PublicUser;
          isAdmin: boolean;
        }>("/auth/login", {
          method: "POST",
          body: { email: email.trim(), matkhau: password },
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đăng nhập thất bại.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Chào mừng trở lại"
      subtitle="Đăng nhập admin để quản lý sản phẩm."
    >
      <View
        style={[s.card, { maxWidth: 520, width: "100%", alignSelf: "center" }]}
      >
        <Text style={[s.title, { fontSize: 22 }]}>Đăng nhập</Text>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!busy}
        />
        <Field
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!busy}
          onSubmitEditing={() => void login()}
        />
        <Message text={error || restoreError} />
        <Button
          title={busy ? "Đang đăng nhập…" : "Đăng nhập"}
          disabled={busy}
          onPress={() => void login()}
        />
      </View>
    </Page>
  );
}
