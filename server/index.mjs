import { config } from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { pool, query, queryOne, withTransaction } from "./db.mjs";
import { clearSessionCookie, getUserContextById, requireAuth, requireRoles, setSessionCookie, signSession } from "./auth.mjs";
import { logActivity, trackChange } from "./audit.mjs";
import { generateId, parseJsonField, slugify } from "./services.mjs";
import {
  clearCustomerSessionCookie,
  getCustomerContextById,
  requireCustomerAuth,
  setCustomerSessionCookie,
  signCustomerSession,
  verifyCustomerSession,
} from "./storefront-auth.mjs";
import {
  createMercadoPagoPreference,
  fetchMercadoPagoPayment,
  findStoreBySlug,
  getStoreIntegration,
  listStoreIntegrations,
  logIntegration,
  orderStatusFromPaymentStatus,
  paymentStatusFromMercadoPago,
  quoteShippingForStore,
  resolveCep,
  summarizeCartProducts,
  upsertStoreIntegration,
} from "./storefront-services.mjs";
import {
  calculatePaymentCostBreakdown,
  getPaymentDiagnostics,
  logPaymentProviderEvent,
  persistIntegrationTestRun,
  resolvePaymentProvider,
} from "./payment-providers.mjs";

config({ path: ".env.mariadb" });

const app = express();
const apiPort = Number(process.env.API_PORT || 3001);

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://127.0.0.1:8080",
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

const companyStatusEnum = ["active", "trial", "suspended", "cancelled", "defaulting"];
const orderStatusEnum = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

async function getCompanyStore(companyId) {
  return queryOne(
    "SELECT id, name, slug, domain, logo_url, favicon_url, is_active, theme_colors FROM stores WHERE company_id = ? ORDER BY created_at ASC LIMIT 1",
    [companyId],
  );
}

async function enrichUser(user) {
  const primaryStore = user.companyId ? await getCompanyStore(user.companyId) : null;
  return {
    ...user,
    storeId: primaryStore?.id ?? null,
    storeName: primaryStore?.name ?? null,
  };
}

async function ensureStoreAccess(user, storeId) {
  if (user.roles.includes("master_admin")) return true;
  const store = await queryOne("SELECT id FROM stores WHERE id = ? AND company_id = ?", [storeId, user.companyId]);
  return Boolean(store);
}

function buildStorePayload(body) {
  return {
    name: body.name,
    slug: body.slug || slugify(body.name),
    domain: body.domain || null,
    logo_url: body.logo_url || null,
    favicon_url: body.favicon_url || null,
    theme_colors: JSON.stringify(body.theme_colors || { primary: "#111111", secondary: "#ffffff" }),
  };
}

function buildDefaultStoreSettings(storeName = "Loja") {
  return {
    checkout_settings: { guestCheckout: false, allowPixPriority: true },
    shipping_settings: { flatRate: 0, methods: [] },
    payment_methods: [
      { code: "pix", label: "PIX", enabled: true, priority: 1 },
      { code: "card", label: "Cartao de credito", enabled: true, priority: 2 },
      { code: "boleto", label: "Boleto", enabled: false, priority: 3 },
    ],
    seo_settings: { title: storeName, metaTitle: storeName },
    policies: {},
    social_links: {},
    institutional_texts: {},
    visual_settings: {
      topBarMessage: "Operacao segura, atendimento comercial e checkout protegido.",
      categoryNavLabel: "Departamentos",
      supportLabel: "Atendimento especializado",
    },
    home_settings: {
      heroTitle: "Catalogo robusto, compra segura e atendimento comercial em cada etapa.",
      heroSubtitle: "Explore departamentos, vitrines e campanhas com uma navegacao completa e configurada pela propria loja.",
      categorySectionTitle: "Navegue pelas linhas da operacao",
      categorySectionEyebrow: "Compre por departamento",
      offersTitle: "Condicoes especiais para acelerar a conversao",
      offersEyebrow: "Ofertas em evidencia",
      featuredTitle: "Produtos com mais presenca comercial",
      featuredEyebrow: "Mais vendidos e destaques",
      latestTitle: "Lancamentos e oportunidades da operacao",
      latestEyebrow: "Catalogo em movimento",
      supportTitle: "Precisa de ajuda para fechar seu pedido?",
      supportBody: "Use o atendimento comercial para tirar duvidas sobre produtos, condicoes de pagamento, entrega e disponibilidade.",
    },
    campaign_settings: {
      heroBadge: "Operacao comercial estruturada",
      promoLabel: "Campanha",
      supportLabel: "Destaque",
      seasonalHeadline: "Campanhas e promocoes definidas pela propria loja.",
    },
    footer_settings: {
      aboutTitle: storeName,
      aboutText: "Operacao estruturada para vender com agilidade, atendimento comercial e condicoes claras para empresas e consumidores finais.",
      supportTitle: "Atendimento",
      supportBody: "Canais oficiais da loja para vendas, duvidas e suporte.",
    },
    trust_badges: [
      { title: "Compra segura", text: "Fluxo protegido com pedido e pagamento persistidos." },
      { title: "Atendimento comercial", text: "Suporte direto para fechar pedidos e acompanhar entregas." },
      { title: "Envio nacional", text: "Frete calculado conforme as regras e integracoes desta loja." },
    ],
    featured_brands: [],
  };
}

function sanitizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function publicPaymentMethods(settings) {
  return Array.isArray(settings?.payment_methods)
    ? settings.payment_methods
      .map((method) => {
        if (typeof method === "string") {
          return { code: method, label: method.toUpperCase(), enabled: true };
        }
        return {
          code: method?.code || slugify(method?.label || "pagamento"),
          label: method?.label || method?.code || "Pagamento",
          enabled: method?.enabled !== false,
        };
      })
      .filter((method) => method.enabled !== false)
    : [];
}

function normalizeDeliveryStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  const supported = ["pending", "ready_to_ship", "shipped", "in_transit", "delivered", "failed", "returned", "cancelled"];
  return supported.includes(status) ? status : "pending";
}

async function findStoreOrThrow(slug) {
  const store = await findStoreBySlug(slug);
  if (!store || !store.is_active || !["active", "trial"].includes(store.company_status)) {
    return null;
  }
  return store;
}

async function appendOrderStatusHistory(connection, {
  orderId,
  fromStatus = null,
  toStatus = null,
  fromPaymentStatus = null,
  toPaymentStatus = null,
  note = null,
  createdByType = "system",
  userId = null,
  customerAccountId = null,
}) {
  await connection.query(
    `
      INSERT INTO order_status_history (
        id, order_id, from_status, to_status, from_payment_status, to_payment_status, note, created_by_type, user_id, customer_account_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [generateId(), orderId, fromStatus, toStatus, fromPaymentStatus, toPaymentStatus, note, createdByType, userId, customerAccountId],
  );
}

async function getOptionalCustomerFromRequest(req, storeId) {
  const token = req.cookies?.vexor_customer_session;
  if (!token) return null;

  try {
    const payload = verifyCustomerSession(token);
    const customer = await getCustomerContextById(payload.customerAccountId);
    if (!customer || customer.storeId !== storeId || !customer.isActive) {
      return null;
    }

    const session = await queryOne(
      "SELECT id FROM customer_sessions WHERE id = ? AND customer_account_id = ? AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1",
      [payload.sessionId, customer.id],
    );
    return session ? customer : null;
  } catch {
    return null;
  }
}

async function assertCustomerBelongsToStore(customerAccountId, storeId) {
  if (!customerAccountId) return null;
  return queryOne(
    "SELECT id, store_id, customer_id, email FROM customer_accounts WHERE id = ? AND store_id = ? AND is_active = 1 LIMIT 1",
    [customerAccountId, storeId],
  );
}

async function getOrCreateStorefrontCart(connection, { storeId, sessionToken, customerAccountId = null }) {
  const [existingRows] = await connection.query(
    `
      SELECT id, customer_account_id
      FROM storefront_carts
      WHERE store_id = ? AND session_token = ? AND status = 'active'
      LIMIT 1
    `,
    [storeId, sessionToken],
  );

  if (existingRows[0]) {
    if (customerAccountId && existingRows[0].customer_account_id !== customerAccountId) {
      await connection.query(
        "UPDATE storefront_carts SET customer_account_id = ?, updated_at = NOW() WHERE id = ?",
        [customerAccountId, existingRows[0].id],
      );
    }
    return existingRows[0];
  }

  const cartId = generateId();
  await connection.query(
    `
      INSERT INTO storefront_carts (id, store_id, customer_account_id, session_token, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', NOW(), NOW())
    `,
    [cartId, storeId, customerAccountId, sessionToken],
  );

  return { id: cartId, customer_account_id: customerAccountId };
}

async function loadCart(storeId, sessionToken) {
  const cart = await queryOne(
    `
      SELECT *
      FROM storefront_carts
      WHERE store_id = ? AND session_token = ? AND status = 'active'
      LIMIT 1
    `,
    [storeId, sessionToken],
  );

  if (!cart) {
    return { cart: null, items: [], subtotal: 0 };
  }

  const items = await query(
    `
      SELECT
        sci.id,
        sci.product_id,
        sci.quantity,
        sci.unit_price,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.sale_price,
        p.stock,
        p.images,
        p.is_active
      FROM storefront_cart_items sci
      INNER JOIN products p ON p.id = sci.product_id
      WHERE sci.cart_id = ?
      ORDER BY sci.created_at ASC
    `,
    [cart.id],
  );

  const subtotal = items.reduce((sum, item) => sum + Number(item.unit_price) * Number(item.quantity), 0);
  return { cart, items, subtotal: Number(subtotal.toFixed(2)) };
}

async function upsertCustomerProfile(connection, { storeId, accountId = null, customer, address }) {
  let customerRecord = null;

  if (accountId) {
    const [accountRows] = await connection.query(
      "SELECT customer_id FROM customer_accounts WHERE id = ? AND store_id = ? LIMIT 1",
      [accountId, storeId],
    );
    const customerId = accountRows[0]?.customer_id;
    if (customerId) {
      const [customerRows] = await connection.query("SELECT id FROM customers WHERE id = ? LIMIT 1", [customerId]);
      customerRecord = customerRows[0] || null;
    }
  }

  if (!customerRecord) {
    const [customerRows] = await connection.query(
      "SELECT id FROM customers WHERE store_id = ? AND email = ? LIMIT 1",
      [storeId, sanitizeEmail(customer.email)],
    );
    customerRecord = customerRows[0] || null;
  }

  const serializedAddresses = JSON.stringify(address ? [address] : []);

  if (customerRecord) {
    await connection.query(
      `
        UPDATE customers
        SET name = ?, email = ?, phone = ?, document = ?, addresses = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [customer.name, sanitizeEmail(customer.email) || null, customer.phone || null, customer.document || null, serializedAddresses, customerRecord.id],
    );
    return customerRecord.id;
  }

  const customerId = generateId();
  await connection.query(
    `
      INSERT INTO customers (id, store_id, name, email, phone, document, addresses, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
    [customerId, storeId, customer.name, sanitizeEmail(customer.email) || null, customer.phone || null, customer.document || null, serializedAddresses],
  );

  if (accountId) {
    await connection.query("UPDATE customer_accounts SET customer_id = ?, updated_at = NOW() WHERE id = ?", [customerId, accountId]);
  }

  return customerId;
}

app.get("/api/health", asyncHandler(async (_req, res) => {
  const row = await queryOne("SELECT NOW() AS server_time");
  res.json({ ok: true, serverTime: row.server_time });
}));

app.post("/api/auth/login", asyncHandler(async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });
  const { email, password } = schema.parse(req.body);

  const user = await queryOne("SELECT id, password_hash, is_active FROM users WHERE email = ?", [email.toLowerCase()]);
  if (!user || !user.is_active) {
    return res.status(401).json({ message: "Credenciais invalidas." });
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ message: "Credenciais invalidas." });
  }

  const sessionId = uuid();
  const context = await getUserContextById(user.id);
  const richUser = await enrichUser(context);

  await withTransaction(async (connection) => {
    await connection.query(
      "INSERT INTO user_sessions (id, user_id, ip_address, user_agent, created_at, expires_at) VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY))",
      [sessionId, user.id, req.ip, req.headers['user-agent'] ?? null],
    );

    await logActivity(connection, {
      userId: user.id,
      companyId: richUser.companyId,
      action: "login",
      entityType: "session",
      entityId: sessionId,
      ipAddress: req.ip,
    });
  });

  setSessionCookie(res, signSession({ sessionId, userId: user.id }));
  res.json({ user: richUser });
}));

app.post("/api/auth/logout", requireAuth, asyncHandler(async (req, res) => {
  await query("UPDATE user_sessions SET revoked_at = NOW() WHERE id = ?", [req.sessionId]);
  clearSessionCookie(res);
  res.json({ ok: true });
}));

app.get("/api/auth/me", requireAuth, asyncHandler(async (req, res) => {
  const user = await enrichUser(req.user);
  res.json({ user });
}));

app.post("/api/auth/forgot-password", asyncHandler(async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const { email } = schema.parse(req.body);
  const user = await queryOne("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);

  let resetToken = null;
  if (user) {
    resetToken = uuid();
    await query(
      "INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE), NOW())",
      [generateId(), user.id, resetToken],
    );
  }

  res.json({
    ok: true,
    message: "Se o email existir, um token de recuperacao foi gerado.",
    resetToken,
    resetUrl: resetToken ? `${process.env.FRONTEND_URL || "http://127.0.0.1:8080"}/reset-password?token=${resetToken}` : null,
  });
}));

app.post("/api/auth/reset-password", asyncHandler(async (req, res) => {
  const schema = z.object({
    token: z.string().min(10),
    password: z.string().min(6),
  });
  const { token, password } = schema.parse(req.body);

  const resetRecord = await queryOne(
    "SELECT id, user_id FROM password_reset_tokens WHERE token = ? AND used_at IS NULL AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
    [token],
  );

  if (!resetRecord) {
    return res.status(400).json({ message: "Token invalido ou expirado." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await withTransaction(async (connection) => {
    await connection.query("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?", [passwordHash, resetRecord.user_id]);
    await connection.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?", [resetRecord.id]);
    await connection.query("UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL", [resetRecord.user_id]);
  });

  res.json({ ok: true });
}));

app.get("/api/admin/dashboard", requireAuth, requireRoles(["master_admin"]), asyncHandler(async (_req, res) => {
  const [companyCounts, storeCounts, userCount, recentCompanies, recurringRevenue, subscriptionStats] = await Promise.all([
    query(`
      SELECT
        COUNT(*) AS total_companies,
        SUM(CASE WHEN status = 'defaulting' THEN 1 ELSE 0 END) AS defaulting_companies,
        SUM(CASE WHEN status = 'trial' THEN 1 ELSE 0 END) AS trial_companies
      FROM companies
    `),
    query(`
      SELECT
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_stores,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive_stores
      FROM stores
    `),
    query("SELECT COUNT(*) AS total_users FROM users"),
    query("SELECT id, name, email, status, created_at FROM companies ORDER BY created_at DESC LIMIT 5"),
    query("SELECT COALESCE(SUM(amount), 0) AS recurring_revenue FROM subscriptions WHERE status IN ('active', 'trial')"),
    query("SELECT status, COUNT(*) AS total FROM subscriptions GROUP BY status"),
  ]);

  res.json({
    stats: {
      totalCompanies: Number(companyCounts[0]?.total_companies || 0),
      activeStores: Number(storeCounts[0]?.active_stores || 0),
      inactiveStores: Number(storeCounts[0]?.inactive_stores || 0),
      defaultingCompanies: Number(companyCounts[0]?.defaulting_companies || 0),
      totalUsers: Number(userCount[0]?.total_users || 0),
      trialCompanies: Number(companyCounts[0]?.trial_companies || 0),
      recurringRevenue: Number(recurringRevenue[0]?.recurring_revenue || 0),
      subscriptionsByStatus: subscriptionStats,
    },
    recentCompanies,
  });
}));

app.get("/api/admin/companies", requireAuth, requireRoles(["master_admin"]), asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${String(req.query.search)}%` : null;
  const status = req.query.status && req.query.status !== "all" ? String(req.query.status) : null;

  const filters = [];
  const params = [];
  if (search) {
    filters.push("(c.name LIKE ? OR c.email LIKE ?)");
    params.push(search, search);
  }
  if (status) {
    filters.push("c.status = ?");
    params.push(status);
  }

  const companies = await query(
    `
      SELECT
        c.*,
        s.id AS store_id,
        s.name AS store_name,
        s.slug AS store_slug,
        p.name AS plan_name,
        sub.status AS subscription_status,
        sub.due_date
      FROM companies c
      LEFT JOIN stores s ON s.company_id = c.id
      LEFT JOIN subscriptions sub ON sub.company_id = c.id
      LEFT JOIN plans p ON p.id = sub.plan_id
      ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
      ORDER BY c.created_at DESC
    `,
    params,
  );

  res.json({ companies });
}));

app.post("/api/admin/companies", requireAuth, requireRoles(["master_admin"]), asyncHandler(async (req, res) => {
  const schema = z.object({
    company: z.object({
      name: z.string().min(2),
      email: z.string().optional().default(""),
      phone: z.string().optional().default(""),
      document: z.string().optional().default(""),
      address: z.string().optional().default(""),
      status: z.enum(companyStatusEnum).default("trial"),
      notes: z.string().optional().default(""),
    }),
    store: z.object({
      name: z.string().optional().default(""),
      slug: z.string().optional().default(""),
      domain: z.string().optional().default(""),
    }).optional(),
    planId: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    adminUser: z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
    }).optional(),
  });
  const payload = schema.parse(req.body);

  const companyId = generateId();
  const storeId = payload.store?.name ? generateId() : null;
  const adminUserId = payload.adminUser ? generateId() : null;

  await withTransaction(async (connection) => {
    await connection.query(
      `
        INSERT INTO companies (id, name, document, email, phone, address, status, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        companyId,
        payload.company.name,
        payload.company.document || null,
        payload.company.email || null,
        payload.company.phone || null,
        payload.company.address || null,
        payload.company.status,
        payload.company.notes || null,
      ],
    );

    if (storeId && payload.store) {
      const storePayload = buildStorePayload(payload.store);
      const defaultSettings = buildDefaultStoreSettings(storePayload.name);
      await connection.query(
        `
          INSERT INTO stores (id, company_id, name, slug, domain, logo_url, favicon_url, theme_colors, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
        `,
        [storeId, companyId, storePayload.name, storePayload.slug, storePayload.domain, storePayload.logo_url, storePayload.favicon_url, storePayload.theme_colors],
      );

      await connection.query(
        `
          INSERT INTO store_settings (
            id, store_id, checkout_settings, shipping_settings, payment_methods, seo_settings, policies, social_links, institutional_texts, visual_settings, home_settings, campaign_settings, footer_settings, trust_badges, featured_brands, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
        [
          generateId(),
          storeId,
          JSON.stringify(defaultSettings.checkout_settings),
          JSON.stringify(defaultSettings.shipping_settings),
          JSON.stringify(defaultSettings.payment_methods),
          JSON.stringify(defaultSettings.seo_settings),
          JSON.stringify(defaultSettings.policies),
          JSON.stringify(defaultSettings.social_links),
          JSON.stringify(defaultSettings.institutional_texts),
          JSON.stringify(defaultSettings.visual_settings),
          JSON.stringify(defaultSettings.home_settings),
          JSON.stringify(defaultSettings.campaign_settings),
          JSON.stringify(defaultSettings.footer_settings),
          JSON.stringify(defaultSettings.trust_badges),
          JSON.stringify(defaultSettings.featured_brands),
        ],
      );
    }

    if (payload.planId) {
      const plan = await queryOne("SELECT id, price FROM plans WHERE id = ?", [payload.planId]);
      if (plan) {
        const dueDate = payload.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const subscriptionId = generateId();
        await connection.query(
          `
            INSERT INTO subscriptions (id, company_id, plan_id, status, start_date, due_date, amount, created_at, updated_at)
            VALUES (?, ?, ?, ?, CURDATE(), ?, ?, NOW(), NOW())
          `,
          [subscriptionId, companyId, payload.planId, payload.company.status === "trial" ? "trial" : "active", dueDate, plan.price],
        );
        await connection.query(
          `
            INSERT INTO payment_history (id, subscription_id, company_id, amount, due_date, status, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
          `,
          [generateId(), subscriptionId, companyId, plan.price, dueDate, payload.company.status === "defaulting" ? "overdue" : "pending", "Cobranca inicial da assinatura"],
        );
      }
    }

    if (adminUserId && payload.adminUser) {
      const passwordHash = await bcrypt.hash(payload.adminUser.password, 10);
      await connection.query(
        `
          INSERT INTO users (id, company_id, full_name, email, password_hash, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
        `,
        [adminUserId, companyId, payload.adminUser.fullName, payload.adminUser.email.toLowerCase(), passwordHash],
      );
      await connection.query("INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, 'company_admin', NOW())", [generateId(), adminUserId]);
    }

    await logActivity(connection, {
      userId: req.user.id,
      companyId,
      action: "create_company",
      entityType: "company",
      entityId: companyId,
      details: payload,
      ipAddress: req.ip,
    });
  });

  res.status(201).json({ ok: true, companyId });
}));

app.put("/api/admin/companies/:companyId", requireAuth, requireRoles(["master_admin"]), asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().optional().default(""),
    phone: z.string().optional().default(""),
    document: z.string().optional().default(""),
    address: z.string().optional().default(""),
    status: z.enum(companyStatusEnum),
    notes: z.string().optional().default(""),
  });
  const data = schema.parse(req.body);
  const before = await queryOne("SELECT * FROM companies WHERE id = ?", [req.params.companyId]);

  await withTransaction(async (connection) => {
    await connection.query(
      `
        UPDATE companies
        SET name = ?, email = ?, phone = ?, document = ?, address = ?, status = ?, notes = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [data.name, data.email || null, data.phone || null, data.document || null, data.address || null, data.status, data.notes || null, req.params.companyId],
    );
    await logActivity(connection, {
      userId: req.user.id,
      companyId: req.params.companyId,
      action: "update_company",
      entityType: "company",
      entityId: req.params.companyId,
      details: data,
      ipAddress: req.ip,
    });
    await trackChange(connection, {
      userId: req.user.id,
      companyId: req.params.companyId,
      entityType: "company",
      entityId: req.params.companyId,
      action: "update",
      beforeData: before,
      afterData: data,
    });
  });

  res.json({ ok: true });
}));

app.patch("/api/admin/companies/:companyId/status", requireAuth, requireRoles(["master_admin"]), asyncHandler(async (req, res) => {
  const schema = z.object({ status: z.enum(companyStatusEnum) });
  const { status } = schema.parse(req.body);
  const companyId = req.params.companyId;

  await withTransaction(async (connection) => {
    await connection.query("UPDATE companies SET status = ?, updated_at = NOW() WHERE id = ?", [status, companyId]);
    await logActivity(connection, {
      userId: req.user.id,
      companyId,
      action: "change_company_status",
      entityType: "company",
      entityId: companyId,
      details: { status },
      ipAddress: req.ip,
    });
  });

  res.json({ ok: true });
}));

app.get("/api/admin/plans", requireAuth, requireRoles(["master_admin"]), asyncHandler(async (_req, res) => {
  const plans = await query("SELECT * FROM plans ORDER BY price ASC");
  res.json({ plans });
}));

app.post("/api/admin/plans", requireAuth, requireRoles(["master_admin"]), asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    description: z.string().optional().default(""),
    price: z.number(),
    max_products: z.number().int().positive().default(100),
    max_stores: z.number().int().positive().default(1),
    max_users: z.number().int().positive().default(3),
  });
  const data = schema.parse(req.body);
  const id = generateId();

  await withTransaction(async (connection) => {
    await connection.query(
      `
        INSERT INTO plans (id, name, description, price, max_products, max_stores, max_users, features, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
      `,
      [id, data.name, data.description || null, data.price, data.max_products, data.max_stores, data.max_users, JSON.stringify([])],
    );
    await logActivity(connection, {
      userId: req.user.id,
      action: "create_plan",
      entityType: "plan",
      entityId: id,
      details: data,
      ipAddress: req.ip,
    });
  });

  res.status(201).json({ ok: true, id });
}));

app.put("/api/admin/plans/:planId", requireAuth, requireRoles(["master_admin"]), asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    description: z.string().optional().default(""),
    price: z.number(),
    max_products: z.number().int().positive(),
    max_stores: z.number().int().positive(),
    max_users: z.number().int().positive(),
  });
  const data = schema.parse(req.body);

  await withTransaction(async (connection) => {
    await connection.query(
      `
        UPDATE plans
        SET name = ?, description = ?, price = ?, max_products = ?, max_stores = ?, max_users = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [data.name, data.description || null, data.price, data.max_products, data.max_stores, data.max_users, req.params.planId],
    );
    await logActivity(connection, {
      userId: req.user.id,
      action: "update_plan",
      entityType: "plan",
      entityId: req.params.planId,
      details: data,
      ipAddress: req.ip,
    });
  });

  res.json({ ok: true });
}));

app.get("/api/admin/users", requireAuth, requireRoles(["master_admin"]), asyncHandler(async (_req, res) => {
  const users = await query(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.created_at,
      c.name AS company_name,
      GROUP_CONCAT(ur.role) AS roles
    FROM users u
    LEFT JOIN companies c ON c.id = u.company_id
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    GROUP BY u.id, c.name
    ORDER BY u.created_at DESC
  `);
  res.json({
    users: users.map((user) => ({
      ...user,
      roles: user.roles ? String(user.roles).split(",") : [],
    })),
  });
}));

app.get("/api/admin/logs", requireAuth, requireRoles(["master_admin"]), asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${String(req.query.search)}%` : null;
  const logs = await query(
    `
      SELECT
        l.*,
        u.full_name AS user_name,
        c.name AS company_name
      FROM activity_logs l
      LEFT JOIN users u ON u.id = l.user_id
      LEFT JOIN companies c ON c.id = l.company_id
      ${search ? "WHERE l.action LIKE ? OR u.full_name LIKE ? OR c.name LIKE ?" : ""}
      ORDER BY l.created_at DESC
      LIMIT 100
    `,
    search ? [search, search, search] : [],
  );
  res.json({ logs });
}));

app.get("/api/admin/financial", requireAuth, requireRoles(["master_admin"]), asyncHandler(async (req, res) => {
  const filter = req.query.filter && req.query.filter !== "all" ? String(req.query.filter) : null;
  const search = req.query.search ? `%${String(req.query.search)}%` : null;
  const clauses = [];
  const params = [];

  if (filter) {
    clauses.push("sub.status = ?");
    params.push(filter);
  }
  if (search) {
    clauses.push("c.name LIKE ?");
    params.push(search);
  }

  const subscriptions = await query(
    `
      SELECT
        sub.*,
        c.name AS company_name,
        c.email AS company_email,
        c.status AS company_status,
        p.name AS plan_name,
        p.price AS plan_price
      FROM subscriptions sub
      INNER JOIN companies c ON c.id = sub.company_id
      LEFT JOIN plans p ON p.id = sub.plan_id
      ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
      ORDER BY sub.created_at DESC
    `,
    params,
  );

  const payments = await query(`
    SELECT
      ph.*,
      c.name AS company_name
    FROM payment_history ph
    INNER JOIN companies c ON c.id = ph.company_id
    ORDER BY ph.due_date DESC
    LIMIT 100
  `);

  const summary = await queryOne(`
    SELECT
      SUM(CASE WHEN status IN ('active', 'trial') THEN amount ELSE 0 END) AS recurring_revenue,
      SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS overdue_payments,
      SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_payments
    FROM payment_history
  `);

  res.json({ subscriptions, payments, summary });
}));

app.get("/api/client/dashboard", requireAuth, requireRoles(["company_admin", "company_staff", "master_admin"]), asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const store = await getCompanyStore(companyId);
  if (!store) {
    return res.json({ store: null, stats: { products: 0, orders: 0, customers: 0, categories: 0 } });
  }

  const counts = await query(
    `
      SELECT
        (SELECT COUNT(*) FROM products WHERE store_id = ?) AS products,
        (SELECT COUNT(*) FROM orders WHERE store_id = ?) AS orders,
        (SELECT COUNT(*) FROM customers WHERE store_id = ?) AS customers,
        (SELECT COUNT(*) FROM categories WHERE store_id = ?) AS categories
    `,
    [store.id, store.id, store.id, store.id],
  );

  res.json({ store, stats: counts[0] });
}));

function registerCollectionRoutes({ path, table, entityType, softDelete = false }) {
  app.get(`/api/client/${path}`, requireAuth, requireRoles(["company_admin", "company_staff", "master_admin"]), asyncHandler(async (req, res) => {
    const store = await getCompanyStore(req.user.companyId);
    if (!store) return res.json({ items: [] });
    const items = await query(`SELECT * FROM ${table} WHERE store_id = ? ORDER BY created_at DESC`, [store.id]);
    res.json({ items });
  }));

  app.post(`/api/client/${path}`, requireAuth, requireRoles(["company_admin", "company_staff", "master_admin"]), asyncHandler(async (req, res) => {
    const store = await getCompanyStore(req.user.companyId);
    if (!store) return res.status(400).json({ message: "Loja nao encontrada." });

    const payload = { ...req.body };
    const id = generateId();
    const fields = Object.keys(payload);

    await withTransaction(async (connection) => {
      await connection.query(
        `INSERT INTO ${table} (id, store_id, ${fields.join(", ")}, created_at, updated_at) VALUES (?, ?, ${fields.map(() => "?").join(", ")}, NOW(), NOW())`,
        [id, store.id, ...fields.map((field) => payload[field])],
      );
      await logActivity(connection, {
        userId: req.user.id,
        companyId: req.user.companyId,
        action: `create_${entityType}`,
        entityType,
        entityId: id,
        details: payload,
        ipAddress: req.ip,
      });
    });

    res.status(201).json({ ok: true, id });
  }));

  app.put(`/api/client/${path}/:id`, requireAuth, requireRoles(["company_admin", "company_staff", "master_admin"]), asyncHandler(async (req, res) => {
    const item = await queryOne(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [req.params.id]);
    if (!item) return res.status(404).json({ message: "Registro nao encontrado." });
    const allowed = await ensureStoreAccess(req.user, item.store_id);
    if (!allowed) return res.status(403).json({ message: "Sem acesso a este registro." });

    const payload = { ...req.body };
    const fields = Object.keys(payload);

    await withTransaction(async (connection) => {
      await connection.query(
        `UPDATE ${table} SET ${fields.map((field) => `${field} = ?`).join(", ")}, updated_at = NOW() WHERE id = ?`,
        [...fields.map((field) => payload[field]), req.params.id],
      );
      await logActivity(connection, {
        userId: req.user.id,
        companyId: req.user.companyId,
        action: `update_${entityType}`,
        entityType,
        entityId: req.params.id,
        details: payload,
        ipAddress: req.ip,
      });
      await trackChange(connection, {
        userId: req.user.id,
        companyId: req.user.companyId,
        entityType,
        entityId: req.params.id,
        action: "update",
        beforeData: item,
        afterData: payload,
      });
    });

    res.json({ ok: true });
  }));

  if (softDelete) {
    app.delete(`/api/client/${path}/:id`, requireAuth, requireRoles(["company_admin", "company_staff", "master_admin"]), asyncHandler(async (req, res) => {
      const item = await queryOne(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [req.params.id]);
      if (!item) return res.status(404).json({ message: "Registro nao encontrado." });
      const allowed = await ensureStoreAccess(req.user, item.store_id);
      if (!allowed) return res.status(403).json({ message: "Sem acesso a este registro." });

      await withTransaction(async (connection) => {
        await connection.query(`UPDATE ${table} SET is_active = 0, updated_at = NOW() WHERE id = ?`, [req.params.id]);
        await logActivity(connection, {
          userId: req.user.id,
          companyId: req.user.companyId,
          action: `deactivate_${entityType}`,
          entityType,
          entityId: req.params.id,
          ipAddress: req.ip,
        });
      });

      res.json({ ok: true });
    }));
  }
}

registerCollectionRoutes({ path: "categories", table: "categories", entityType: "category" });
registerCollectionRoutes({ path: "products", table: "products", entityType: "product", softDelete: true });
registerCollectionRoutes({ path: "coupons", table: "coupons", entityType: "coupon" });
registerCollectionRoutes({ path: "banners", table: "banners", entityType: "banner" });

app.get("/api/client/customers", requireAuth, requireRoles(["company_admin", "company_staff", "master_admin"]), asyncHandler(async (req, res) => {
  const store = await getCompanyStore(req.user.companyId);
  if (!store) return res.json({ customers: [] });
  const customers = await query("SELECT * FROM customers WHERE store_id = ? ORDER BY created_at DESC", [store.id]);
  res.json({ customers });
}));

app.get("/api/client/orders", requireAuth, requireRoles(["company_admin", "company_staff", "master_admin"]), asyncHandler(async (req, res) => {
  const store = await getCompanyStore(req.user.companyId);
  if (!store) return res.json({ orders: [] });

  const orders = await query(
    `
      SELECT
        o.*,
        c.name AS customer_name,
        c.email AS customer_email
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      WHERE o.store_id = ?
      ORDER BY o.created_at DESC
    `,
    [store.id],
  );
  res.json({ orders });
}));

app.get("/api/client/orders/:orderId", requireAuth, requireRoles(["company_admin", "company_staff", "master_admin"]), asyncHandler(async (req, res) => {
  const store = await getCompanyStore(req.user.companyId);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });

  const order = await queryOne(
    `
      SELECT
        o.*,
        c.name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        d.id AS delivery_id,
        d.provider AS delivery_provider,
        d.status AS delivery_status,
        d.method_name,
        d.tracking_code,
        d.tracking_url
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      LEFT JOIN deliveries d ON d.order_id = o.id
      WHERE o.id = ? AND o.store_id = ?
      LIMIT 1
    `,
    [req.params.orderId, store.id],
  );

  if (!order) return res.status(404).json({ message: "Pedido nao encontrado." });

  const [items, history, payments] = await Promise.all([
    query("SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC", [order.id]),
    query("SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at DESC", [order.id]),
    query("SELECT * FROM payment_transactions WHERE order_id = ? ORDER BY created_at DESC", [order.id]),
  ]);

  res.json({ order, items, history, payments });
}));

app.post("/api/client/orders/:orderId/retry-payment", requireAuth, requireRoles(["company_admin", "company_staff", "master_admin"]), asyncHandler(async (req, res) => {
  const schema = z.object({
    methodCode: z.string().optional().default("pix"),
  });
  const payload = schema.parse(req.body || {});
  const store = await getCompanyStore(req.user.companyId);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });
  const fullStore = await findStoreOrThrow(store.slug);

  const order = await queryOne("SELECT * FROM orders WHERE id = ? AND store_id = ? LIMIT 1", [req.params.orderId, store.id]);
  if (!order) return res.status(404).json({ message: "Pedido nao encontrado." });
  const payment = await queryOne("SELECT * FROM payments WHERE order_id = ? AND store_id = ? LIMIT 1", [order.id, store.id]);
  if (!payment) return res.status(404).json({ message: "Pagamento nao encontrado." });

  const items = await query(
    `
      SELECT oi.*, p.id AS product_db_id, p.name
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
      ORDER BY oi.created_at ASC
    `,
    [order.id],
  );

  const providerResolution = await resolvePaymentProvider({ store: fullStore, selectedMethodCode: payload.methodCode });
  const checkoutSession = await providerResolution.provider.createCheckoutSession({
    order: { id: order.id, orderNumber: order.order_number },
    items: items.map((item) => ({
      product: { id: item.product_id || item.product_db_id || item.id, name: item.product_name || item.name },
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
    })),
    payer: {
      name: order.customer_name || "Cliente",
      email: "checkout@retry.local",
    },
    selectedMethodCode: payload.methodCode,
  });

  await withTransaction(async (connection) => {
    await connection.query("UPDATE payments SET gateway_reference = ?, method = ?, status = 'pending', updated_at = NOW() WHERE id = ?", [checkoutSession.externalId || null, providerResolution.provider.name, payment.id]);
    await connection.query(
      `
        INSERT INTO payment_transactions (id, payment_id, order_id, store_id, provider, transaction_type, external_id, external_reference, status, amount, payload, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'retry_checkout_session', ?, ?, 'pending', ?, ?, NOW(), NOW())
      `,
      [generateId(), payment.id, order.id, store.id, providerResolution.provider.name, checkoutSession.externalId || null, order.id, Number(payment.amount), JSON.stringify(checkoutSession.raw || {})],
    );
    await logPaymentProviderEvent(connection, {
      storeId: store.id,
      provider: providerResolution.provider.name,
      status: "success",
      summary: "Reprocessamento de checkout executado.",
      payload: { orderId: order.id, externalId: checkoutSession.externalId },
    });
  });

  res.json({
    ok: true,
    paymentProvider: providerResolution.provider.name,
    paymentRedirectUrl: checkoutSession.checkoutUrl,
  });
}));

app.patch("/api/client/orders/:orderId/status", requireAuth, requireRoles(["company_admin", "company_staff", "master_admin"]), asyncHandler(async (req, res) => {
  const schema = z.object({ status: z.enum(orderStatusEnum) });
  const { status } = schema.parse(req.body);
  const order = await queryOne("SELECT * FROM orders WHERE id = ? LIMIT 1", [req.params.orderId]);
  if (!order) return res.status(404).json({ message: "Pedido nao encontrado." });
  const allowed = await ensureStoreAccess(req.user, order.store_id);
  if (!allowed) return res.status(403).json({ message: "Sem acesso a este pedido." });

  await withTransaction(async (connection) => {
    await connection.query("UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?", [status, req.params.orderId]);
    await logActivity(connection, {
      userId: req.user.id,
      companyId: req.user.companyId,
      action: "update_order_status",
      entityType: "order",
      entityId: req.params.orderId,
      details: { status },
      ipAddress: req.ip,
    });
  });

  res.json({ ok: true });
}));

app.get("/api/client/deliveries", requireAuth, requireRoles(["company_admin", "company_staff", "master_admin"]), asyncHandler(async (req, res) => {
  const store = await getCompanyStore(req.user.companyId);
  if (!store) return res.json({ deliveries: [] });

  const deliveries = await query(
    `
      SELECT
        d.*,
        o.order_number,
        o.total,
        o.status AS order_status,
        o.payment_status,
        c.name AS customer_name
      FROM deliveries d
      INNER JOIN orders o ON o.id = d.order_id
      LEFT JOIN customers c ON c.id = o.customer_id
      WHERE d.store_id = ?
      ORDER BY d.updated_at DESC
    `,
    [store.id],
  );

  res.json({ deliveries });
}));

app.patch("/api/client/deliveries/:deliveryId", requireAuth, requireRoles(["company_admin", "company_staff", "master_admin"]), asyncHandler(async (req, res) => {
  const schema = z.object({
    status: z.string().optional(),
    tracking_code: z.string().optional().nullable(),
    tracking_url: z.string().optional().nullable(),
  });
  const payload = schema.parse(req.body);
  const store = await getCompanyStore(req.user.companyId);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });

  const delivery = await queryOne("SELECT id, order_id, status FROM deliveries WHERE id = ? AND store_id = ? LIMIT 1", [req.params.deliveryId, store.id]);
  if (!delivery) return res.status(404).json({ message: "Entrega nao encontrada." });

  const nextStatus = normalizeDeliveryStatus(payload.status || delivery.status);

  await withTransaction(async (connection) => {
    await connection.query(
      `
        UPDATE deliveries
        SET status = ?, tracking_code = ?, tracking_url = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [nextStatus, payload.tracking_code || null, payload.tracking_url || null, delivery.id],
    );
    await appendOrderStatusHistory(connection, {
      orderId: delivery.order_id,
      note: `Entrega atualizada para ${nextStatus}.`,
      createdByType: "admin",
      userId: req.user.id,
    });
    await logActivity(connection, {
      userId: req.user.id,
      companyId: req.user.companyId,
      action: "update_delivery",
      entityType: "delivery",
      entityId: delivery.id,
      details: payload,
      ipAddress: req.ip,
    });
  });

  res.json({ ok: true });
}));

app.get("/api/client/integrations/logs", requireAuth, requireRoles(["company_admin", "company_staff", "master_admin"]), asyncHandler(async (req, res) => {
  const store = await getCompanyStore(req.user.companyId);
  if (!store) return res.json({ logs: [], webhooks: [] });

  const provider = req.query.provider ? String(req.query.provider) : null;
  const logParams = provider ? [store.id, provider] : [store.id];
  const webhookParams = provider ? [store.id, provider] : [store.id];

  const [logs, webhooks] = await Promise.all([
    query(
      `
        SELECT *
        FROM integration_logs
        WHERE store_id = ? ${provider ? "AND provider = ?" : ""}
        ORDER BY created_at DESC
        LIMIT 100
      `,
      logParams,
    ),
    query(
      `
        SELECT *
        FROM webhook_events
        WHERE store_id = ? ${provider ? "AND provider = ?" : ""}
        ORDER BY created_at DESC
        LIMIT 100
      `,
      webhookParams,
    ),
  ]);

  res.json({ logs, webhooks });
}));

app.get("/api/client/integrations/diagnostics", requireAuth, requireRoles(["company_admin", "company_staff", "master_admin"]), asyncHandler(async (req, res) => {
  const store = await getCompanyStore(req.user.companyId);
  if (!store) return res.json({ payment: null, shipping: null });

  const [paymentDiagnostics, shippingTest] = await Promise.all([
    getPaymentDiagnostics(store.id),
    queryOne(
      `
        SELECT *
        FROM integration_test_runs
        WHERE store_id = ? AND integration_type = 'shipping'
        ORDER BY started_at DESC
        LIMIT 1
      `,
      [store.id],
    ),
  ]);

  res.json({
    payment: paymentDiagnostics,
    shipping: {
      lastTest: shippingTest,
    },
  });
}));

app.get("/api/client/settings", requireAuth, requireRoles(["company_admin", "company_staff", "master_admin"]), asyncHandler(async (req, res) => {
  const store = await getCompanyStore(req.user.companyId);
  if (!store) return res.json({ settings: null });
  const [settings, integrations] = await Promise.all([
    queryOne("SELECT * FROM store_settings WHERE store_id = ? LIMIT 1", [store.id]),
    listStoreIntegrations(store.id),
  ]);

  const mercadoPago = integrations.find((item) => item.provider === "mercado_pago");
  const melhorEnvio = integrations.find((item) => item.provider === "melhor_envio");

  res.json({
    store: {
      ...store,
      theme_colors: parseJsonField(store.theme_colors, {}),
    },
    settings: settings ? {
      ...settings,
      checkout_settings: parseJsonField(settings.checkout_settings, {}),
      shipping_settings: parseJsonField(settings.shipping_settings, {}),
      payment_methods: parseJsonField(settings.payment_methods, []),
      seo_settings: parseJsonField(settings.seo_settings, {}),
      policies: parseJsonField(settings.policies, {}),
      social_links: parseJsonField(settings.social_links, {}),
      institutional_texts: parseJsonField(settings.institutional_texts, {}),
      visual_settings: parseJsonField(settings.visual_settings, {}),
      home_settings: parseJsonField(settings.home_settings, {}),
      campaign_settings: parseJsonField(settings.campaign_settings, {}),
      footer_settings: parseJsonField(settings.footer_settings, {}),
      trust_badges: parseJsonField(settings.trust_badges, []),
      featured_brands: parseJsonField(settings.featured_brands, []),
    } : null,
    integrations: {
      mercado_pago: mercadoPago ? {
        enabled: Boolean(mercadoPago.is_enabled),
        mode: mercadoPago.mode,
        publicKey: mercadoPago.credentials?.publicKey || "",
        accessToken: mercadoPago.credentials?.accessToken || "",
        webhookToken: mercadoPago.public_config?.webhookToken || "",
      } : null,
      melhor_envio: melhorEnvio ? {
        enabled: Boolean(melhorEnvio.is_enabled),
        mode: melhorEnvio.mode,
        accessToken: melhorEnvio.credentials?.accessToken || "",
        clientId: melhorEnvio.credentials?.clientId || "",
        clientSecret: melhorEnvio.credentials?.clientSecret || "",
        webhookToken: melhorEnvio.public_config?.webhookToken || "",
      } : null,
    },
  });
}));

app.put("/api/client/settings", requireAuth, requireRoles(["company_admin", "master_admin"]), asyncHandler(async (req, res) => {
  const schema = z.object({
    store: z.object({
      name: z.string().min(2),
      slug: z.string().min(2),
      domain: z.string().optional().default(""),
      logo_url: z.string().optional().default(""),
      favicon_url: z.string().optional().default(""),
      theme_colors: z.any().optional(),
    }),
    settings: z.object({
      checkout_settings: z.any(),
      shipping_settings: z.any(),
      payment_methods: z.any(),
      seo_settings: z.any(),
      policies: z.any(),
      social_links: z.any(),
      institutional_texts: z.any(),
      visual_settings: z.any().optional(),
      home_settings: z.any().optional(),
      campaign_settings: z.any().optional(),
      footer_settings: z.any().optional(),
      trust_badges: z.any().optional(),
      featured_brands: z.any().optional(),
    }),
    integrations: z.object({
      mercado_pago: z.object({
        enabled: z.boolean().optional().default(false),
        mode: z.enum(["sandbox", "production"]).optional().default("production"),
        publicKey: z.string().optional().default(""),
        accessToken: z.string().optional().default(""),
        webhookToken: z.string().optional().default(""),
      }).optional(),
      melhor_envio: z.object({
        enabled: z.boolean().optional().default(false),
        mode: z.enum(["sandbox", "production"]).optional().default("sandbox"),
        accessToken: z.string().optional().default(""),
        clientId: z.string().optional().default(""),
        clientSecret: z.string().optional().default(""),
        webhookToken: z.string().optional().default(""),
      }).optional(),
    }).optional(),
  });
  const payload = schema.parse(req.body);
  const store = await getCompanyStore(req.user.companyId);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });

  await withTransaction(async (connection) => {
    const storePayload = buildStorePayload(payload.store);
    await connection.query(
      `
        UPDATE stores
        SET name = ?, slug = ?, domain = ?, logo_url = ?, favicon_url = ?, theme_colors = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [storePayload.name, storePayload.slug, storePayload.domain, storePayload.logo_url, storePayload.favicon_url, storePayload.theme_colors, store.id],
    );
    await connection.query(
      `
        UPDATE store_settings
        SET checkout_settings = ?, shipping_settings = ?, payment_methods = ?, seo_settings = ?, policies = ?, social_links = ?, institutional_texts = ?, visual_settings = ?, home_settings = ?, campaign_settings = ?, footer_settings = ?, trust_badges = ?, featured_brands = ?, updated_at = NOW()
        WHERE store_id = ?
      `,
      [
        JSON.stringify(payload.settings.checkout_settings || {}),
        JSON.stringify(payload.settings.shipping_settings || {}),
        JSON.stringify(payload.settings.payment_methods || []),
        JSON.stringify(payload.settings.seo_settings || {}),
        JSON.stringify(payload.settings.policies || {}),
        JSON.stringify(payload.settings.social_links || {}),
        JSON.stringify(payload.settings.institutional_texts || {}),
        JSON.stringify(payload.settings.visual_settings || {}),
        JSON.stringify(payload.settings.home_settings || {}),
        JSON.stringify(payload.settings.campaign_settings || {}),
        JSON.stringify(payload.settings.footer_settings || {}),
        JSON.stringify(payload.settings.trust_badges || []),
        JSON.stringify(payload.settings.featured_brands || []),
        store.id,
      ],
    );

    if (payload.integrations?.mercado_pago) {
      await upsertStoreIntegration(connection, {
        storeId: store.id,
        provider: "mercado_pago",
        mode: payload.integrations.mercado_pago.mode,
        isEnabled: payload.integrations.mercado_pago.enabled,
        credentials: {
          publicKey: payload.integrations.mercado_pago.publicKey,
          accessToken: payload.integrations.mercado_pago.accessToken,
        },
        publicConfig: {
          webhookToken: payload.integrations.mercado_pago.webhookToken || generateId(),
        },
      });
    }

    if (payload.integrations?.melhor_envio) {
      await upsertStoreIntegration(connection, {
        storeId: store.id,
        provider: "melhor_envio",
        mode: payload.integrations.melhor_envio.mode,
        isEnabled: payload.integrations.melhor_envio.enabled,
        credentials: {
          accessToken: payload.integrations.melhor_envio.accessToken,
          clientId: payload.integrations.melhor_envio.clientId,
          clientSecret: payload.integrations.melhor_envio.clientSecret,
        },
        publicConfig: {
          webhookToken: payload.integrations.melhor_envio.webhookToken || generateId(),
        },
      });
    }

    await logActivity(connection, {
      userId: req.user.id,
      companyId: req.user.companyId,
      action: "update_store_settings",
      entityType: "store",
      entityId: store.id,
      details: payload,
      ipAddress: req.ip,
    });
  });

  res.json({ ok: true });
}));

app.post("/api/client/settings/test-payment", requireAuth, requireRoles(["company_admin", "master_admin"]), asyncHandler(async (req, res) => {
  const store = await getCompanyStore(req.user.companyId);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });
  const schema = z.object({
    methodCode: z.string().optional().default("pix"),
    scenario: z.enum(["connection", "checkout_creation"]).optional().default("connection"),
  });
  const payload = schema.parse(req.body || {});
  const providerResolution = await resolvePaymentProvider({ store: await findStoreOrThrow(store.slug), selectedMethodCode: payload.methodCode });
  const provider = providerResolution.provider;
  const testRunId = generateId();

  await withTransaction(async (connection) => {
    await persistIntegrationTestRun(connection, {
      testRunId,
      storeId: store.id,
      provider: provider.name,
      integrationType: "payment",
      scenario: payload.scenario,
      status: "running",
      requestPayload: payload,
      createdByUserId: req.user.id,
    });
  });

  try {
    const result = payload.scenario === "checkout_creation"
      ? await provider.runSandboxCheckoutTest({ store, userId: req.user.id })
      : await provider.testConnection();

    await withTransaction(async (connection) => {
      await persistIntegrationTestRun(connection, {
        testRunId,
        storeId: store.id,
        provider: provider.name,
        integrationType: "payment",
        scenario: payload.scenario,
        status: "passed",
        requestPayload: payload,
        responsePayload: result,
        createdByUserId: req.user.id,
      });
      await logPaymentProviderEvent(connection, {
        storeId: store.id,
        provider: provider.name,
        status: "success",
        summary: `Teste de pagamento executado: ${payload.scenario}.`,
        payload: result,
      });
    });

    res.json({
      ok: true,
      provider: provider.name,
      strategy: providerResolution.strategy,
      result,
      estimatedCostPreview: calculatePaymentCostBreakdown({
        amount: 100,
        store: await findStoreOrThrow(store.slug),
        providerName: provider.name,
        selectedMethodCode: payload.methodCode,
      }),
    });
  } catch (error) {
    await withTransaction(async (connection) => {
      await persistIntegrationTestRun(connection, {
        testRunId,
        storeId: store.id,
        provider: provider.name,
        integrationType: "payment",
        scenario: payload.scenario,
        status: "failed",
        requestPayload: payload,
        responsePayload: { message: error.message },
        errorMessage: error.message,
        createdByUserId: req.user.id,
      });
      await logPaymentProviderEvent(connection, {
        storeId: store.id,
        provider: provider.name,
        status: "error",
        summary: `Falha no teste de pagamento: ${payload.scenario}.`,
        payload: { message: error.message },
      });
    });

    res.status(400).json({ message: error.message });
  }
}));

app.post("/api/client/settings/test-shipping", requireAuth, requireRoles(["company_admin", "master_admin"]), asyncHandler(async (req, res) => {
  const schema = z.object({
    cep: z.string().min(8),
    productIds: z.array(z.string()).optional().default([]),
    scenario: z.enum(["cep_lookup", "quote"]).optional().default("cep_lookup"),
  });
  const payload = schema.parse(req.body);
  const store = await getCompanyStore(req.user.companyId);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });
  const fullStore = await findStoreOrThrow(store.slug);
  const testRunId = generateId();

  await withTransaction(async (connection) => {
    await persistIntegrationTestRun(connection, {
      testRunId,
      storeId: store.id,
      provider: payload.scenario === "quote" ? "shipping_strategy" : "viacep",
      integrationType: "shipping",
      scenario: payload.scenario,
      status: "running",
      requestPayload: payload,
      createdByUserId: req.user.id,
    });
  });

  try {
    let result;
    if (payload.scenario === "quote") {
      const products = payload.productIds.length
        ? await query(
          `SELECT * FROM products WHERE store_id = ? AND id IN (${payload.productIds.map(() => "?").join(",")})`,
          [store.id, ...payload.productIds],
        )
        : await query("SELECT * FROM products WHERE store_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1", [store.id]);

      if (!products.length) {
        throw new Error("Nenhum produto disponivel para teste de frete.");
      }

      result = await quoteShippingForStore({
        store: fullStore,
        destinationZip: payload.cep,
        products: [{
          product: products[0],
          quantity: 1,
          unitPrice: Number(products[0].sale_price ?? products[0].price),
        }],
      });
    } else {
      result = { address: await resolveCep(payload.cep) };
    }

    await withTransaction(async (connection) => {
      await persistIntegrationTestRun(connection, {
        testRunId,
        storeId: store.id,
        provider: payload.scenario === "quote" ? "shipping_strategy" : "viacep",
        integrationType: "shipping",
        scenario: payload.scenario,
        status: "passed",
        requestPayload: payload,
        responsePayload: result,
        createdByUserId: req.user.id,
      });
      await logIntegration(connection, {
        storeId: store.id,
        provider: payload.scenario === "quote" ? "shipping_strategy" : "viacep",
        direction: "outbound",
        status: "success",
        summary: `Teste de frete executado: ${payload.scenario}.`,
        payload: result,
      });
    });

    res.json({ ok: true, result });
  } catch (error) {
    await withTransaction(async (connection) => {
      await persistIntegrationTestRun(connection, {
        testRunId,
        storeId: store.id,
        provider: payload.scenario === "quote" ? "shipping_strategy" : "viacep",
        integrationType: "shipping",
        scenario: payload.scenario,
        status: "failed",
        requestPayload: payload,
        responsePayload: { message: error.message },
        errorMessage: error.message,
        createdByUserId: req.user.id,
      });
      await logIntegration(connection, {
        storeId: store.id,
        provider: payload.scenario === "quote" ? "shipping_strategy" : "viacep",
        direction: "outbound",
        status: "error",
        summary: `Falha no teste de frete: ${payload.scenario}.`,
        payload: { message: error.message },
      });
    });
    res.status(400).json({ message: error.message });
  }
}));

app.get("/api/client/team", requireAuth, requireRoles(["company_admin", "master_admin"]), asyncHandler(async (req, res) => {
  const users = await query(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.is_active,
      u.created_at,
      GROUP_CONCAT(ur.role) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    WHERE u.company_id = ?
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `, [req.user.companyId]);

  res.json({
    users: users.map((user) => ({
      ...user,
      roles: user.roles ? String(user.roles).split(",") : [],
    })),
  });
}));

app.post("/api/client/team", requireAuth, requireRoles(["company_admin", "master_admin"]), asyncHandler(async (req, res) => {
  const schema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["company_admin", "company_staff"]),
  });
  const payload = schema.parse(req.body);
  const userId = generateId();
  const passwordHash = await bcrypt.hash(payload.password, 10);

  await withTransaction(async (connection) => {
    await connection.query(
      `
        INSERT INTO users (id, company_id, full_name, email, password_hash, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
      `,
      [userId, req.user.companyId, payload.fullName, payload.email.toLowerCase(), passwordHash],
    );
    await connection.query("INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, NOW())", [generateId(), userId, payload.role]);
    await logActivity(connection, {
      userId: req.user.id,
      companyId: req.user.companyId,
      action: "create_company_user",
      entityType: "user",
      entityId: userId,
      details: payload,
      ipAddress: req.ip,
    });
  });

  res.status(201).json({ ok: true, id: userId });
}));

app.get("/api/public/stores/:slug/catalog", asyncHandler(async (req, res) => {
  const store = await findStoreOrThrow(req.params.slug);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });

  const [categories, products, banners] = await Promise.all([
    query("SELECT * FROM categories WHERE store_id = ? AND is_active = 1 ORDER BY sort_order ASC", [store.id]),
    query("SELECT * FROM products WHERE store_id = ? AND is_active = 1 ORDER BY created_at DESC", [store.id]),
    query("SELECT * FROM banners WHERE store_id = ? AND is_active = 1 ORDER BY sort_order ASC", [store.id]),
  ]);

  res.json({
    store: {
      id: store.id,
      name: store.name,
      slug: store.slug,
      domain: store.domain,
      logo_url: store.logo_url,
      favicon_url: store.favicon_url,
      theme_colors: store.theme_colors,
    },
    settings: {
      seo_settings: store.settings?.seo_settings || {},
      policies: store.settings?.policies || {},
      social_links: store.settings?.social_links || {},
      institutional_texts: store.settings?.institutional_texts || {},
      visual_settings: store.settings?.visual_settings || {},
      home_settings: store.settings?.home_settings || {},
      campaign_settings: store.settings?.campaign_settings || {},
      footer_settings: store.settings?.footer_settings || {},
      trust_badges: store.settings?.trust_badges || [],
      featured_brands: store.settings?.featured_brands || [],
      checkout_settings: store.settings?.checkout_settings || {},
      payment_methods: publicPaymentMethods(store.settings),
      shipping_settings: store.settings?.shipping_settings || {},
    },
    categories,
    products: products.map((product) => ({
      ...product,
      images: parseJsonField(product.images, []),
      dimensions: parseJsonField(product.dimensions, {}),
    })),
    banners,
  });
}));

app.post("/api/public/stores/:slug/auth/register", asyncHandler(async (req, res) => {
  const schema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().optional().default(""),
    document: z.string().optional().default(""),
  });
  const payload = schema.parse(req.body);
  const store = await findStoreOrThrow(req.params.slug);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });

  const existing = await queryOne(
    "SELECT id FROM customer_accounts WHERE store_id = ? AND email = ? LIMIT 1",
    [store.id, sanitizeEmail(payload.email)],
  );
  if (existing) return res.status(409).json({ message: "Ja existe uma conta para este email nesta loja." });

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const accountId = generateId();
  const customerId = generateId();
  const sessionId = uuid();

  await withTransaction(async (connection) => {
    await connection.query(
      `
        INSERT INTO customers (id, store_id, name, email, phone, document, addresses, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [customerId, store.id, payload.fullName, sanitizeEmail(payload.email), payload.phone || null, payload.document || null, JSON.stringify([])],
    );
    await connection.query(
      `
        INSERT INTO customer_accounts (id, store_id, customer_id, full_name, email, password_hash, phone, document, is_active, last_login_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW(), NOW())
      `,
      [accountId, store.id, customerId, payload.fullName, sanitizeEmail(payload.email), passwordHash, payload.phone || null, payload.document || null],
    );
    await connection.query(
      `
        INSERT INTO customer_sessions (id, customer_account_id, store_id, ip_address, user_agent, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY))
      `,
      [sessionId, accountId, store.id, req.ip, req.headers["user-agent"] ?? null],
    );
  });

  setCustomerSessionCookie(res, signCustomerSession({ sessionId, customerAccountId: accountId }));
  const customer = await getCustomerContextById(accountId);
  res.status(201).json({ ok: true, customer });
}));

app.post("/api/public/stores/:slug/auth/login", asyncHandler(async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    sessionToken: z.string().optional(),
  });
  const payload = schema.parse(req.body);
  const store = await findStoreOrThrow(req.params.slug);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });

  const account = await queryOne(
    "SELECT id, password_hash, is_active FROM customer_accounts WHERE store_id = ? AND email = ? LIMIT 1",
    [store.id, sanitizeEmail(payload.email)],
  );
  if (!account || !account.is_active) {
    return res.status(401).json({ message: "Credenciais invalidas." });
  }

  const isValid = await bcrypt.compare(payload.password, account.password_hash);
  if (!isValid) {
    return res.status(401).json({ message: "Credenciais invalidas." });
  }

  const sessionId = uuid();
  await withTransaction(async (connection) => {
    await connection.query(
      `
        INSERT INTO customer_sessions (id, customer_account_id, store_id, ip_address, user_agent, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY))
      `,
      [sessionId, account.id, store.id, req.ip, req.headers["user-agent"] ?? null],
    );
    await connection.query("UPDATE customer_accounts SET last_login_at = NOW() WHERE id = ?", [account.id]);
    if (payload.sessionToken) {
      const cart = await getOrCreateStorefrontCart(connection, {
        storeId: store.id,
        sessionToken: payload.sessionToken,
        customerAccountId: account.id,
      });
      await connection.query("UPDATE storefront_carts SET customer_account_id = ?, updated_at = NOW() WHERE id = ?", [account.id, cart.id]);
    }
  });

  setCustomerSessionCookie(res, signCustomerSession({ sessionId, customerAccountId: account.id }));
  const customer = await getCustomerContextById(account.id);
  res.json({ ok: true, customer });
}));

app.post("/api/public/stores/:slug/auth/logout", asyncHandler(async (req, res) => {
  const token = req.cookies?.vexor_customer_session;
  if (token) {
    try {
      const payload = verifyCustomerSession(token);
      await query("UPDATE customer_sessions SET revoked_at = NOW() WHERE id = ?", [payload.sessionId]);
    } catch {}
  }

  clearCustomerSessionCookie(res);
  res.json({ ok: true });
}));

app.get("/api/public/stores/:slug/auth/me", asyncHandler(async (req, res) => {
  const store = await findStoreOrThrow(req.params.slug);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });

  const token = req.cookies?.vexor_customer_session;
  if (!token) return res.json({ customer: null, addresses: [] });

  try {
    const payload = verifyCustomerSession(token);
    const customer = await getCustomerContextById(payload.customerAccountId);
    if (!customer || customer.storeId !== store.id || !customer.isActive) {
      clearCustomerSessionCookie(res);
      return res.json({ customer: null, addresses: [] });
    }

    const addresses = await query(
      "SELECT * FROM customer_addresses WHERE customer_account_id = ? ORDER BY is_default DESC, created_at DESC",
      [customer.id],
    );
    return res.json({ customer, addresses });
  } catch {
    clearCustomerSessionCookie(res);
    return res.json({ customer: null, addresses: [] });
  }
}));

app.post("/api/public/stores/:slug/auth/forgot-password", asyncHandler(async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const { email } = schema.parse(req.body);
  const store = await findStoreOrThrow(req.params.slug);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });

  const account = await queryOne(
    "SELECT id FROM customer_accounts WHERE store_id = ? AND email = ? LIMIT 1",
    [store.id, sanitizeEmail(email)],
  );

  let resetToken = null;
  if (account) {
    resetToken = uuid();
    await query(
      `
        INSERT INTO customer_password_reset_tokens (id, customer_account_id, token, expires_at, created_at)
        VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE), NOW())
      `,
      [generateId(), account.id, resetToken],
    );
  }

  res.json({
    ok: true,
    message: "Se a conta existir, o token foi gerado.",
    resetToken,
    resetUrl: resetToken ? `${process.env.FRONTEND_URL || "http://127.0.0.1:8080"}/shop/${store.slug}/auth?mode=reset&token=${resetToken}` : null,
  });
}));

app.post("/api/public/stores/:slug/auth/reset-password", asyncHandler(async (req, res) => {
  const schema = z.object({
    token: z.string().min(10),
    password: z.string().min(6),
  });
  const payload = schema.parse(req.body);
  const store = await findStoreOrThrow(req.params.slug);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });

  const resetToken = await queryOne(
    `
      SELECT cprt.id, cprt.customer_account_id
      FROM customer_password_reset_tokens cprt
      INNER JOIN customer_accounts ca ON ca.id = cprt.customer_account_id
      WHERE cprt.token = ? AND cprt.used_at IS NULL AND cprt.expires_at > NOW() AND ca.store_id = ?
      LIMIT 1
    `,
    [payload.token, store.id],
  );
  if (!resetToken) return res.status(400).json({ message: "Token invalido ou expirado." });

  const passwordHash = await bcrypt.hash(payload.password, 10);
  await withTransaction(async (connection) => {
    await connection.query("UPDATE customer_accounts SET password_hash = ?, updated_at = NOW() WHERE id = ?", [passwordHash, resetToken.customer_account_id]);
    await connection.query("UPDATE customer_password_reset_tokens SET used_at = NOW() WHERE id = ?", [resetToken.id]);
    await connection.query("UPDATE customer_sessions SET revoked_at = NOW() WHERE customer_account_id = ? AND revoked_at IS NULL", [resetToken.customer_account_id]);
  });

  res.json({ ok: true });
}));

app.get("/api/public/stores/:slug/cart", asyncHandler(async (req, res) => {
  const store = await findStoreOrThrow(req.params.slug);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });
  const sessionToken = String(req.query.sessionToken || "");
  if (!sessionToken) return res.json({ cart: null, items: [], subtotal: 0 });

  const data = await loadCart(store.id, sessionToken);
  res.json(data);
}));

app.delete("/api/public/stores/:slug/cart", asyncHandler(async (req, res) => {
  const store = await findStoreOrThrow(req.params.slug);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });
  const sessionToken = String(req.query.sessionToken || "");
  if (!sessionToken) return res.json({ ok: true });

  await query("DELETE FROM storefront_carts WHERE store_id = ? AND session_token = ?", [store.id, sessionToken]);
  res.json({ ok: true });
}));

app.put("/api/public/stores/:slug/cart/items", asyncHandler(async (req, res) => {
  const schema = z.object({
    sessionToken: z.string().min(6),
    productId: z.string(),
    quantity: z.number().int().min(0),
  });
  const payload = schema.parse(req.body);
  const store = await findStoreOrThrow(req.params.slug);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });
  const optionalCustomer = await getOptionalCustomerFromRequest(req, store.id);

  const product = await queryOne(
    "SELECT id, price, sale_price, stock, is_active FROM products WHERE id = ? AND store_id = ? LIMIT 1",
    [payload.productId, store.id],
  );
  if (!product || !product.is_active) {
    return res.status(404).json({ message: "Produto nao encontrado." });
  }
  if (payload.quantity > Number(product.stock)) {
    return res.status(400).json({ message: "Quantidade indisponivel em estoque." });
  }

  await withTransaction(async (connection) => {
    const cart = await getOrCreateStorefrontCart(connection, {
      storeId: store.id,
      sessionToken: payload.sessionToken,
      customerAccountId: optionalCustomer?.id || null,
    });

    if (payload.quantity === 0) {
      await connection.query("DELETE FROM storefront_cart_items WHERE cart_id = ? AND product_id = ?", [cart.id, payload.productId]);
      return;
    }

    const unitPrice = Number(product.sale_price ?? product.price);
    await connection.query(
      `
        INSERT INTO storefront_cart_items (id, cart_id, product_id, quantity, unit_price, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), unit_price = VALUES(unit_price), updated_at = NOW()
      `,
      [generateId(), cart.id, payload.productId, payload.quantity, unitPrice],
    );
  });

  const data = await loadCart(store.id, payload.sessionToken);
  res.json(data);
}));

app.post("/api/public/stores/:slug/shipping/quote", asyncHandler(async (req, res) => {
  const schema = z.object({
    cep: z.string().min(8),
    sessionToken: z.string().optional(),
  });
  const payload = schema.parse(req.body);
  const store = await findStoreOrThrow(req.params.slug);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });
  const optionalCustomer = await getOptionalCustomerFromRequest(req, store.id);

  const cartData = payload.sessionToken ? await loadCart(store.id, payload.sessionToken) : { items: [] };
  if (!cartData.items.length) return res.status(400).json({ message: "Carrinho vazio." });

  const productIds = cartData.items.map((item) => item.product_id);
  const products = await query(
    `SELECT * FROM products WHERE store_id = ? AND id IN (${productIds.map(() => "?").join(",")})`,
    [store.id, ...productIds],
  );
  const productMap = new Map(products.map((product) => [product.id, product]));
  const normalizedItems = cartData.items.map((item) => ({
    product: productMap.get(item.product_id),
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
  }));

  const quotes = await quoteShippingForStore({
    store,
    destinationZip: payload.cep,
    products: normalizedItems,
  });

  const quoteId = generateId();
  await query(
    `
      INSERT INTO shipping_quotes (id, store_id, customer_account_id, session_token, destination_zip_code, subtotal, quote_payload, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE), NOW())
    `,
    [quoteId, store.id, optionalCustomer?.id || null, payload.sessionToken || null, quotes.destination.zipCode, quotes.subtotal, JSON.stringify(quotes.methods)],
  );

  res.json({ quoteId, ...quotes });
}));

app.post("/api/public/stores/:slug/checkout", asyncHandler(async (req, res) => {
  const schema = z.object({
    sessionToken: z.string().min(6),
    customer: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional().default(""),
      document: z.string().optional().default(""),
    }),
    shipping_address: z.object({
      cep: z.string().min(8),
      street: z.string().min(2),
      number: z.string().min(1),
      complement: z.string().optional().default(""),
      district: z.string().min(2),
      city: z.string().min(2),
      state: z.string().min(2),
      reference_note: z.string().optional().default(""),
    }),
    shipping_method_code: z.string().min(2),
    payment_method: z.string().min(2),
    notes: z.string().optional().default(""),
    coupon_code: z.string().optional().default(""),
  });
  const payload = schema.parse(req.body);
  const store = await findStoreOrThrow(req.params.slug);
  if (!store) return res.status(404).json({ message: "Loja nao encontrada." });
  const optionalCustomer = await getOptionalCustomerFromRequest(req, store.id);

  const cartData = await loadCart(store.id, payload.sessionToken);
  if (!cartData.cart || cartData.items.length === 0) {
    return res.status(400).json({ message: "Carrinho vazio." });
  }

  const productIds = cartData.items.map((item) => item.product_id);
  const products = await query(
    `SELECT * FROM products WHERE store_id = ? AND id IN (${productIds.map(() => "?").join(",")})`,
    [store.id, ...productIds],
  );
  const productMap = new Map(products.map((product) => [product.id, product]));
  const normalizedItems = cartData.items.map((item) => ({
    product: productMap.get(item.product_id),
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
  }));

  const cartSummary = summarizeCartProducts(products, cartData.items.map((item) => ({
    product_id: item.product_id,
    quantity: Number(item.quantity),
  })));

  const quotes = await quoteShippingForStore({
    store,
    destinationZip: payload.shipping_address.cep,
    products: normalizedItems,
  });
  const selectedShipping = quotes.methods.find((method) => method.code === payload.shipping_method_code);
  if (!selectedShipping) {
    return res.status(400).json({ message: "Metodo de frete invalido para este CEP." });
  }

  let discount = 0;
  let appliedCoupon = null;
  if (payload.coupon_code) {
    const coupon = await queryOne(
      `
        SELECT *
        FROM coupons
        WHERE store_id = ? AND code = ? AND is_active = 1
          AND (valid_from IS NULL OR valid_from <= NOW())
          AND (valid_until IS NULL OR valid_until >= NOW())
        LIMIT 1
      `,
      [store.id, payload.coupon_code.trim()],
    );

    if (coupon && (!coupon.min_order_value || cartSummary.subtotal >= Number(coupon.min_order_value))) {
      discount = coupon.discount_type === "fixed"
        ? Number(coupon.discount_value)
        : Number((cartSummary.subtotal * Number(coupon.discount_value) / 100).toFixed(2));
      appliedCoupon = coupon;
    }
  }

  const shippingCost = Number(selectedShipping.amount || 0);
  const total = Number((cartSummary.subtotal + shippingCost - discount).toFixed(2));
  const orderId = generateId();
  const paymentId = generateId();
  const deliveryId = generateId();
  const orderNumber = String(Date.now()).slice(-8);
  const customerAccountId = optionalCustomer?.id || null;

  await withTransaction(async (connection) => {
    const customerId = await upsertCustomerProfile(connection, {
      storeId: store.id,
      accountId: customerAccountId,
      customer: payload.customer,
      address: payload.shipping_address,
    });

    if (customerAccountId) {
      const [defaultAddress] = await connection.query("SELECT id FROM customer_addresses WHERE customer_account_id = ? AND is_default = 1 LIMIT 1", [customerAccountId]);
      if (!defaultAddress[0]) {
        await connection.query(
          `
            INSERT INTO customer_addresses (
              id, customer_account_id, label, recipient_name, phone, document, zip_code, street, number, complement, district, city, state, reference_note, is_default, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
          `,
          [
            generateId(),
            customerAccountId,
            "Principal",
            payload.customer.name,
            payload.customer.phone || null,
            payload.customer.document || null,
            payload.shipping_address.cep,
            payload.shipping_address.street,
            payload.shipping_address.number,
            payload.shipping_address.complement || null,
            payload.shipping_address.district,
            payload.shipping_address.city,
            payload.shipping_address.state,
            payload.shipping_address.reference_note || null,
          ],
        );
      }
    }

    await connection.query(
      `
        INSERT INTO orders (
          id, store_id, customer_id, customer_account_id, order_number, status, subtotal, shipping_cost, discount, total, payment_status, payment_method, shipping_address, shipping_info, coupon_code, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        orderId,
        store.id,
        customerId,
        customerAccountId,
        orderNumber,
        cartSummary.subtotal,
        shippingCost,
        discount,
        total,
        payload.payment_method,
        JSON.stringify(payload.shipping_address),
        JSON.stringify(selectedShipping),
        appliedCoupon?.code || null,
        payload.notes || null,
      ],
    );

    for (const item of cartSummary.items) {
      await connection.query(
        `
          INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, total_price, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        [generateId(), orderId, item.product.id, item.product.name, item.quantity, item.unitPrice, Number((item.unitPrice * item.quantity).toFixed(2))],
      );
      await connection.query("UPDATE products SET stock = stock - ?, updated_at = NOW() WHERE id = ?", [item.quantity, item.product.id]);
      await connection.query(
        "INSERT INTO stock_movements (id, store_id, product_id, movement_type, quantity, reason, created_at) VALUES (?, ?, ?, 'out', ?, 'order_checkout', NOW())",
        [generateId(), store.id, item.product.id, item.quantity],
      );
    }

    await connection.query(
      `
        INSERT INTO payments (id, order_id, company_id, store_id, amount, method, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
      `,
      [paymentId, orderId, store.company_id, store.id, total, payload.payment_method],
    );

    await connection.query(
      `
        INSERT INTO deliveries (id, order_id, store_id, provider, method_code, method_name, status, shipping_cost, quoted_payload, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW(), NOW())
      `,
      [deliveryId, orderId, store.id, selectedShipping.provider, selectedShipping.code, selectedShipping.name, shippingCost, JSON.stringify(selectedShipping)],
    );

    await connection.query(
      `
        INSERT INTO payment_transactions (id, payment_id, order_id, store_id, provider, transaction_type, status, amount, payload, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'checkout_created', 'pending', ?, ?, NOW(), NOW())
      `,
      [generateId(), paymentId, orderId, store.id, "internal", total, JSON.stringify({ cartId: cartData.cart.id, shippingMethod: selectedShipping.code })],
    );

    await appendOrderStatusHistory(connection, {
      orderId,
      fromStatus: null,
      toStatus: "pending",
      fromPaymentStatus: null,
      toPaymentStatus: "pending",
      note: "Pedido criado no checkout.",
      createdByType: customerAccountId ? "customer" : "guest",
      customerAccountId,
    });

    await connection.query("UPDATE storefront_carts SET status = 'converted', updated_at = NOW() WHERE id = ?", [cartData.cart.id]);

    if (appliedCoupon) {
      await connection.query("UPDATE coupons SET uses_count = uses_count + 1, updated_at = NOW() WHERE id = ?", [appliedCoupon.id]);
    }
  });

  let paymentRedirectUrl = null;
  const providerResolution = await resolvePaymentProvider({ store, selectedMethodCode: payload.payment_method });
  const paymentProvider = providerResolution.provider.name;

  try {
    const checkoutSession = await providerResolution.provider.createCheckoutSession({
      order: { id: orderId, orderNumber },
      items: cartSummary.items,
      payer: payload.customer,
      selectedMethodCode: payload.payment_method,
    });

    paymentRedirectUrl = checkoutSession.checkoutUrl || null;
    const costBreakdown = calculatePaymentCostBreakdown({
      amount: total,
      store,
      providerName: paymentProvider,
      selectedMethodCode: payload.payment_method,
    });

    await withTransaction(async (connection) => {
      await connection.query(
        "UPDATE payments SET gateway_reference = ?, method = ?, updated_at = NOW() WHERE id = ?",
        [checkoutSession.externalId || null, paymentProvider, paymentId],
      );
      await connection.query(
        `
          INSERT INTO payment_transactions (id, payment_id, order_id, store_id, provider, transaction_type, external_id, external_reference, status, amount, payload, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'checkout_session_created', ?, ?, 'pending', ?, ?, NOW(), NOW())
        `,
        [
          generateId(),
          paymentId,
          orderId,
          store.id,
          paymentProvider,
          checkoutSession.externalId || null,
          orderId,
          total,
          JSON.stringify({
            session: checkoutSession.raw,
            costBreakdown,
            strategy: providerResolution.strategy,
          }),
        ],
      );
      await logPaymentProviderEvent(connection, {
        storeId: store.id,
        provider: paymentProvider,
        status: "success",
        summary: "Sessao de checkout criada.",
        payload: {
          externalId: checkoutSession.externalId,
          costBreakdown,
          strategy: providerResolution.strategy,
        },
      });
    });
  } catch (error) {
    await withTransaction(async (connection) => {
      await connection.query("UPDATE payments SET status = 'failed', updated_at = NOW() WHERE id = ?", [paymentId]);
      await connection.query("UPDATE orders SET payment_status = 'failed', updated_at = NOW() WHERE id = ?", [orderId]);
      await appendOrderStatusHistory(connection, {
        orderId,
        fromStatus: "pending",
        toStatus: "pending",
        fromPaymentStatus: "pending",
        toPaymentStatus: "failed",
        note: error.message,
      });
      await logPaymentProviderEvent(connection, {
        storeId: store.id,
        provider: paymentProvider,
        status: "error",
        summary: "Falha ao criar sessao de checkout.",
        payload: { message: error.message },
      });
    });
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json({
    ok: true,
    orderId,
    orderNumber,
    total,
    paymentProvider,
    paymentRedirectUrl,
    paymentStatus: "pending",
    paymentCostPreview: calculatePaymentCostBreakdown({
      amount: total,
      store,
      providerName: paymentProvider,
      selectedMethodCode: payload.payment_method,
    }),
  });
}));

app.get("/api/public/stores/:slug/account/orders", requireCustomerAuth, asyncHandler(async (req, res) => {
  const store = await findStoreOrThrow(req.params.slug);
  if (!store || req.customer.storeId !== store.id) return res.status(404).json({ message: "Loja nao encontrada." });
  const scopedCustomer = await assertCustomerBelongsToStore(req.customer.id, store.id);
  if (!scopedCustomer) return res.status(403).json({ message: "Acesso invalido para esta loja." });

  const orders = await query(
    `
      SELECT
        o.*,
        d.status AS delivery_status,
        d.tracking_code,
        d.tracking_url
      FROM orders o
      LEFT JOIN deliveries d ON d.order_id = o.id
      WHERE o.store_id = ? AND o.customer_account_id = ?
      ORDER BY o.created_at DESC
    `,
    [store.id, scopedCustomer.id],
  );

  res.json({ orders });
}));

app.get("/api/public/stores/:slug/account/orders/:orderId", requireCustomerAuth, asyncHandler(async (req, res) => {
  const store = await findStoreOrThrow(req.params.slug);
  if (!store || req.customer.storeId !== store.id) return res.status(404).json({ message: "Loja nao encontrada." });
  const scopedCustomer = await assertCustomerBelongsToStore(req.customer.id, store.id);
  if (!scopedCustomer) return res.status(403).json({ message: "Acesso invalido para esta loja." });

  const order = await queryOne(
    `
      SELECT o.*, d.status AS delivery_status, d.tracking_code, d.tracking_url
      FROM orders o
      LEFT JOIN deliveries d ON d.order_id = o.id
      WHERE o.id = ? AND o.store_id = ? AND o.customer_account_id = ?
      LIMIT 1
    `,
    [req.params.orderId, store.id, scopedCustomer.id],
  );
  if (!order) return res.status(404).json({ message: "Pedido nao encontrado." });

  const [items, history] = await Promise.all([
    query("SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC", [order.id]),
    query("SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at DESC", [order.id]),
  ]);

  res.json({ order, items, history });
}));

app.get("/api/public/stores/:slug/account/addresses", requireCustomerAuth, asyncHandler(async (req, res) => {
  const store = await findStoreOrThrow(req.params.slug);
  if (!store || req.customer.storeId !== store.id) return res.status(404).json({ message: "Loja nao encontrada." });
  const addresses = await query(
    "SELECT * FROM customer_addresses WHERE customer_account_id = ? ORDER BY is_default DESC, created_at DESC",
    [req.customer.id],
  );
  res.json({ addresses });
}));

app.post("/api/public/stores/:slug/account/addresses", requireCustomerAuth, asyncHandler(async (req, res) => {
  const store = await findStoreOrThrow(req.params.slug);
  if (!store || req.customer.storeId !== store.id) return res.status(404).json({ message: "Loja nao encontrada." });
  const schema = z.object({
    label: z.string().optional().default("Endereco"),
    recipient_name: z.string().min(2),
    phone: z.string().optional().default(""),
    document: z.string().optional().default(""),
    zip_code: z.string().min(8),
    street: z.string().min(2),
    number: z.string().min(1),
    complement: z.string().optional().default(""),
    district: z.string().min(2),
    city: z.string().min(2),
    state: z.string().min(2),
    reference_note: z.string().optional().default(""),
    is_default: z.boolean().optional().default(false),
  });
  const payload = schema.parse(req.body);

  await withTransaction(async (connection) => {
    if (payload.is_default) {
      await connection.query("UPDATE customer_addresses SET is_default = 0 WHERE customer_account_id = ?", [req.customer.id]);
    }
    await connection.query(
      `
        INSERT INTO customer_addresses (
          id, customer_account_id, label, recipient_name, phone, document, zip_code, street, number, complement, district, city, state, reference_note, is_default, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        generateId(),
        req.customer.id,
        payload.label,
        payload.recipient_name,
        payload.phone || null,
        payload.document || null,
        payload.zip_code,
        payload.street,
        payload.number,
        payload.complement || null,
        payload.district,
        payload.city,
        payload.state,
        payload.reference_note || null,
        payload.is_default ? 1 : 0,
      ],
    );
  });

  const addresses = await query("SELECT * FROM customer_addresses WHERE customer_account_id = ? ORDER BY is_default DESC, created_at DESC", [req.customer.id]);
  res.status(201).json({ ok: true, addresses });
}));

app.put("/api/public/stores/:slug/account/profile", requireCustomerAuth, asyncHandler(async (req, res) => {
  const store = await findStoreOrThrow(req.params.slug);
  if (!store || req.customer.storeId !== store.id) return res.status(404).json({ message: "Loja nao encontrada." });
  const schema = z.object({
    fullName: z.string().min(2),
    phone: z.string().optional().default(""),
    document: z.string().optional().default(""),
  });
  const payload = schema.parse(req.body);

  await withTransaction(async (connection) => {
    await connection.query(
      "UPDATE customer_accounts SET full_name = ?, phone = ?, document = ?, updated_at = NOW() WHERE id = ?",
      [payload.fullName, payload.phone || null, payload.document || null, req.customer.id],
    );
    if (req.customer.customerId) {
      await connection.query(
        "UPDATE customers SET name = ?, phone = ?, document = ?, updated_at = NOW() WHERE id = ?",
        [payload.fullName, payload.phone || null, payload.document || null, req.customer.customerId],
      );
    }
  });

  const customer = await getCustomerContextById(req.customer.id);
  res.json({ ok: true, customer });
}));

app.put("/api/public/stores/:slug/account/password", requireCustomerAuth, asyncHandler(async (req, res) => {
  const store = await findStoreOrThrow(req.params.slug);
  if (!store || req.customer.storeId !== store.id) return res.status(404).json({ message: "Loja nao encontrada." });
  const schema = z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
  });
  const payload = schema.parse(req.body);

  const account = await queryOne("SELECT password_hash FROM customer_accounts WHERE id = ? LIMIT 1", [req.customer.id]);
  const isValid = await bcrypt.compare(payload.currentPassword, account.password_hash);
  if (!isValid) return res.status(400).json({ message: "Senha atual incorreta." });

  const passwordHash = await bcrypt.hash(payload.newPassword, 10);
  await query("UPDATE customer_accounts SET password_hash = ?, updated_at = NOW() WHERE id = ?", [passwordHash, req.customer.id]);
  res.json({ ok: true });
}));

app.post("/api/webhooks/mercadopago/:storeId", asyncHandler(async (req, res) => {
  const integration = await getStoreIntegration(req.params.storeId, "mercado_pago");
  const incomingToken = String(req.query.token || "");
  const eventId = generateId();

  await query(
    `
      INSERT INTO webhook_events (id, store_id, provider, event_type, external_id, payload, status, created_at)
      VALUES (?, ?, 'mercado_pago', ?, ?, ?, 'received', NOW())
    `,
    [eventId, req.params.storeId, String(req.body?.type || req.body?.action || "unknown"), String(req.body?.data?.id || req.query["data.id"] || ""), JSON.stringify(req.body || {})],
  );

  if (!integration?.is_enabled || !integration.public_config?.webhookToken || integration.public_config.webhookToken !== incomingToken) {
    await query("UPDATE webhook_events SET status = 'ignored', error_message = ?, processed_at = NOW() WHERE id = ?", ["Token de webhook invalido.", eventId]);
    return res.status(401).json({ message: "Webhook nao autorizado." });
  }

  const paymentExternalId = String(req.body?.data?.id || req.query["data.id"] || "");
  if (!paymentExternalId) {
    await query("UPDATE webhook_events SET status = 'ignored', error_message = ?, processed_at = NOW() WHERE id = ?", ["Pagamento nao informado.", eventId]);
    return res.json({ ok: true });
  }

  try {
    const paymentData = await fetchMercadoPagoPayment({ integration, paymentId: paymentExternalId });
    const orderIdFromGateway = String(paymentData.external_reference || "");
    const order = await queryOne("SELECT * FROM orders WHERE id = ? AND store_id = ? LIMIT 1", [orderIdFromGateway, req.params.storeId]);
    const payment = order ? await queryOne("SELECT * FROM payments WHERE order_id = ? AND store_id = ? LIMIT 1", [order.id, order.store_id]) : null;

    if (!order || !payment) {
      await query("UPDATE webhook_events SET status = 'ignored', error_message = ?, processed_at = NOW() WHERE id = ?", ["Pedido nao localizado para o webhook.", eventId]);
      return res.json({ ok: true });
    }

    const nextPaymentStatus = paymentStatusFromMercadoPago(paymentData.status);
    const nextOrderStatus = orderStatusFromPaymentStatus(nextPaymentStatus);

    await withTransaction(async (connection) => {
      await connection.query(
        "UPDATE payments SET status = ?, gateway_reference = ?, updated_at = NOW() WHERE id = ?",
        [nextPaymentStatus, String(paymentData.id || paymentExternalId), payment.id],
      );
      await connection.query(
        "UPDATE orders SET payment_status = ?, status = ?, updated_at = NOW() WHERE id = ?",
        [nextPaymentStatus, nextOrderStatus, order.id],
      );
      await connection.query(
        `
          INSERT INTO payment_transactions (id, payment_id, order_id, store_id, provider, transaction_type, external_id, external_reference, status, amount, payload, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'mercado_pago', 'webhook_update', ?, ?, ?, ?, ?, NOW(), NOW())
        `,
        [generateId(), payment.id, order.id, order.store_id, String(paymentData.id || paymentExternalId), order.id, paymentData.status, Number(paymentData.transaction_amount || payment.amount), JSON.stringify(paymentData)],
      );
      await appendOrderStatusHistory(connection, {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: nextOrderStatus,
        fromPaymentStatus: order.payment_status,
        toPaymentStatus: nextPaymentStatus,
        note: `Webhook Mercado Pago: ${paymentData.status}`,
      });
      await logIntegration(connection, {
        storeId: order.store_id,
        provider: "mercado_pago",
        direction: "inbound",
        status: "success",
        summary: `Webhook processado com status ${paymentData.status}.`,
        payload: paymentData,
      });
      await connection.query("UPDATE webhook_events SET status = 'processed', processed_at = NOW() WHERE id = ?", [eventId]);
    });

    res.json({ ok: true });
  } catch (error) {
    await query("UPDATE webhook_events SET status = 'error', error_message = ?, processed_at = NOW() WHERE id = ?", [error.message, eventId]);
    res.status(500).json({ message: error.message });
  }
}));

app.post("/api/webhooks/shipping/:storeId/:provider", asyncHandler(async (req, res) => {
  const provider = String(req.params.provider || "").toLowerCase();
  const integration = await getStoreIntegration(req.params.storeId, provider);
  const incomingToken = String(req.query.token || "");
  const eventId = generateId();

  await query(
    `
      INSERT INTO webhook_events (id, store_id, provider, event_type, external_id, payload, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'received', NOW())
    `,
    [
      eventId,
      req.params.storeId,
      provider,
      String(req.body?.event || req.body?.status || "shipping_update"),
      String(req.body?.delivery_id || req.body?.tracking_code || req.body?.id || ""),
      JSON.stringify(req.body || {}),
    ],
  );

  if (!integration?.is_enabled || !integration.public_config?.webhookToken || integration.public_config.webhookToken !== incomingToken) {
    await query("UPDATE webhook_events SET status = 'ignored', error_message = ?, processed_at = NOW() WHERE id = ?", ["Token de webhook invalido.", eventId]);
    return res.status(401).json({ message: "Webhook nao autorizado." });
  }

  const externalReference = String(req.body?.external_reference || req.body?.order_id || "");
  const trackingCode = String(req.body?.tracking_code || req.body?.tracking || "");
  const requestedStatus = normalizeDeliveryStatus(req.body?.status);

  const delivery = externalReference
    ? await queryOne(
      `
        SELECT d.*, o.id AS order_id
        FROM deliveries d
        INNER JOIN orders o ON o.id = d.order_id
        WHERE d.store_id = ? AND o.id = ?
        LIMIT 1
      `,
      [req.params.storeId, externalReference],
    )
    : null;

  if (!delivery) {
    await query("UPDATE webhook_events SET status = 'ignored', error_message = ?, processed_at = NOW() WHERE id = ?", ["Entrega nao localizada para o webhook.", eventId]);
    return res.json({ ok: true });
  }

  await withTransaction(async (connection) => {
    await connection.query(
      `
        UPDATE deliveries
        SET status = ?, tracking_code = ?, tracking_url = ?, external_reference = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [
        requestedStatus,
        trackingCode || delivery.tracking_code || null,
        req.body?.tracking_url || delivery.tracking_url || null,
        req.body?.external_id || delivery.external_reference || null,
        delivery.id,
      ],
    );
    await appendOrderStatusHistory(connection, {
      orderId: delivery.order_id,
      note: `Webhook logistico ${provider}: ${requestedStatus}.`,
    });
    await logIntegration(connection, {
      storeId: req.params.storeId,
      provider,
      direction: "inbound",
      status: "success",
      summary: `Webhook logistico processado com status ${requestedStatus}.`,
      payload: req.body,
    });
    await connection.query("UPDATE webhook_events SET status = 'processed', processed_at = NOW() WHERE id = ?", [eventId]);
  });

  res.json({ ok: true });
}));

app.use((error, _req, res, _next) => {
  console.error(error);

  if (error instanceof z.ZodError) {
    return res.status(400).json({
      message: "Dados invalidos.",
      errors: error.issues,
    });
  }

  res.status(500).json({ message: error.message || "Erro interno do servidor." });
});

pool.getConnection()
  .then((connection) => {
    connection.release();
    app.listen(apiPort, () => {
      console.log(`API VEXOR rodando em http://127.0.0.1:${apiPort}`);
    });
  })
  .catch((error) => {
    console.error("Falha ao iniciar API:", error.message);
    process.exit(1);
  });
