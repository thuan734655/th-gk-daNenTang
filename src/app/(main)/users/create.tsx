import { Redirect, router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { UserForm } from "@/components/UserForm";
import { Button, Page } from "@/components/ui/kit";
export default function CreateUser() {
  const { session } = useAuth();
  if (!session?.isAdmin) return <Redirect href="/profile" />;
  return (
    <Page
      title="Thêm người dùng"
      subtitle="Tạo tài khoản với ảnh đại diện tùy chọn."
    >
      <UserForm
        submitLabel="Tạo người dùng"
        onSubmit={async (input) => {
          await api("/users", { method: "POST", body: input });
          router.replace("/users");
        }}
      />
      <Button
        title="Quay lại danh sách"
        tone="secondary"
        onPress={() => router.replace("/users")}
      />
    </Page>
  );
}
