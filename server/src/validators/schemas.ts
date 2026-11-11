import { z } from "zod";
export const password = z
  .string()
  .min(8, "Mật khẩu cần ít nhất 8 ký tự.")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Mật khẩu tối đa 72 byte.",
  );
const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email không hợp lệ.")
  .max(254);
export const userSchema = z
  .object({
    email,
    hoten: z.string().trim().min(2, "Họ tên cần ít nhất 2 ký tự.").max(100),
    matkhau: password,
    image: z.string().max(6000000).optional(),
  })
  .strict();
export const editSchema = userSchema.extend({ matkhau: password.optional() });
export const loginSchema = z
  .object({ email, matkhau: z.string().min(1).max(200) })
  .strict();
