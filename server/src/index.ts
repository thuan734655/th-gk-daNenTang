import "dotenv/config";
import { app } from "./app.js";
const port = Number(process.env.PORT ?? 3001);
const server = app.listen(port, "0.0.0.0", () =>
  console.log(`API listening on http://localhost:${port}`),
);
server.on("error", (error) => {
  console.error("Cannot start API:", error.message);
  process.exitCode = 1;
});
