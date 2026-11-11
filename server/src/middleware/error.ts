import type express from "express";
import { z } from "zod";
import { ApiError } from "../services/database.js";
export const errorHandler: express.ErrorRequestHandler = (
  error: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
) => {
  if (error instanceof z.ZodError) {
    res
      .status(400)
      .json({ message: error.issues[0]?.message ?? "Dữ liệu không hợp lệ." });
    return;
  }
  if (error instanceof ApiError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  if (
    (
      error as {
        type?: string;
      }
    )?.type === "entity.too.large"
  ) {
    res.status(413).json({ message: "Ảnh hoặc dữ liệu quá lớn." });
    return;
  }
  if (error instanceof SyntaxError) {
    res.status(400).json({ message: "JSON không hợp lệ." });
    return;
  }
  console.error(
    "Request failed:",
    (
      error as {
        code?: string;
      }
    )?.code ?? "SERVICE_ERROR",
  );
  res
    .status(502)
    .json({ message: "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại." });
};
