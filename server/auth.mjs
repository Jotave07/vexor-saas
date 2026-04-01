import jwt from "jsonwebtoken";
import { queryOne } from "./db.mjs";

export const SESSION_COOKIE = "vexor_session";

export function signSession(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifySession(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export async function getUserContextById(userId) {
  const user = await queryOne(
    `
      SELECT
        u.id,
        u.company_id,
        u.full_name,
        u.email,
        u.phone,
        u.avatar_url,
        u.is_active,
        c.name AS company_name,
        c.status AS company_status,
        GROUP_CONCAT(ur.role) AS roles
      FROM users u
      LEFT JOIN companies c ON c.id = u.company_id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.id = ?
      GROUP BY u.id, c.name, c.status
    `,
    [userId],
  );

  if (!user) return null;

  return {
    id: user.id,
    companyId: user.company_id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    isActive: Boolean(user.is_active),
    companyName: user.company_name,
    companyStatus: user.company_status,
    roles: user.roles ? String(user.roles).split(",") : [],
  };
}

export async function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];

  if (!token) {
    return res.status(401).json({ message: "Nao autenticado." });
  }

  try {
    const payload = verifySession(token);
    const user = await getUserContextById(payload.userId);

    if (!user || !user.isActive) {
      clearSessionCookie(res);
      return res.status(401).json({ message: "Sessao invalida." });
    }

    const isMaster = user.roles.includes("master_admin");

    if (!isMaster && user.companyStatus && !["active", "trial"].includes(user.companyStatus)) {
      return res.status(403).json({ message: "Acesso bloqueado para esta empresa." });
    }

    req.user = user;
    req.sessionId = payload.sessionId;
    next();
  } catch (error) {
    clearSessionCookie(res);
    return res.status(401).json({ message: "Sessao expirada." });
  }
}

export function requireRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Nao autenticado." });
    }

    const allowed = allowedRoles.some((role) => req.user.roles.includes(role));
    if (!allowed) {
      return res.status(403).json({ message: "Sem permissao para esta acao." });
    }

    next();
  };
}
