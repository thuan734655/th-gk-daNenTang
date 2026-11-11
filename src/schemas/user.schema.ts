import { z } from "zod";
export const userFormSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ."),
  hoten: z.string().trim().min(2, "Họ tên cần ít nhất 2 ký tự.").max(100),
  matkhau: z.string(),
});
