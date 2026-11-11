import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import type { userSchema, editSchema } from "../validators/schemas.js";
import { adminEmail, secret, type Actor } from "./auth.service.js";
import {
  ApiError,
  changeUsers,
  publicUser,
  readUsers,
  type UserRecord,
} from "./database.js";
import { removeAvatar, uploadAvatar } from "./images.js";
export async function createUser(input: z.infer<typeof userSchema>) {
  secret();
  if (
    input.email === adminEmail() ||
    Object.values(await readUsers()).some((user) => user.email === input.email)
  )
    throw new ApiError(409, "Email đã được sử dụng.");
  const id = randomUUID();
  const hash = await bcrypt.hash(input.matkhau, 12);
  const image = await uploadAvatar(input.image);
  const user: UserRecord = {
    email: input.email,
    matkhau: hash,
    hoten: input.hoten,
    hinhanh: image,
  };
  try {
    await changeUsers((users) => {
      if (Object.values(users).some((item) => item.email === input.email))
        throw new ApiError(409, "Email đã được sử dụng.");
      users[id] = user;
    });
  } catch (error) {
    await removeAvatar(image);
    throw error;
  }
  return { id, user };
}
export async function getUser(actor: Actor, id: string) {
  if (!actor.admin && actor.id !== id)
    throw new ApiError(403, "Bạn không có quyền xem tài khoản này.");
  const user = (await readUsers())[id];
  if (!user) throw new ApiError(404, "Không tìm thấy người dùng.");
  return { user: publicUser(id, user) };
}
export async function editUser(
  actor: Actor,
  id: string,
  input: z.infer<typeof editSchema>,
) {
  if (!actor.admin && actor.id !== id)
    throw new ApiError(403, "Bạn không có quyền sửa tài khoản này.");
  if (!actor.admin && input.matkhau)
    throw new ApiError(403, "Sử dụng chức năng đổi mật khẩu.");
  if (input.email === adminEmail())
    throw new ApiError(409, "Email đã được sử dụng.");
  if (!(await readUsers())[id])
    throw new ApiError(404, "Không tìm thấy người dùng.");
  const newHash = input.matkhau
    ? await bcrypt.hash(input.matkhau, 12)
    : undefined;
  const image = input.image ? await uploadAvatar(input.image) : undefined;
  let oldImage = "";
  let updated: UserRecord;
  try {
    updated = await changeUsers((users) => {
      if (!users[id]) throw new ApiError(404, "Không tìm thấy người dùng.");
      if (
        Object.entries(users).some(
          ([key, value]) => key !== id && value.email === input.email,
        )
      )
        throw new ApiError(409, "Email đã được sử dụng.");
      oldImage = users[id].hinhanh;
      users[id] = {
        email: input.email,
        hoten: input.hoten,
        matkhau: newHash ?? users[id].matkhau,
        hinhanh: image ?? oldImage,
      };
      return users[id];
    });
  } catch (error) {
    if (image) await removeAvatar(image);
    throw error;
  }
  const cleaned = image ? await removeAvatar(oldImage) : true;
  return {
    user: publicUser(id, updated),
    warning: cleaned ? undefined : "Đã lưu. Ảnh cũ cần dọn trên Cloudinary.",
  };
}
export async function deleteUser(id: string) {
  const image = await changeUsers((users) => {
    if (!users[id]) throw new ApiError(404, "Không tìm thấy người dùng.");
    const url = users[id].hinhanh;
    delete users[id];
    return url;
  });
  const cleaned = await removeAvatar(image);
  return {
    message: "Đã xóa người dùng.",
    warning: cleaned ? undefined : "Ảnh cũ cần dọn trên Cloudinary.",
  };
}
export async function listUsers() {
  return {
    users: Object.entries(await readUsers()).map(([id, user]) =>
      publicUser(id, user),
    ),
  };
}
export async function exportUsers() {
  return { users: await readUsers() };
}
