import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, readRecords, changeRecords } from "./database.js";
import { uploadAvatar, removeAvatar } from "./images.js";
import {
  productSchema,
  productEditSchema,
} from "../validators/product.schema.js";

type Product = { name: string; price: number; soluong: number; image: string };
type Products = Record<string, Product>;
const node = "products";
const folder = "product-images";

function find(records: Products, id: string) {
  if (!Object.hasOwn(records, id))
    throw new ApiError(404, "Không tìm thấy sản phẩm.");
  return records[id];
}

export async function listProducts() {
  return {
    products: Object.entries(await readRecords<Products>(node)).map(
      ([id, product]) => ({ ...product, id }),
    ),
  };
}

export async function getProduct(id: string) {
  return { product: { ...find(await readRecords<Products>(node), id), id } };
}

export async function createProduct(input: z.infer<typeof productSchema>) {
  const { image: data, ...fields } = input;
  const id = randomUUID();
  const image = await uploadAvatar(data, folder);
  const product = { ...fields, image };
  try {
    await changeRecords<Products, void>(node, (records) => {
      records[id] = product;
    });
  } catch (error) {
    await removeAvatar(image, folder);
    throw error;
  }
  return { product: { ...product, id } };
}

export async function editProduct(
  id: string,
  input: z.infer<typeof productEditSchema>,
) {
  await getProduct(id);
  const { image: data, ...fields } = input;
  const image = data ? await uploadAvatar(data, folder) : undefined;
  const updated = await changeRecords<
    Products,
    { previousImage: string; product: Product }
  >(node, (records) => {
    const product = find(records, id);
    const next = { ...fields, image: image ?? product.image };
    records[id] = next;
    return { previousImage: product.image, product: next };
  }).catch(async (error: unknown) => {
    if (image) await removeAvatar(image, folder);
    throw error;
  });
  const cleaned = image
    ? await removeAvatar(updated.previousImage, folder)
    : true;
  return {
    product: { ...updated.product, id },
    warning: cleaned ? undefined : "Đã lưu. Ảnh cũ cần dọn trên Cloudinary.",
  };
}

export async function deleteProduct(id: string) {
  const image = await changeRecords<Products, string>(node, (records) => {
    const product = find(records, id);
    delete records[id];
    return product.image;
  });
  const cleaned = await removeAvatar(image, folder);
  return {
    warning: cleaned
      ? undefined
      : "Đã xóa sản phẩm. Ảnh cần dọn trên Cloudinary.",
  };
}
