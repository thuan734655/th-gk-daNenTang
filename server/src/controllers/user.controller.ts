import type { RequestHandler } from "express";
import { userSchema, editSchema } from "../validators/schemas.js";
import { publicUser } from "../services/database.js";
import * as users from "../services/user.service.js";
export const list: RequestHandler = async (_req, res) => {
  res.json(await users.listUsers());
};
export const get: RequestHandler = async (req, res) => {
  res.json(await users.getUser(res.locals.actor, String(req.params.id)));
};
export const create: RequestHandler = async (req, res) => {
  const { id, user } = await users.createUser(userSchema.parse(req.body));
  res.status(201).json({ user: publicUser(id, user) });
};
export const update: RequestHandler = async (req, res) => {
  res.json(
    await users.editUser(
      res.locals.actor,
      String(req.params.id),
      editSchema.parse(req.body),
    ),
  );
};
export const remove: RequestHandler = async (req, res) => {
  res.json(await users.deleteUser(String(req.params.id)));
};
export const exportJson: RequestHandler = async (_req, res) => {
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="users-export.json"',
  );
  res.json(await users.exportUsers());
};
