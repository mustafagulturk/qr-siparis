import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    fileParallelism: false,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/qr_siparis_test",
      SESSION_SECRET: "test-icin-en-az-otuz-iki-karakterlik-anahtar",
    },
    globalSetup: "./tests/global-setup.ts",
  },
});
