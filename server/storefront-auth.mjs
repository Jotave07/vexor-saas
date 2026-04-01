import jwt from "jsonwebtoken";
import { queryOne } from "./db.mjs";

export const CUSTOMER_SESSION_COOKIE = "vexor_customer_session";

export function signCustomerSession(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "14d" });
}

export function verifyCustomerSession(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function setCustomerSessionCookie(res, token) {
  res.cookie(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 14 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearCustomerSessionCookie(res) {
  res.clearCookie(CUSTOMER_SESSION_COOKIE, { path: "/" });
}

export async function getCustomerContextById(accountId) {
  const account = await queryOne(
    `
      SELECT
        ca.id,
        ca.store_id,
        ca.customer_id,
        ca.full_name,
        ca.email,
        ca.phone,
        ca.document,
        ca.is_active,
        s.slug AS store_slug,
        s.name AS store_name
      FROM customer_accounts ca
      INNER JOIN stores s ON s.id = ca.store_id
      WHERE ca.id = ?
      LIMIT 1
    `,
    [accountId],
  );

  if (!account) return null;

  return {
    id: account.id,
    storeId: account.store_id,
    customerId: account.customer_id,
    fullName: account.full_name,
    email: account.email,
    phone: account.phone,
    document: account.document,
    isActive: Boolean(account.is_active),
    storeSlug: account.store_slug,
    storeName: account.store_name,
  };
}

export async function requireCustomerAuth(req, res, next) {
  const token = req.cookies?.[CUSTOMER_SESSION_COOKIE];
  if (!token) {
    return res.status(401).json({ message: "Cliente nao autenticado." });
  }

  try {
    const payload = verifyCustomerSession(token);
    const customer = await getCustomerContextById(payload.customerAccountId);
    if (!customer || !customer.isActive) {
      clearCustomerSessionCookie(res);
      return res.status(401).json({ message: "Sessao do cliente invalida." });
    }

    const activeSession = await queryOne(
      "SELECT id FROM customer_sessions WHERE id = ? AND customer_account_id = ? AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1",
      [payload.sessionId, customer.id],
    );

    if (!activeSession) {
      clearCustomerSessionCookie(res);
      return res.status(401).json({ message: "Sessao do cliente expirada." });
    }

    req.customer = customer;
    req.customerSessionId = payload.sessionId;
    next();
  } catch {
    clearCustomerSessionCookie(res);
    return res.status(401).json({ message: "Sessao do cliente expirada." });
  }
}

