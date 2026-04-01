import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { query, withTransaction } from "../server/db.mjs";

const masterEmail = process.env.MASTER_EMAIL;
const masterPassword = process.env.MASTER_PASSWORD;

if (!masterEmail || !masterPassword) {
  throw new Error("Defina MASTER_EMAIL e MASTER_PASSWORD no .env.mariadb.");
}

const existingUser = await query("SELECT id FROM users WHERE email = ?", [masterEmail.toLowerCase()]);
const existingPlans = await query("SELECT id FROM plans LIMIT 1");

if (existingPlans.length === 0) {
  await withTransaction(async (connection) => {
    await connection.query(
      `
        INSERT INTO plans (id, name, description, price, max_products, max_stores, max_users, features, is_active, created_at, updated_at)
        VALUES
        (?, 'Start', 'Plano inicial', 99.90, 200, 1, 3, '[]', 1, NOW(), NOW()),
        (?, 'Scale', 'Plano intermediario', 199.90, 1000, 3, 10, '[]', 1, NOW(), NOW()),
        (?, 'Enterprise', 'Plano avancado', 499.90, 10000, 10, 30, '[]', 1, NOW(), NOW())
      `,
      [uuid(), uuid(), uuid()],
    );
  });
  console.log("Planos iniciais criados.");
}

if (existingUser.length > 0) {
  console.log("Usuario master ja existe.");
  process.exit(0);
}

const passwordHash = await bcrypt.hash(masterPassword, 10);
const userId = uuid();

await withTransaction(async (connection) => {
  await connection.query(
    `
      INSERT INTO users (id, company_id, full_name, email, password_hash, is_active, created_at, updated_at)
      VALUES (?, NULL, 'Administrador Master', ?, ?, 1, NOW(), NOW())
    `,
    [userId, masterEmail.toLowerCase(), passwordHash],
  );

  await connection.query(
    "INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, 'master_admin', NOW())",
    [uuid(), userId],
  );
});

console.log("Usuario master criado com sucesso.");
console.log(`Email: ${masterEmail}`);
