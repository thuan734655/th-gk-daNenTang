import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
const baseUrl = (
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/$/, "");
let token: string | null = null;
let onUnauthorized: (() => void) | undefined;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function setUnauthorizedHandler(handler?: () => void) {
  onUnauthorized = handler;
}
export async function loadToken() {
  token =
    Platform.OS === "web"
      ? typeof window !== "undefined"
        ? window.localStorage.getItem("session")
        : null
      : await SecureStore.getItemAsync("session");
  return token;
}
export async function saveToken(value: string | null) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    if (value) window.localStorage.setItem("session", value);
    else window.localStorage.removeItem("session");
  } else if (Platform.OS !== "web") {
    if (value) await SecureStore.setItemAsync("session", value);
    else await SecureStore.deleteItemAsync("session");
  }
  token = value;
}
export async function api<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(65000),
    });
  } catch {
    throw new ApiError(
      0,
      "Không kết nối được máy chủ. Kiểm tra mạng và địa chỉ API.",
    );
  }
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/login"))
      onUnauthorized?.();
    throw new ApiError(response.status, data.message ?? "Yêu cầu thất bại.");
  }
  return data as T;
}
export const checkApiHealth = () =>
  api<{
    status: string;
    service: string;
  }>("/health");
