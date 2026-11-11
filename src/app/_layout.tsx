import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerTitle: "Quản lý sản phẩm",
          headerTintColor: "#3458dc",
          headerTransparent: false,
          contentStyle: { backgroundColor: "#f4f6fb" },
        }}
      />
    </AuthProvider>
  );
}
