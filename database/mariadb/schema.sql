CREATE DATABASE IF NOT EXISTS `Vexor_Ecommerce`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `Vexor_Ecommerce`;

CREATE TABLE IF NOT EXISTS companies (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  document VARCHAR(50) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  address TEXT NULL,
  status ENUM('active', 'trial', 'suspended', 'cancelled', 'defaulting') NOT NULL DEFAULT 'trial',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  company_id CHAR(36) NULL,
  full_name VARCHAR(255) NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT NULL,
  phone VARCHAR(50) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  role ENUM('master_admin', 'company_admin', 'company_staff') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_role (user_id, role),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plans (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_products INT NULL DEFAULT 100,
  max_stores INT NULL DEFAULT 1,
  max_users INT NULL DEFAULT 3,
  features JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id CHAR(36) PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  plan_id CHAR(36) NOT NULL,
  status ENUM('active', 'trial', 'expired', 'cancelled', 'suspended') NOT NULL DEFAULT 'trial',
  start_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  end_date DATE NULL,
  due_date DATE NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscriptions_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE IF NOT EXISTS stores (
  id CHAR(36) PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NULL UNIQUE,
  domain VARCHAR(255) NULL,
  logo_url TEXT NULL,
  favicon_url TEXT NULL,
  theme_colors JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stores_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS store_settings (
  id CHAR(36) PRIMARY KEY,
  store_id CHAR(36) NOT NULL,
  checkout_settings JSON NULL,
  shipping_settings JSON NULL,
  payment_methods JSON NULL,
  seo_settings JSON NULL,
  policies JSON NULL,
  social_links JSON NULL,
  institutional_texts JSON NULL,
  visual_settings JSON NULL,
  home_settings JSON NULL,
  campaign_settings JSON NULL,
  footer_settings JSON NULL,
  trust_badges JSON NULL,
  featured_brands JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_store_settings_store (store_id),
  CONSTRAINT fk_store_settings_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) PRIMARY KEY,
  store_id CHAR(36) NOT NULL,
  parent_id CHAR(36) NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image_url TEXT NULL,
  sort_order INT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_categories_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) PRIMARY KEY,
  store_id CHAR(36) NOT NULL,
  category_id CHAR(36) NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  sale_price DECIMAL(10,2) NULL,
  cost_price DECIMAL(10,2) NULL,
  sku VARCHAR(100) NULL,
  barcode VARCHAR(100) NULL,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NULL DEFAULT 0,
  weight DECIMAL(8,3) NULL,
  dimensions JSON NULL,
  images JSON NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  meta_title VARCHAR(255) NULL,
  meta_description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_variations (
  id CHAR(36) PRIMARY KEY,
  product_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NULL,
  price DECIMAL(10,2) NULL,
  stock INT NOT NULL DEFAULT 0,
  attributes JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_variations_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customers (
  id CHAR(36) PRIMARY KEY,
  store_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  document VARCHAR(50) NULL,
  addresses JSON NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_customers_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) PRIMARY KEY,
  store_id CHAR(36) NOT NULL,
  customer_id CHAR(36) NULL,
  order_number VARCHAR(100) NOT NULL,
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_status ENUM('pending', 'paid', 'overdue', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(100) NULL,
  shipping_address JSON NULL,
  shipping_info JSON NULL,
  coupon_code VARCHAR(100) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  product_id CHAR(36) NULL,
  variation_id CHAR(36) NULL,
  product_name VARCHAR(255) NOT NULL,
  variation_name VARCHAR(255) NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT fk_order_items_variation FOREIGN KEY (variation_id) REFERENCES product_variations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS coupons (
  id CHAR(36) PRIMARY KEY,
  store_id CHAR(36) NOT NULL,
  code VARCHAR(100) NOT NULL,
  description TEXT NULL,
  discount_type VARCHAR(50) NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  min_order_value DECIMAL(10,2) NULL,
  max_uses INT NULL,
  uses_count INT NOT NULL DEFAULT 0,
  valid_from DATETIME NULL,
  valid_until DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_coupons_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS banners (
  id CHAR(36) PRIMARY KEY,
  store_id CHAR(36) NOT NULL,
  title VARCHAR(255) NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NULL,
  position VARCHAR(50) NULL DEFAULT 'home',
  sort_order INT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_banners_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_history (
  id CHAR(36) PRIMARY KEY,
  subscription_id CHAR(36) NOT NULL,
  company_id CHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE NULL,
  status ENUM('pending', 'paid', 'overdue', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(100) NULL,
  reference VARCHAR(255) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_history_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_history_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NULL,
  company_id CHAR(36) NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NULL,
  entity_id VARCHAR(100) NULL,
  details JSON NULL,
  ip_address VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_activity_logs_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  company_id CHAR(36) NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NULL,
  type VARCHAR(50) NULL DEFAULT 'info',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  link TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_stores_company ON stores(company_id);
CREATE INDEX idx_categories_store ON categories(store_id);
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_customers_store ON customers(store_id);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_coupons_store ON coupons(store_id);
CREATE INDEX idx_banners_store ON banners(store_id);
CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX idx_payment_history_company ON payment_history(company_id);
CREATE INDEX idx_activity_logs_company ON activity_logs(company_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

CREATE TABLE IF NOT EXISTS user_sessions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  ip_address VARCHAR(100) NULL,
  user_agent TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id CHAR(36) PRIMARY KEY,
  store_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  movement_type ENUM('in', 'out', 'adjustment') NOT NULL,
  quantity INT NOT NULL,
  reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_movements_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT fk_stock_movements_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  company_id CHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(100) NOT NULL,
  status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  gateway_reference VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS change_history (
  id CHAR(36) PRIMARY KEY,
  company_id CHAR(36) NULL,
  user_id CHAR(36) NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  action VARCHAR(100) NOT NULL,
  before_data JSON NULL,
  after_data JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_change_history_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
  CONSTRAINT fk_change_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS customer_accounts (
  id CHAR(36) PRIMARY KEY,
  store_id CHAR(36) NOT NULL,
  customer_id CHAR(36) NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  document VARCHAR(50) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer_accounts_store_email (store_id, email),
  CONSTRAINT fk_customer_accounts_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT fk_customer_accounts_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id CHAR(36) PRIMARY KEY,
  customer_account_id CHAR(36) NOT NULL,
  label VARCHAR(100) NULL,
  recipient_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  document VARCHAR(50) NULL,
  zip_code VARCHAR(20) NOT NULL,
  street VARCHAR(255) NOT NULL,
  number VARCHAR(50) NOT NULL,
  complement VARCHAR(255) NULL,
  district VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(10) NOT NULL,
  reference_note VARCHAR(255) NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_customer_addresses_account FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customer_sessions (
  id CHAR(36) PRIMARY KEY,
  customer_account_id CHAR(36) NOT NULL,
  store_id CHAR(36) NOT NULL,
  ip_address VARCHAR(100) NULL,
  user_agent TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  CONSTRAINT fk_customer_sessions_account FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_customer_sessions_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customer_password_reset_tokens (
  id CHAR(36) PRIMARY KEY,
  customer_account_id CHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_customer_password_reset_tokens_account FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS storefront_carts (
  id CHAR(36) PRIMARY KEY,
  store_id CHAR(36) NOT NULL,
  customer_account_id CHAR(36) NULL,
  session_token VARCHAR(255) NOT NULL,
  status ENUM('active', 'converted', 'abandoned') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_storefront_carts_store_session (store_id, session_token),
  CONSTRAINT fk_storefront_carts_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT fk_storefront_carts_account FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS storefront_cart_items (
  id CHAR(36) PRIMARY KEY,
  cart_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_storefront_cart_items_cart_product (cart_id, product_id),
  CONSTRAINT fk_storefront_cart_items_cart FOREIGN KEY (cart_id) REFERENCES storefront_carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_storefront_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS store_integrations (
  id CHAR(36) PRIMARY KEY,
  store_id CHAR(36) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  mode VARCHAR(50) NOT NULL DEFAULT 'production',
  credentials_encrypted LONGTEXT NULL,
  public_config JSON NULL,
  is_enabled TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_store_integrations_store_provider (store_id, provider),
  CONSTRAINT fk_store_integrations_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shipping_quotes (
  id CHAR(36) PRIMARY KEY,
  store_id CHAR(36) NOT NULL,
  customer_account_id CHAR(36) NULL,
  session_token VARCHAR(255) NULL,
  destination_zip_code VARCHAR(20) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  quote_payload JSON NOT NULL,
  selected_method_code VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  CONSTRAINT fk_shipping_quotes_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT fk_shipping_quotes_account FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS deliveries (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  store_id CHAR(36) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  method_code VARCHAR(100) NULL,
  method_name VARCHAR(255) NULL,
  status VARCHAR(100) NOT NULL DEFAULT 'pending',
  tracking_code VARCHAR(255) NULL,
  tracking_url TEXT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  external_reference VARCHAR(255) NULL,
  quoted_payload JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_deliveries_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_deliveries_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id CHAR(36) PRIMARY KEY,
  payment_id CHAR(36) NOT NULL,
  order_id CHAR(36) NOT NULL,
  store_id CHAR(36) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  transaction_type VARCHAR(100) NOT NULL,
  external_id VARCHAR(255) NULL,
  external_reference VARCHAR(255) NULL,
  status VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payload JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_transactions_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_transactions_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_transactions_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id CHAR(36) PRIMARY KEY,
  store_id CHAR(36) NULL,
  provider VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  external_id VARCHAR(255) NULL,
  payload JSON NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'received',
  error_message TEXT NULL,
  processed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_webhook_events_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  from_status VARCHAR(100) NULL,
  to_status VARCHAR(100) NULL,
  from_payment_status VARCHAR(100) NULL,
  to_payment_status VARCHAR(100) NULL,
  note TEXT NULL,
  created_by_type VARCHAR(50) NOT NULL DEFAULT 'system',
  user_id CHAR(36) NULL,
  customer_account_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_status_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_order_status_history_account FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS integration_logs (
  id CHAR(36) PRIMARY KEY,
  store_id CHAR(36) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  direction VARCHAR(20) NOT NULL,
  status VARCHAR(50) NOT NULL,
  summary VARCHAR(255) NULL,
  payload JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_integration_logs_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS integration_test_runs (
  id CHAR(36) PRIMARY KEY,
  store_id CHAR(36) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  integration_type ENUM('payment', 'shipping') NOT NULL,
  scenario VARCHAR(100) NOT NULL,
  status ENUM('running', 'passed', 'failed') NOT NULL DEFAULT 'running',
  request_payload JSON NULL,
  response_payload JSON NULL,
  error_message TEXT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME NULL,
  created_by_user_id CHAR(36) NULL,
  CONSTRAINT fk_integration_test_runs_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT fk_integration_test_runs_user FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_customer_accounts_store ON customer_accounts(store_id);
CREATE INDEX idx_customer_sessions_store ON customer_sessions(store_id);
CREATE INDEX idx_customer_addresses_account ON customer_addresses(customer_account_id);
CREATE INDEX idx_storefront_carts_store ON storefront_carts(store_id);
CREATE INDEX idx_shipping_quotes_store ON shipping_quotes(store_id);
CREATE INDEX idx_deliveries_order ON deliveries(order_id);
CREATE INDEX idx_payment_transactions_payment ON payment_transactions(payment_id);
CREATE INDEX idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX idx_integration_logs_store ON integration_logs(store_id);
CREATE INDEX idx_integration_test_runs_store ON integration_test_runs(store_id);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_account_id CHAR(36) NULL AFTER customer_id;

ALTER TABLE orders
  ADD CONSTRAINT fk_orders_customer_account
  FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE SET NULL;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS store_id CHAR(36) NULL AFTER company_id;

ALTER TABLE payments
  ADD CONSTRAINT fk_payments_store
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS visual_settings JSON NULL AFTER institutional_texts;

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS home_settings JSON NULL AFTER visual_settings;

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS campaign_settings JSON NULL AFTER home_settings;

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS footer_settings JSON NULL AFTER campaign_settings;

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS trust_badges JSON NULL AFTER footer_settings;

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS featured_brands JSON NULL AFTER trust_badges;

CREATE INDEX idx_orders_customer_account ON orders(customer_account_id);
CREATE INDEX idx_payments_store ON payments(store_id);
