import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "kitchen"]);
export const orderStatusEnum = pgEnum("order_status", [
  "new",
  "preparing",
  "ready",
  "served",
  "cancelled",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  // Fiyatlar kuruş cinsinden tam sayı olarak tutulur (ondalık hatası olmasın)
  price: integer("price").notNull(),
  emoji: text("emoji").notNull().default("🍽️"),
  isAvailable: boolean("is_available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // QR koddaki tahmin edilemez anahtar; masa numarasıyla sipariş verilmesini engeller
  token: text("token").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: serial("number").notNull(),
  tableId: integer("table_id")
    .notNull()
    .references(() => tables.id),
  status: orderStatusEnum("status").notNull().default("new"),
  note: text("note").notNull().default(""),
  total: integer("total").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  // Ürün sonradan değişse bile siparişteki ad ve fiyat korunur
  name: text("name").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));
export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));
export const tablesRelations = relations(tables, ({ many }) => ({ orders: many(orders) }));
export const ordersRelations = relations(orders, ({ one, many }) => ({
  table: one(tables, { fields: [orders.tableId], references: [tables.id] }),
  items: many(orderItems),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type Role = (typeof roleEnum.enumValues)[number];
