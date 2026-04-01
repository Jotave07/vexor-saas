import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const requiredEnv = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  throw new Error(`Variaveis obrigatorias ausentes para migracao: ${missingEnv.join(", ")}`);
}

console.log(`Migracao conectando em ${process.env.DB_HOST}:${process.env.DB_PORT} com usuario ${process.env.DB_USER}...`);

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
  connectTimeout: 10000,
});

try {
  const schemaPath = path.resolve("database", "mariadb", "schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");
  const statements = schemaSql
    .split(/;\s*\r?\n/g)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    try {
      await connection.query(statement);
    } catch (error) {
      if ([1050, 1060, 1061, 1091, 1826].includes(error.errno) || String(error.sqlMessage || "").includes("Duplicate key on write or update")) {
        continue;
      }
      throw error;
    }
  }
  console.log("Migracao MariaDB aplicada com sucesso.");
} finally {
  await connection.end();
}
