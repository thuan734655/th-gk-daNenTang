import type express from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../services/database.js";
import {
  adminEmail,
  adminPasswordHash,
  secret,
  version,
  type Actor,
} from "../services/auth.service.js";
const limits = new Map<
  string,
  {
    count: number;
    until: number;
  }
>();
export const limitAuth: express.RequestHandler = (req, res, next) => {
  const now = Date.now();
  for (const [key, entry] of limits) if (entry.until < now) limits.delete(key);
  const key = req.ip ?? "unknown";
  const entry = limits.get(key) ?? { count: 0, until: now + 900000 };
  entry.count++;
  limits.set(key, entry);
  if (entry.count > 40) {
    res
      .status(429)
      .json({ message: "Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút." });
    return;
  }
  next();
};
export const authenticate: express.RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) throw new ApiError(401, "Vui lòng đăng nhập.");
    let payload: jwt.JwtPayload;
    try {
      const decoded = jwt.verify(token, secret(), {
        algorithms: ["HS256"],
        issuer: "user-management-api",
        audience: "user-management-app",
      });
      if (typeof decoded === "string" || !decoded.sub) throw new Error();
      payload = decoded;
    } catch {
      throw new ApiError(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
    }
    let actor: Actor;
    if (payload.admin === true && payload.sub === "admin") {
      if (payload.ver !== version(adminPasswordHash()))
        throw new ApiError(401, "Phiên đã hết hạn.");
      actor = {
        id: "admin",
        admin: true,
        user: {
          id: "admin",
          email: adminEmail()!,
          hoten: "Quản trị viên",
          hinhanh: "",
        },
      };
    } else {
      throw new ApiError(
        401,
        "Vui lòng đăng nhập bằng tài khoản admin mặc định.",
      );
    }
    res.locals.actor = actor;
    next();
  } catch (error) {
    next(error);
  }
};
export const requireAdmin: express.RequestHandler = (_req, res, next) => {
  if (!(res.locals.actor as Actor).admin) {
    next(new ApiError(403, "Chỉ quản trị viên được dùng chức năng này."));
    return;
  }
  next();
};
