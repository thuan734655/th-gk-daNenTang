import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import { ApiError, type publicUser } from "./database.js";
export type Actor = {
  id: string;
  admin: boolean;
  user: ReturnType<typeof publicUser>;
};
export const secret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new ApiError(503, "Backend chưa cấu hình JWT_SECRET đủ dài.");
  return process.env.JWT_SECRET;
};
export const version = (hash: string) =>
  createHash("sha256").update(hash).digest("hex");
export const adminEmail = () =>
  process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@example.com";
export const adminPasswordHash = () =>
  process.env.ADMIN_PASSWORD_HASH ||
  "$2b$12$tBxDBArnrEQSzBMZN/AcK.jo9hKIW3zoV/dtR3uH8PWAnucg3Pp0G";
export function issue(actor: Actor, hash: string) {
  return {
    token: jwt.sign({ admin: actor.admin, ver: version(hash) }, secret(), {
      subject: actor.id,
      algorithm: "HS256",
      expiresIn: "8h",
      issuer: "user-management-api",
      audience: "user-management-app",
    }),
    user: actor.user,
    isAdmin: actor.admin,
  };
}
export async function login(input: { email: string; matkhau: string }) {
  if (input.email === adminEmail()) {
    if (!(await bcrypt.compare(input.matkhau, adminPasswordHash())))
      throw new ApiError(401, "Email hoặc mật khẩu không đúng.");
    return issue(
      {
        id: "admin",
        admin: true,
        user: {
          id: "admin",
          email: input.email,
          hoten: "Quản trị viên",
          hinhanh: "",
        },
      },
      adminPasswordHash(),
    );
  }
  throw new ApiError(401, "Email hoặc mật khẩu không đúng.");
}
