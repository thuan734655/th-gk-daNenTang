import "dotenv/config";
import { isDeepStrictEqual } from "node:util";
import { deleteApp, getApps } from "firebase-admin/app";
import { changeRecords, readRecords } from "../dist/services/database.js";

function flatten(root) {
  const unexpected = Object.keys(root).filter(
    (key) => !["products", "catalog", "admins"].includes(key),
  );
  if (unexpected.length)
    throw new Error(
      `Dừng chuyển dữ liệu vì có node ngoài phạm vi: ${unexpected.join(", ")}.`,
    );
  const extraCatalog = Object.keys(root.catalog ?? {}).filter(
    (key) => !["products", "hiddenProducts"].includes(key),
  );
  if (extraCatalog.length)
    throw new Error("Catalog có dữ liệu ngoài danh sách sản phẩm.");
  const products = { ...root.products };
  const expectedFields = ["image", "name", "price", "soluong"];
  for (const records of [
    root.products,
    root.catalog?.products,
    root.catalog?.hiddenProducts,
  ]) {
    for (const [id, product] of Object.entries(records ?? {})) {
      if (
        !product ||
        !isDeepStrictEqual(Object.keys(product).sort(), expectedFields)
      ) {
        throw new Error(`Sản phẩm ${id} không có đúng bốn trường.`);
      }
      if (
        Object.hasOwn(products, id) &&
        !isDeepStrictEqual(products[id], product)
      ) {
        throw new Error(`Trùng ID với dữ liệu khác nhau: ${id}.`);
      }
      products[id] = product;
    }
  }
  return products;
}

try {
  const root = await readRecords("/");
  const planned = flatten(root);
  console.log(
    `Products: ${Object.keys(planned).length}. Legacy catalog: ${Boolean(root.catalog)}. Legacy admins: ${Boolean(root.admins)}.`,
  );
  if (process.argv.includes("--apply") && (root.catalog || root.admins)) {
    await changeRecords("/", (current) => {
      current.products = flatten(current);
      delete current.catalog;
      delete current.admins;
    });
    const migrated = await readRecords("/");
    if (Object.keys(migrated).some((key) => key !== "products"))
      throw new Error("Còn node ngoài products sau khi chuyển.");
    for (const [id, product] of Object.entries(planned)) {
      if (!isDeepStrictEqual(migrated.products?.[id], product))
        throw new Error(`Dữ liệu đã thay đổi khi kiểm tra: ${id}.`);
    }
    console.log("Migration verified.");
  }
} finally {
  await Promise.all(getApps().map(deleteApp));
}
