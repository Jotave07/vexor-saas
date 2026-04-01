import { generateId } from "./services.mjs";

export async function logActivity(connection, {
  userId = null,
  companyId = null,
  action,
  entityType = null,
  entityId = null,
  details = null,
  ipAddress = null,
}) {
  await connection.query(
    `
      INSERT INTO activity_logs (
        id, user_id, company_id, action, entity_type, entity_id, details, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      generateId(),
      userId,
      companyId,
      action,
      entityType,
      entityId,
      details ? JSON.stringify(details) : null,
      ipAddress,
    ],
  );
}

export async function trackChange(connection, {
  userId = null,
  companyId = null,
  entityType,
  entityId,
  action,
  beforeData = null,
  afterData = null,
}) {
  await connection.query(
    `
      INSERT INTO change_history (
        id, company_id, user_id, entity_type, entity_id, action, before_data, after_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      generateId(),
      companyId,
      userId,
      entityType,
      entityId,
      action,
      beforeData ? JSON.stringify(beforeData) : null,
      afterData ? JSON.stringify(afterData) : null,
    ],
  );
}
