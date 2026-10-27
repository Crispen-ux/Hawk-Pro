import { randomBytes, scryptSync } from "node:crypto";
import { neon } from "@neondatabase/serverless";
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_INITIAL_PASSWORD;
if (!email || !password || password.length < 12 || !process.env.DATABASE_URL)
  throw new Error(
    "Set DATABASE_URL, ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD (at least 12 characters).",
  );
const salt = randomBytes(16).toString("hex");
const hash = salt + ":" + scryptSync(password, salt, 64).toString("hex");
const sql = neon(process.env.DATABASE_URL);
await sql`INSERT INTO accounts(email,name,role,password_hash,verified) VALUES(${email},'Hawk Administrator','admin',${hash},true) ON CONFLICT(email) DO UPDATE SET role='admin'`;
console.log(
  "Administrator provisioned. Existing account passwords are preserved.",
);
