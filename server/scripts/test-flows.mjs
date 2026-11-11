import "dotenv/config";
import assert from "node:assert/strict";
import fs from "node:fs";
import { once } from "node:events";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { getApps, deleteApp } from "firebase-admin/app";

// Isolated HTTP server and admin credentials; only temporary test records are modified.
const adminPassword = randomBytes(18).toString("hex");
process.env.ADMIN_EMAIL = `integration-admin-${Date.now()}@example.com`;
process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash(adminPassword, 10);
const { app } = await import("../dist/app.js");
const { getImageStorage } = await import("../dist/config/services.js");
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const base = `http://127.0.0.1:${server.address().port}`;
let adminToken;
const created = new Set();
let count = 0;
async function call(path, { method = "GET", token, body, status = 200 } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(90000),
  });
  const data = await response.json();
  assert.equal(
    response.status,
    status,
    `${method} ${path}: ${data.message ?? response.status}`,
  );
  return data;
}
function passed(name) {
  count++;
  console.log(`PASS ${count}: ${name}`);
}
const password = "Integration-test-123!";
const suffix = Date.now();
const input = {
  email: `integration-${suffix}@example.com`,
  hoten: "Kiểm thử tự động",
  matkhau: password,
};
const image = `data:image/png;base64,${fs.readFileSync("../assets/images/icon.png").toString("base64")}`;
try {
  await call("/health");
  await call("/users", { status: 401 });
  passed("Health and unauthenticated access");
  const admin = await call("/auth/login", {
    method: "POST",
    body: { email: process.env.ADMIN_EMAIL, matkhau: adminPassword },
  });
  adminToken = admin.token;
  assert.equal(admin.isAdmin, true);
  passed("Admin login");
  const registration = await call("/auth/register", {
    method: "POST",
    body: input,
    status: 201,
  });
  created.add(registration.user.id);
  assert.equal(registration.isAdmin, false);
  assert.ok(!("matkhau" in registration.user));
  passed("Register without leaking password");
  await call("/auth/register", {
    method: "POST",
    body: { ...input, role: "admin" },
    status: 400,
  });
  await call("/auth/register", {
    method: "POST",
    body: { ...input, email: "INVALID" },
    status: 400,
  });
  await call("/auth/register", {
    method: "POST",
    body: { ...input, email: input.email.toUpperCase() },
    status: 409,
  });
  passed("Validation, strict fields and duplicate normalized email");
  await call("/auth/login", {
    method: "POST",
    body: { email: input.email, matkhau: "wrong-password" },
    status: 401,
  });
  const login = await call("/auth/login", {
    method: "POST",
    body: { email: input.email, matkhau: password },
  });
  await call("/users", { token: login.token, status: 403 });
  await call("/users/export", { token: login.token, status: 403 });
  await call(`/users/${login.user.id}`, { token: login.token });
  passed("User login and permission boundaries");
  const [header, payload, signature] = login.token.split(".");
  const forged = `${header}.${Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString()), admin: true, sub: "admin" })).toString("base64url")}.${signature}`;
  await call("/auth/me", { token: forged, status: 401 });
  passed("Tampered JWT rejected");
  const made = await call("/users", {
    method: "POST",
    token: adminToken,
    body: { ...input, email: `integration-image-${suffix}@example.com`, image },
    status: 201,
  });
  created.add(made.user.id);
  assert.ok(made.user.hinhanh.startsWith("https://res.cloudinary.com/"));
  const firstId = made.user.hinhanh.match(/\/v\d+\/(.+)\.[a-z]+$/)[1];
  const uploaded = await getImageStorage().api.resource(firstId);
  assert.equal(uploaded.asset_folder, "user-avatars");
  passed("Admin creates user and image in user-avatars");
  await call(`/users/${made.user.id}`, { token: login.token, status: 403 });
  await call(`/users/${made.user.id}`, {
    token: login.token,
    method: "DELETE",
    status: 403,
  });
  await call(`/users/${made.user.id}`, {
    token: login.token,
    method: "PATCH",
    body: { email: input.email, hoten: "Không được phép" },
    status: 403,
  });
  passed("Cross-account read, edit and delete denied");
  await call(`/users/${made.user.id}`, {
    token: adminToken,
    method: "PATCH",
    body: { email: input.email, hoten: "Trùng email" },
    status: 409,
  });
  const edited = await call(`/users/${made.user.id}`, {
    token: adminToken,
    method: "PATCH",
    body: { email: made.user.email, hoten: "Đã chỉnh sửa", image },
  });
  assert.equal(edited.user.hoten, "Đã chỉnh sửa");
  assert.notEqual(edited.user.hinhanh, made.user.hinhanh);
  assert.ok(!edited.warning);
  let removed = false;
  try {
    await getImageStorage().api.resource(firstId);
  } catch (error) {
    if ((error.http_code ?? error.error?.http_code) === 404) removed = true;
    else throw error;
  }
  assert.ok(removed, "Old avatar must be removed");
  passed("Update data, replace avatar and remove old image");
  const exported = await call("/users/export", { token: adminToken });
  const row = exported.users[made.user.id];
  assert.deepEqual(Object.keys(row).sort(), [
    "email",
    "hinhanh",
    "hoten",
    "matkhau",
  ]);
  assert.ok(await bcrypt.compare(password, row.matkhau));
  passed("JSON export has exactly four fields and hashed password");
  const list = await call("/users", { token: adminToken });
  assert.ok(list.users.some((user) => user.id === made.user.id));
  assert.ok(list.users.every((user) => !("matkhau" in user)));
  passed("List excludes password hashes");
  await call(`/users/${login.user.id}`, {
    token: login.token,
    method: "PATCH",
    body: { email: input.email, hoten: "Tự sửa thông tin" },
  });
  await call("/auth/change-password", {
    method: "POST",
    token: login.token,
    body: { currentPassword: "wrong", newPassword: "New-integration-123!" },
    status: 400,
  });
  await call("/auth/change-password", {
    method: "POST",
    token: login.token,
    body: { currentPassword: password, newPassword: "New-integration-123!" },
  });
  await call("/auth/me", { token: login.token, status: 401 });
  await call("/auth/login", {
    method: "POST",
    body: { email: input.email, matkhau: "New-integration-123!" },
  });
  passed("Edit own profile, change password and invalidate old token");
  const secondId = edited.user.hinhanh.match(/\/v\d+\/(.+)\.[a-z]+$/)[1];
  const deleted = await call(`/users/${made.user.id}`, {
    token: adminToken,
    method: "DELETE",
  });
  created.delete(made.user.id);
  assert.ok(!deleted.warning);
  await call(`/users/${made.user.id}`, { token: adminToken, status: 404 });
  let secondRemoved = false;
  try {
    await getImageStorage().api.resource(secondId);
  } catch (error) {
    if ((error.http_code ?? error.error?.http_code) === 404)
      secondRemoved = true;
    else throw error;
  }
  assert.ok(secondRemoved);
  passed("Delete user and Cloudinary avatar");
} catch (error) {
  console.error(
    "FAILED:",
    error instanceof assert.AssertionError
      ? error.message
      : (error.code ??
          error.http_code ??
          error.error?.http_code ??
          error.name ??
          "UNKNOWN"),
  );
  process.exitCode = 1;
} finally {
  for (const id of created) {
    try {
      await call(`/users/${id}`, { method: "DELETE", token: adminToken });
      console.log("Temporary account cleaned up.");
    } catch {
      console.error(`Cleanup needed for test account: ${id}`);
      process.exitCode = 1;
    }
  }
  await new Promise((resolve) => server.close(resolve));
  await Promise.all(getApps().map(deleteApp));
  console.log(`Completed ${count} integration checks.`);
}
