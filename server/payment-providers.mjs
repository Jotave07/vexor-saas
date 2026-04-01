import { generateId } from "./services.mjs";
import { queryOne } from "./db.mjs";
import {
  createMercadoPagoPreference,
  fetchMercadoPagoPayment,
  getStoreIntegration,
  logIntegration,
} from "./storefront-services.mjs";

function normalizeMethodCode(method) {
  return String(method || "").trim().toLowerCase();
}

function extractFeeConfig(store, providerName, selectedMethodCode) {
  const checkoutSettings = store.settings?.checkout_settings || {};
  const feeTable = checkoutSettings.paymentFeeTable || {};
  const providerFees = feeTable[providerName] || {};
  const methodFees = providerFees[normalizeMethodCode(selectedMethodCode)] || {};

  return {
    gatewayFeePercent: Number(methodFees.gatewayFeePercent || providerFees.gatewayFeePercent || 0),
    gatewayFixedFee: Number(methodFees.gatewayFixedFee || providerFees.gatewayFixedFee || 0),
    platformFeePercent: Number(methodFees.platformFeePercent || providerFees.platformFeePercent || 0),
    anticipationFeePercent: Number(methodFees.anticipationFeePercent || providerFees.anticipationFeePercent || 0),
    splitFeePercent: Number(methodFees.splitFeePercent || providerFees.splitFeePercent || 0),
  };
}

export function calculatePaymentCostBreakdown({ amount, store, providerName, selectedMethodCode }) {
  const fees = extractFeeConfig(store, providerName, selectedMethodCode);
  const gatewayFee = Number(((amount * fees.gatewayFeePercent) / 100 + fees.gatewayFixedFee).toFixed(2));
  const platformFee = Number(((amount * fees.platformFeePercent) / 100).toFixed(2));
  const anticipationFee = Number(((amount * fees.anticipationFeePercent) / 100).toFixed(2));
  const splitFee = Number(((amount * fees.splitFeePercent) / 100).toFixed(2));
  const totalFees = Number((gatewayFee + platformFee + anticipationFee + splitFee).toFixed(2));
  const estimatedNetAmount = Number((amount - totalFees).toFixed(2));

  return {
    amount: Number(amount.toFixed(2)),
    gatewayFee,
    platformFee,
    anticipationFee,
    splitFee,
    totalFees,
    estimatedNetAmount,
    strategy: store.settings?.checkout_settings?.paymentStrategy || "lowest_cost",
  };
}

function buildMercadoPagoProvider(store, integration) {
  return {
    name: "mercado_pago",
    checkoutMode: store.settings?.checkout_settings?.transparentCheckout ? "transparent" : "redirect",
    supports: ["pix", "card", "boleto"],
    async testConnection() {
      const response = await fetch("https://api.mercadopago.com/users/me", {
        headers: { Authorization: `Bearer ${integration.credentials.accessToken}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Falha ao validar Mercado Pago.");
      }
      return { ok: true, account: { id: data.id, email: data.email, nickname: data.nickname } };
    },
    async createCheckoutSession(input) {
      const preference = await createMercadoPagoPreference({
        store,
        integration,
        order: input.order,
        items: input.items,
        payer: input.payer,
        selectedMethodCode: input.selectedMethodCode,
      });

      return {
        provider: "mercado_pago",
        externalId: preference.id || null,
        checkoutUrl: preference.init_point || preference.sandbox_init_point || null,
        raw: preference,
      };
    },
    async fetchPaymentStatus({ externalId }) {
      return fetchMercadoPagoPayment({ integration, paymentId: externalId });
    },
    async runSandboxCheckoutTest({ store, userId }) {
      const amount = 1;
      const fakeOrder = { id: generateId(), orderNumber: `TEST${Date.now()}` };
      const result = await this.createCheckoutSession({
        order: fakeOrder,
        items: [{
          product: { id: "test-product", name: "Teste Integracao" },
          quantity: 1,
          unitPrice: amount,
        }],
        payer: { name: "Teste VEXOR", email: "teste@example.com" },
        selectedMethodCode: "pix",
      });

      return {
        ok: true,
        orderReference: fakeOrder.id,
        checkoutUrl: result.checkoutUrl,
        externalId: result.externalId,
        createdByUserId: userId,
        raw: result.raw,
      };
    },
  };
}

function buildManualProvider(store) {
  return {
    name: "manual",
    checkoutMode: "internal",
    supports: ["pix", "card", "boleto"],
    async testConnection() {
      return { ok: true, mode: "manual" };
    },
    async createCheckoutSession() {
      return {
        provider: "manual",
        externalId: null,
        checkoutUrl: null,
        raw: { mode: "manual" },
      };
    },
    async runSandboxCheckoutTest() {
      return { ok: true, mode: "manual" };
    },
  };
}

export async function resolvePaymentProvider({ store, selectedMethodCode }) {
  const strategy = String(store.settings?.checkout_settings?.paymentStrategy || "lowest_cost");
  const preferredProvider = String(store.settings?.checkout_settings?.preferredPaymentProvider || "mercado_pago");
  const activeMethods = Array.isArray(store.settings?.payment_methods) ? store.settings.payment_methods : [];
  const selectedMethod = activeMethods.find((method) => normalizeMethodCode(method.code || method) === normalizeMethodCode(selectedMethodCode));
  const configuredProvider = normalizeMethodCode(selectedMethod?.provider || preferredProvider);

  if (configuredProvider === "mercado_pago") {
    const integration = await getStoreIntegration(store.id, "mercado_pago");
    if (integration?.is_enabled && integration.credentials?.accessToken) {
      return {
        strategy,
        provider: buildMercadoPagoProvider(store, integration),
      };
    }
  }

  return {
    strategy,
    provider: buildManualProvider(store),
  };
}

export async function persistIntegrationTestRun(connection, {
  storeId,
  provider,
  integrationType,
  scenario,
  status,
  requestPayload,
  responsePayload,
  errorMessage = null,
  createdByUserId = null,
  testRunId = null,
}) {
  const id = testRunId || generateId();

  const existing = testRunId
    ? await connection.query("SELECT id FROM integration_test_runs WHERE id = ? LIMIT 1", [testRunId])
    : [[], []];

  if (existing[0]?.[0]) {
    await connection.query(
      `
        UPDATE integration_test_runs
        SET status = ?, response_payload = ?, error_message = ?, finished_at = NOW()
        WHERE id = ?
      `,
      [status, JSON.stringify(responsePayload || {}), errorMessage, id],
    );
    return id;
  }

  await connection.query(
    `
      INSERT INTO integration_test_runs (
        id, store_id, provider, integration_type, scenario, status, request_payload, response_payload, error_message, started_at, finished_at, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ${status === "running" ? "NULL" : "NOW()"}, ?)
    `,
    [
      id,
      storeId,
      provider,
      integrationType,
      scenario,
      status,
      JSON.stringify(requestPayload || {}),
      JSON.stringify(responsePayload || {}),
      errorMessage,
      createdByUserId,
    ],
  );
  return id;
}

export async function getPaymentDiagnostics(storeId) {
  const [lastTest, recentTransactions] = await Promise.all([
    queryOne(
      `
        SELECT *
        FROM integration_test_runs
        WHERE store_id = ? AND integration_type = 'payment'
        ORDER BY started_at DESC
        LIMIT 1
      `,
      [storeId],
    ),
    queryOne(
      `
        SELECT
          COUNT(*) AS total_attempts,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_attempts,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_attempts
        FROM payments
        WHERE store_id = ?
      `,
      [storeId],
    ),
  ]);

  return {
    lastTest,
    recentTransactions: {
      totalAttempts: Number(recentTransactions?.total_attempts || 0),
      paidAttempts: Number(recentTransactions?.paid_attempts || 0),
      failedAttempts: Number(recentTransactions?.failed_attempts || 0),
    },
  };
}

export async function logPaymentProviderEvent(connection, { storeId, provider, status, summary, payload }) {
  await logIntegration(connection, {
    storeId,
    provider,
    direction: "outbound",
    status,
    summary,
    payload,
  });
}

