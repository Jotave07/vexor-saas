import mysql from "mysql2/promise";

const requiredEnv = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`Variaveis ausentes: ${missingEnv.join(", ")}`);
  process.exit(1);
}

let connection;

try {
  connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectTimeout: 10000,
  });

  const [rows] = await connection.query("SELECT DATABASE() AS database_name, CURRENT_USER() AS current_user_name");
  const info = rows[0];

  console.log("Conexao MariaDB estabelecida com sucesso.");
  console.log(`Database: ${info.database_name}`);
  console.log(`Usuario atual: ${info.current_user_name}`);
} catch (error) {
  console.error("Falha ao conectar no MariaDB.");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (connection) {
    await connection.end();
  }
}
