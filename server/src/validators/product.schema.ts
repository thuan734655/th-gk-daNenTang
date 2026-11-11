import { z } from "zod";

export const productSchema = z
  .object({
    name: z.string().trim().min(1, "Nhập tên sản phẩm.").max(150),
    price: z
      .number()
      .nonnegative("Giá phải từ 0 trở lên.")
      .max(Number.MAX_SAFE_INTEGER),
    soluong: z
      .number()
      .int("Số lượng phải là số nguyên.")
      .nonnegative("Số lượng phải từ 0 trở lên."),
    image: z.string().min(1, "Chọn ảnh sản phẩm.").max(6_000_000),
  })
  .strict();

export const productEditSchema = productSchema.extend({
  image: productSchema.shape.image.optional(),
});
