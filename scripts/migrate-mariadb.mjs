import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
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
