import { useCallback, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "@/services/api";
import type { PublicUser } from "@/types/user";
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
export function useUsers(enabled: boolean) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [query, setQuery] = useState("");
  const [reverse, setReverse] = useState(false);
  const [limit, setLimit] = useState(12);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportText, setExportText] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const pending = useRef(false);
  const load = useCallback(async (visible = false) => {
    if (pending.current) return;
    pending.current = true;
    if (visible) setBusy(true);
    try {
      const result = await api<{
        users: PublicUser[];
      }>("/users");
      setUsers(result.users);
      setError("");
      setUpdatedAt(new Date().toLocaleTimeString("vi-VN"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      void load(true);
      const interval = setInterval(() => {
        if (
          AppState.currentState === "active" &&
          (Platform.OS !== "web" ||
            typeof document === "undefined" ||
            !document.hidden)
        )
          void load();
      }, 5000);
      return () => clearInterval(interval);
    }, [load, enabled]),
  );
  const filtered = useMemo(
    () =>
      users
        .filter((user) =>
          normalize(`${user.hoten} ${user.email}`).includes(
            normalize(query.trim()),
          ),
        )
        .sort(
          (a, b) => (reverse ? -1 : 1) * a.hoten.localeCompare(b.hoten, "vi"),
        ),
    [users, query, reverse],
  );
  async function exportData() {
    setExporting(true);
    setError("");
    try {
      const data = await api<unknown>("/users/export");
      const text = JSON.stringify(data, null, 2);
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(
          new Blob([text], { type: "application/json" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = "users-export.json";
        a.click();
        URL.revokeObjectURL(url);
      } else {
        setExportText(text);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không xuất được dữ liệu.");
    } finally {
      setExporting(false);
    }
  }
  return {
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
  };
}
