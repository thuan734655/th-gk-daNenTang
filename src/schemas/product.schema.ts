import { z } from "zod";

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nhập tên sản phẩm.")
    .max(150, "Tên tối đa 150 ký tự."),
  price: z
    .string()
    .trim()
    .regex(/^\d+(?:[.,]\d+)?$/, "Nhập giá từ 0 trở lên.")
    .transform((value) => Number(value.replace(",", ".")))
    .pipe(z.number().max(Number.MAX_SAFE_INTEGER)),
  soluong: z
    .string()
    .trim()
    .regex(/^\d+$/, "Nhập số lượng nguyên từ 0 trở lên.")
    .transform(Number)
    .pipe(z.number().int().nonnegative()),
});
