import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

export default defineConfig({
  // Schema path hata diya, introspection use karenge
  out: "./prisma/migrations", // Migrations ko Prisma folder mein rakhte hain
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Neon ka DATABASE_URL
  },
  introspect: {
    casing: "camel", // Optional: DB column names ko camelCase mein convert karega
  },
});