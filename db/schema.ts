import {
  DEFAULT_PRODUCT_DETAILS,
  type ProductDetails,
} from "./product-details";
import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { ProductSpecRow } from "./validation.ts";

export const PRODUCT_STATUS = {
  published: "published",
  draft: "draft",
} as const;

export const ENQUIRY_STATUS = {
  new: "new",
  contacted: "contacted",
  closed: "closed",
} as const;

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  priceZar: integer("price_zar").notNull().default(0),
  shortDescription: text("short_description").notNull(),
  description: text("description").notNull(),
  availability: text("availability").notNull().default("coming-soon"),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  specs: jsonb("specs").$type<ProductSpecRow[]>().notNull().default([]),
  published: boolean("published").notNull().default(false),
  details: jsonb("details")
    .$type<ProductDetails>()
    .notNull()
    .default(DEFAULT_PRODUCT_DETAILS),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const enquiries = pgTable("enquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(),
  status: text("status").notNull().default(ENQUIRY_STATUS.new),
  payload: jsonb("payload").$type<Record<string, string>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type EnquiryRow = typeof enquiries.$inferSelect;
export type NewEnquiryRow = typeof enquiries.$inferInsert;

export const commerce = pgTable(
  "commerce",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("inventory_product_unique")
      .on(sql`(${table.data}->>'productId')`)
      .where(sql`${table.kind} = 'inventory'`),
  ],
);

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("customer"),
  passwordHash: text("password_hash").notNull(),
  verified: boolean("verified").notNull().default(false),
  sessionVersion: integer("session_version").notNull().default(0),
});
export const challenges = pgTable(
  "auth_challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    purpose: text("purpose").notNull(),
    hash: text("hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("challenge_email_purpose_unique").on(
      table.email,
      table.purpose,
    ),
  ],
);
export const authLimits = pgTable("auth_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(1),
});
