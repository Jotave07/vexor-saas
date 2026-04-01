import { decryptJson, encryptJson } from "./crypto.mjs";
import { generateId, parseJsonField } from "./services.mjs";
import { query, queryOne } from "./db.mjs";

function sanitizeCep(value) {
  return String(value || "").replace(/\D/g, "");
}

function roundCurrency(value) {
  return Number(Number(value || 0).toFixed(2));
}

export function paymentStatusFromMercadoPago(status) {
  if (["approved", "authorized"].includes(status)) return "paid";
  if (["rejected", "cancelled", "charged_back"].includes(status)) return "failed";
  if (["refunded"].includes(status)) return "refunded";
  return "pending";
}

export function orderStatusFromPaymentStatus(status) {
  if (status === "paid") return "confirmed";
  if (status === "refunded") return "refunded";
  if (status === "failed") return "cancelled";
  return "pending";
}

export async function findStoreBySlug(slug) {
  const store = await queryOne(
    `
      SELECT
        s.*,
        c.status AS company_status
      FROM stores s
      INNER JOIN companies c ON c.id = s.company_id
      WHERE s.slug = ?
      LIMIT 1
    `,
    [slug],
  );

  if (!store) return null;

  const settings = await queryOne("SELECT * FROM store_settings WHERE store_id = ? LIMIT 1", [store.id]);
  return {
    ...store,
    theme_colors: parseJsonField(store.theme_colors, {}),
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
  };
}

export async function getStoreIntegration(storeId, provider) {
  const integration = await queryOne(
    "SELECT * FROM store_integrations WHERE store_id = ? AND provider = ? LIMIT 1",
    [storeId, provider],
  );

  if (!integration) return null;

  return {
    ...integration,
    public_config: parseJsonField(integration.public_config, {}),
    credentials: decryptJson(integration.credentials_encrypted, {}),
  };
}

export async function listStoreIntegrations(storeId) {
  const integrations = await query("SELECT * FROM store_integrations WHERE store_id = ? ORDER BY provider ASC", [storeId]);
  return integrations.map((integration) => ({
    ...integration,
    public_config: parseJsonField(integration.public_config, {}),
    credentials: decryptJson(integration.credentials_encrypted, {}),
  }));
}

export async function upsertStoreIntegration(connection, { storeId, provider, mode = "production", isEnabled = false, credentials = {}, publicConfig = {} }) {
  const existing = await connection.query("SELECT id FROM store_integrations WHERE store_id = ? AND provider = ? LIMIT 1", [storeId, provider]);
  const existingRow = existing[0]?.[0];

  if (existingRow) {
    await connection.query(
      `
        UPDATE store_integrations
        SET mode = ?, is_enabled = ?, credentials_encrypted = ?, public_config = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [mode, isEnabled ? 1 : 0, encryptJson(credentials), JSON.stringify(publicConfig), existingRow.id],
    );
    return existingRow.id;
  }

  const id = generateId();
  await connection.query(
    `
      INSERT INTO store_integrations (id, store_id, provider, mode, credentials_encrypted, public_config, is_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
    [id, storeId, provider, mode, encryptJson(credentials), JSON.stringify(publicConfig), isEnabled ? 1 : 0],
  );
  return id;
}

export async function logIntegration(connection, { storeId, provider, direction, status, summary, payload }) {
  await connection.query(
    `
      INSERT INTO integration_logs (id, store_id, provider, direction, status, summary, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [generateId(), storeId, provider, direction, status, summary || null, JSON.stringify(payload || {})],
  );
}

export async function resolveCep(cep) {
  const normalized = sanitizeCep(cep);
  if (normalized.length !== 8) {
    throw new Error("CEP invalido.");
  }

  const response = await fetch(`https://viacep.com.br/ws/${normalized}/json/`);
  if (!response.ok) {
    throw new Error("Falha ao consultar o CEP.");
  }

  const data = await response.json();
  if (data.erro) {
    throw new Error("CEP nao encontrado.");
  }

  return {
    zipCode: normalized,
    street: data.logradouro || "",
    district: data.bairro || "",
    city: data.localidade || "",
    state: data.uf || "",
    raw: data,
  };
}

export function summarizeCartProducts(products, items) {
  const productMap = new Map(products.map((product) => [product.id, product]));
  let subtotal = 0;
  let totalWeight = 0;
  let totalQuantity = 0;
  let maxHeight = 2;
  let maxWidth = 11;
  let maxLength = 16;

  const normalizedItems = items.map((item) => {
    const product = productMap.get(item.product_id || item.productId);
    if (!product) {
      throw new Error("Produto invalido no carrinho.");
    }
    if (!product.is_active) {
      throw new Error(`Produto inativo: ${product.name}`);
    }
    if (Number(product.stock) < Number(item.quantity)) {
      throw new Error(`Estoque insuficiente para ${product.name}.`);
    }

    const unitPrice = Number(product.sale_price ?? product.price);
    const quantity = Number(item.quantity);
    subtotal += unitPrice * quantity;
    totalWeight += Number(product.weight || 0.3) * quantity;
    totalQuantity += quantity;

    const dimensions = parseJsonField(product.dimensions, {});
    maxHeight += Number(dimensions.height || 2) * quantity;
    maxWidth = Math.max(maxWidth, Number(dimensions.width || 11));
    maxLength = Math.max(maxLength, Number(dimensions.length || 16));

    return { product, quantity, unitPrice };
  });

  return {
    subtotal: roundCurrency(subtotal),
    totalWeight: Math.max(totalWeight, 0.3),
    totalQuantity,
    package: {
      weight: Number(totalWeight.toFixed(3)),
      height: Number(maxHeight.toFixed(2)),
      width: Number(maxWidth.toFixed(2)),
      length: Number(maxLength.toFixed(2)),
    },
    items: normalizedItems,
  };
}

function isZipInRange(zipCode, range) {
  const normalizedZip = Number(sanitizeCep(zipCode));
  const start = Number(sanitizeCep(range?.start));
  const end = Number(sanitizeCep(range?.end));
  if (!start || !end || !normalizedZip) return true;
  return normalizedZip >= start && normalizedZip <= end;
}

function matchesNeighborhood(address, neighborhoods) {
  if (!Array.isArray(neighborhoods) || neighborhoods.length === 0) return true;
  const district = String(address?.district || "").toLowerCase();
  return neighborhoods.some((entry) => district === String(entry).toLowerCase());
}

async function quoteWithMelhorEnvio({ integration, shippingSettings, destinationZip, packageInfo, products }) {
  const token = integration?.credentials?.accessToken;
  if (!token || !shippingSettings?.originZipCode) return [];

  const baseUrl = integration.mode === "sandbox"
    ? "https://sandbox.melhorenvio.com.br"
    : "https://www.melhorenvio.com.br";

  const body = {
    from: { postal_code: sanitizeCep(shippingSettings.originZipCode) },
    to: { postal_code: sanitizeCep(destinationZip) },
    products: products.map(({ product, quantity }) => {
      const dimensions = parseJsonField(product.dimensions, {});
      return {
        id: product.id,
        width: Number(dimensions.width || 11),
        height: Number(dimensions.height || 2),
        length: Number(dimensions.length || 16),
        weight: Number(product.weight || 0.3),
        insurance_value: Number(product.sale_price ?? product.price),
        quantity,
      };
    }),
    options: {
      receipt: false,
      own_hand: false,
      insurance_value: roundCurrency(products.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)),
    },
    services: Array.isArray(shippingSettings?.melhorEnvioServiceCodes)
      ? shippingSettings.melhorEnvioServiceCodes.join(",")
      : undefined,
  };

  const response = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "User-Agent": "VEXOR Sistemas",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Falha ao cotar frete no Melhor Envio.");
  }

  const data = await response.json();
  if (!Array.isArray(data)) return [];

  return data
    .filter((service) => !service.error)
    .map((service) => ({
      code: `melhor_envio:${service.id || service.name}`,
      name: service.name,
      provider: "melhor_envio",
      amount: roundCurrency(service.price || service.custom_price || 0),
      deliveryDays: Number(service.delivery_time || 0) + Number(shippingSettings?.additionalDays || 0),
      serviceCode: service.id,
      company: service.company?.name || null,
      raw: service,
    }));
}

export async function quoteShippingForStore({ store, destinationZip, products }) {
  const shippingSettings = store.settings?.shipping_settings || {};
  const destination = await resolveCep(destinationZip);
  const packageSummary = summarizeCartProducts(products.map((item) => item.product), products.map((item) => ({ product_id: item.product.id, quantity: item.quantity })));
  const methods = [];
  const freeShippingAbove = Number(shippingSettings.freeShippingAbove || 0);
  const additionalDays = Number(shippingSettings.additionalDays || 0);

  if (Array.isArray(shippingSettings.methods)) {
    for (const method of shippingSettings.methods) {
      if (!method?.enabled) continue;
      if (Array.isArray(method.zipRanges) && method.zipRanges.length > 0 && !method.zipRanges.some((range) => isZipInRange(destination.zipCode, range))) continue;
      if (!matchesNeighborhood(destination, method.neighborhoods)) continue;

      if (method.type === "pickup") {
        methods.push({
          code: method.code || "pickup",
          name: method.label || "Retirada na loja",
          provider: "store_rule",
          amount: 0,
          deliveryDays: Number(method.deliveryDays || 0),
          raw: method,
        });
      }

      if (method.type === "fixed") {
        methods.push({
          code: method.code || `fixed:${method.label || "padrao"}`,
          name: method.label || "Entrega fixa",
          provider: "store_rule",
          amount: roundCurrency(method.price || 0),
          deliveryDays: Number(method.deliveryDays || 0) + additionalDays,
          raw: method,
        });
      }

      if (method.type === "local_delivery") {
        methods.push({
          code: method.code || `local_delivery:${method.label || "local"}`,
          name: method.label || "Entrega local",
          provider: "store_rule",
          amount: roundCurrency(method.price || 0),
          deliveryDays: Number(method.deliveryDays || 0) + additionalDays,
          raw: method,
        });
      }
    }
  }

  if (freeShippingAbove > 0 && packageSummary.subtotal >= freeShippingAbove) {
    methods.push({
      code: "free_shipping",
      name: "Frete gratis",
      provider: "store_rule",
      amount: 0,
      deliveryDays: additionalDays,
      raw: { rule: "free_shipping_above" },
    });
  }

  const melhorEnvioIntegration = await getStoreIntegration(store.id, "melhor_envio");
  if (melhorEnvioIntegration?.is_enabled) {
    const melhorEnvioQuotes = await quoteWithMelhorEnvio({
      integration: melhorEnvioIntegration,
      shippingSettings,
      destinationZip,
      packageInfo: packageSummary.package,
      products,
    });
    methods.push(...melhorEnvioQuotes);
  }

  return {
    destination,
    subtotal: packageSummary.subtotal,
    package: packageSummary.package,
    methods: methods.sort((a, b) => a.amount - b.amount),
  };
}

function mercadoPagoBaseUrl(mode) {
  return mode === "sandbox"
    ? "https://api.mercadopago.com"
    : "https://api.mercadopago.com";
}

export async function createMercadoPagoPreference({ store, integration, order, items, payer, selectedMethodCode }) {
  const accessToken = integration?.credentials?.accessToken;
  if (!accessToken) {
    throw new Error("Credencial do Mercado Pago nao configurada.");
  }

  const methodGroup = String(selectedMethodCode || "all");
  const paymentTypeGroups = {
    pix: ["credit_card", "debit_card", "ticket", "atm"],
    card: ["ticket", "atm", "bank_transfer"],
    boleto: ["credit_card", "debit_card", "bank_transfer", "atm"],
    all: [],
  };

  const body = {
    external_reference: order.id,
    notification_url: `${process.env.API_PUBLIC_URL || `http://127.0.0.1:${process.env.API_PORT || 3001}`}/api/webhooks/mercadopago/${store.id}?token=${encodeURIComponent(integration.public_config?.webhookToken || "")}`,
    back_urls: {
      success: `${process.env.FRONTEND_URL || "http://127.0.0.1:8080"}/shop/${store.slug}/checkout?status=success&order=${order.id}`,
      pending: `${process.env.FRONTEND_URL || "http://127.0.0.1:8080"}/shop/${store.slug}/checkout?status=pending&order=${order.id}`,
      failure: `${process.env.FRONTEND_URL || "http://127.0.0.1:8080"}/shop/${store.slug}/checkout?status=failure&order=${order.id}`,
    },
    auto_return: "approved",
    statement_descriptor: String(store.name || "VEXOR").slice(0, 13),
    payer: {
      name: payer.name,
      email: payer.email,
    },
    items: items.map((item) => ({
      id: item.product.id,
      title: item.product.name,
      quantity: item.quantity,
      currency_id: "BRL",
      unit_price: roundCurrency(item.unitPrice),
    })),
    payment_methods: paymentTypeGroups[methodGroup]
      ? { excluded_payment_types: paymentTypeGroups[methodGroup].map((id) => ({ id })) }
      : undefined,
    metadata: {
      store_id: store.id,
      order_id: order.id,
    },
  };

  const response = await fetch(`${mercadoPagoBaseUrl(integration.mode)}/checkout/preferences`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Falha ao criar preferencia de pagamento.");
  }

  return data;
}

export async function fetchMercadoPagoPayment({ integration, paymentId }) {
  const accessToken = integration?.credentials?.accessToken;
  if (!accessToken) {
    throw new Error("Credencial do Mercado Pago nao configurada.");
  }

  const response = await fetch(`${mercadoPagoBaseUrl(integration.mode)}/v1/payments/${paymentId}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Falha ao consultar pagamento no Mercado Pago.");
  }

  return data;
}
