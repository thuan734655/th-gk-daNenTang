import { randomUUID } from "node:crypto";
import { getImageStorage } from "../config/services.js";
import { ApiError } from "./database.js";

async function addToProductCollection(collectionId: string, assetId: string) {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  const credentials = Buffer.from(
    `${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`,
  ).toString("base64");
  const cloud = encodeURIComponent(CLOUDINARY_CLOUD_NAME!);
  const collection = encodeURIComponent(collectionId);
  const response = await fetch(
    `https://api.cloudinary.com/v2/asset_management/${cloud}/collections/${collection}/assets`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([assetId]),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok)
    throw new Error(`Cloudinary Collections HTTP ${response.status}`);
}

export async function uploadAvatar(
  data?: string,
  folder: "user-avatars" | "product-images" = "user-avatars",
) {
  if (!data) return "";
  if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(data))
    throw new ApiError(400, "Chọn ảnh JPG, PNG hoặc WebP hợp lệ.");
  if (Buffer.from(data.split(",")[1], "base64").length > 4 * 1024 * 1024)
    throw new ApiError(400, "Ảnh tối đa 4 MB.");
  const result = await getImageStorage().uploader.upload(data, {
    public_id: `${folder}/${randomUUID()}`,
    asset_folder: folder,
    overwrite: false,
    resource_type: "image",
    allowed_formats: ["jpg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }],
    timeout: 30000,
  });
  const collectionId = process.env.CLOUDINARY_PRODUCT_COLLECTION_ID?.trim();
  if (folder === "product-images" && collectionId) {
    try {
      await addToProductCollection(collectionId, result.asset_id);
    } catch {
      await removeAvatar(result.secure_url, folder);
      throw new ApiError(502, "Không thêm được ảnh vào collection Cloudinary.");
    }
  }
  return result.secure_url;
}
export async function removeAvatar(
  url: string,
  folder: "user-avatars" | "product-images" = "user-avatars",
) {
  if (!url) return true;
  const match = url.match(
    /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/v\d+\/((?:user-avatars|product-images)\/[a-zA-Z0-9-]+)\.[a-z]+$/,
  );
  if (
    !match ||
    match[1] !== process.env.CLOUDINARY_CLOUD_NAME ||
    !match[2].startsWith(`${folder}/`)
  )
    return true;
  try {
    await getImageStorage().uploader.destroy(match[2], { invalidate: true });
    return true;
  } catch {
    console.warn("Avatar cleanup failed; retry from Cloudinary Media Library.");
    return false;
  }
}
