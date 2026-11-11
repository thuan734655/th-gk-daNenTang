import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { UserForm } from "@/components/UserForm";
import { Button, Loading, Message, Page } from "@/components/ui/kit";
import type { PublicUser } from "@/types/user";
export default function EditUser() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const { session, refresh } = useAuth();
  const [user, setUser] = useState<PublicUser>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
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
  return (
    <Page title="Chỉnh sửa người dùng">
      <Message text={error} />
      <Message text={message} success />
      {busy ? (
        <Loading />
      ) : (
        user && (
          <UserForm
            key={user.id}
            initial={user}
            canSetPassword={session?.isAdmin}
            submitLabel="Lưu thay đổi"
            onSubmit={async (input) => {
              const result = await api<{
                warning?: string;
              }>(`/users/${encodeURIComponent(id)}`, {
                method: "PATCH",
                body: input,
              });
              if (!session?.isAdmin) await refresh();
              if (result.warning) setMessage(result.warning);
              else router.replace(session?.isAdmin ? "/users" : "/profile");
            }}
          />
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
