import express from "express";
import cors from "cors";
import helmet from "helmet";
import { routes } from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";
export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "user-management-api" }),
);
app.use(routes);
app.use((_req, res) => {
  res.status(404).json({ message: "Không tìm thấy API." });
});
app.use(errorHandler);
