import "dotenv/config";
import { deleteApp } from "firebase-admin/app";
import { getUserDatabase, getImageStorage } from "../dist/config/services.js";

let failed = false;
async function check(name, action) {
  try {
    await action();
    console.log(`${name}: OK`);
  } catch (error) {
    failed = true;
    // Avoid printing SDK error objects, which can contain request credentials.
    const code =
      error?.code ??
      error?.http_code ??
      error?.cause?.code ??
      error?.name ??
      "ERROR";
    console.log(`${name}: FAILED (${String(code)})`);
  }
}

await check("Firebase Realtime Database (read only)", async () => {
  const required = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_DATABASE_URL",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw { code: `MISSING: ${missing.join(", ")}` };
  const database = getUserDatabase();
  try {
    const token = await database.app.options.credential.getAccessToken();
    const url = new URL(`${database.ref("users").toString()}.json`);
    url.searchParams.set("shallow", "true");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token.access_token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw { code: `HTTP_${response.status}` };
    await response.json();
  } finally {
    await deleteApp(database.app);
  }
});

await check("Cloudinary (authenticated ping)", async () => {
  const result = await getImageStorage().api.ping({ timeout: 15000 });
  if (result.status !== "ok") throw { code: "UNEXPECTED_RESPONSE" };
});

process.exitCode = failed ? 1 : 0;
