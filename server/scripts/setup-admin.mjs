import "dotenv/config";
import fs from "node:fs";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
if (
  process.env.ADMIN_EMAIL &&
  process.env.ADMIN_PASSWORD_HASH &&
  !process.argv.includes("--reset")
) {
  console.log(
    "Admin already configured. Use --reset to generate a new password.",
  );
} else {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = randomBytes(12).toString("base64url");
  const hash = await bcrypt.hash(password, 12);
  let contents = fs.readFileSync(".env", "utf8");
  for (const [name, value] of Object.entries({
    ADMIN_EMAIL: email,
    ADMIN_PASSWORD_HASH: hash,
  })) {
    const expression = new RegExp(`^${name}=.*$`, "m");
    contents = expression.test(contents)
      ? contents.replace(expression, () => `${name}=${value}`)
      : `${contents.trimEnd()}\n${name}=${value}\n`;
  }
  fs.writeFileSync(".env", contents);
  console.log(
    `Admin email: ${email}\nInitial password: ${password}\nRestart the API after changing admin settings.`,
  );
}
