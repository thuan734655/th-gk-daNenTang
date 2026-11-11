import type { RequestHandler } from "express";
import * as products from "../services/product.service.js";
import {
  productSchema,
  productEditSchema,
} from "../validators/product.schema.js";

export const list: RequestHandler = async (_req, res) => {
  res.json(await products.listProducts());
};
export const get: RequestHandler = async (req, res) => {
  res.json(await products.getProduct(String(req.params.id)));
};
export const create: RequestHandler = async (req, res) => {
  res
    .status(201)
    .json(await products.createProduct(productSchema.parse(req.body)));
};
export const update: RequestHandler = async (req, res) => {
  res.json(
    await products.editProduct(
      String(req.params.id),
      productEditSchema.parse(req.body),
    ),
  );
};
export const remove: RequestHandler = async (req, res) => {
  res.json(await products.deleteProduct(String(req.params.id)));
};
