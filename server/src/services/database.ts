import { getUserDatabase } from "../config/services.js";
import { getApp } from "firebase-admin/app";
export interface UserRecord {
  email: string;
  matkhau: string;
  hoten: string;
  hinhanh: string;
}
export type Users = Record<string, UserRecord>;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function request(
  path: string,
  method: string,
  body?: object,
  etag?: string,
) {
  const db = getUserDatabase();
  const token = await getApp().options.credential!.getAccessToken();
  const reference = db.ref(path).toString();
  const url =
    path === "/"
      ? `${reference.replace(/\/$/, "")}/.json`
      : `${reference}.json`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
      ...(method === "GET" ? { "X-Firebase-ETag": "true" } : {}),
      ...(etag ? { "if-match": etag } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok && response.status !== 412)
    throw new ApiError(
      502,
      "Không thể kết nối cơ sở dữ liệu. Vui lòng thử lại.",
    );
  return response;
}
export async function readUsers(): Promise<Users> {
  return readRecords<Users>("users");
}
export async function changeUsers<T>(change: (users: Users) => T): Promise<T> {
  return changeRecords<Users, T>("users", change);
}
export async function readRecords<T extends object>(path: string): Promise<T> {
  return (await (await request(path, "GET")).json()) ?? {};
}
// An ETag keeps concurrent writes from overwriting changes to this node.
export async function changeRecords<T extends object, R>(
  path: string,
  change: (records: T) => R,
): Promise<R> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await request(path, "GET");
    const records: T = (await response.json()) ?? {};
    const result = change(records);
    const etag = response.headers.get("etag");
    if (!etag) throw new ApiError(502, "Cơ sở dữ liệu không trả về ETag.");
    if ((await request(path, "PUT", records, etag)).status !== 412)
      return result;
  }
  throw new ApiError(409, "Dữ liệu vừa thay đổi. Vui lòng thử lại.");
}
export function publicUser(id: string, user: UserRecord) {
  return { id, email: user.email, hoten: user.hoten, hinhanh: user.hinhanh };
}
