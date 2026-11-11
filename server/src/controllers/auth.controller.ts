import type { RequestHandler } from "express";
import { loginSchema } from "../validators/schemas.js";
import { login, type Actor } from "../services/auth.service.js";
export const signIn: RequestHandler = async (req, res) => {
  res.json(await login(loginSchema.parse(req.body)));
};
export const me: RequestHandler = (_req, res) => {
  const actor = res.locals.actor as Actor;
  res.json({ user: actor.user, isAdmin: actor.admin });
};
