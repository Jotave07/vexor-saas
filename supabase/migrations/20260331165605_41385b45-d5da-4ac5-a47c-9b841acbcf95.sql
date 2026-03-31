
-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('master_admin', 'company_admin', 'company_staff');
CREATE TYPE public.company_status AS ENUM ('active', 'trial', 'suspended', 'cancelled', 'defaulting');
CREATE TYPE public.subscription_status AS ENUM ('active', 'trial', 'expired', 'cancelled', 'suspended');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'overdue', 'failed', 'refunded');

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  company_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- USER ROLES
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER FUNCTIONS (avoid RLS recursion)
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = _user_id
$$;

-- ============================================
-- COMPANIES
-- ============================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  status company_status NOT NULL DEFAULT 'trial',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add FK for profiles.company_id
ALTER TABLE public.profiles ADD CONSTRAINT profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- ============================================
-- PLANS
-- ============================================
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_products INT DEFAULT 100,
  max_stores INT DEFAULT 1,
  max_users INT DEFAULT 3,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status subscription_status NOT NULL DEFAULT 'trial',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  due_date DATE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STORES
-- ============================================
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  domain TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  theme_colors JSONB DEFAULT '{"primary": "#000000", "secondary": "#ffffff"}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STORE SETTINGS
-- ============================================
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  checkout_settings JSONB DEFAULT '{}'::jsonb,
  shipping_settings JSONB DEFAULT '{}'::jsonb,
  payment_methods JSONB DEFAULT '[]'::jsonb,
  seo_settings JSONB DEFAULT '{}'::jsonb,
  policies JSONB DEFAULT '{}'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  institutional_texts JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  sku TEXT,
  barcode TEXT,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT DEFAULT 0,
  weight DECIMAL(8,3),
  dimensions JSONB,
  images JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PRODUCT VARIATIONS
-- ============================================
CREATE TABLE public.product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price DECIMAL(10,2),
  stock INT NOT NULL DEFAULT 0,
  attributes JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_product_variations_updated_at BEFORE UPDATE ON public.product_variations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- CUSTOMERS (buyers)
-- ============================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  addresses JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  order_number TEXT NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  shipping_address JSONB,
  shipping_info JSONB,
  coupon_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  variation_id UUID REFERENCES public.product_variations(id),
  product_name TEXT NOT NULL,
  variation_name TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COUPONS
-- ============================================
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_order_value DECIMAL(10,2),
  max_uses INT,
  uses_count INT NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- BANNERS
-- ============================================
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT DEFAULT 'home',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PAYMENT HISTORY (SaaS subscriptions)
-- ============================================
CREATE TABLE public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ACTIVITY LOGS
-- ============================================
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Master admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'master_admin'));
CREATE POLICY "Master admins can manage profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));

-- USER ROLES
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Master admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));

-- COMPANIES
CREATE POLICY "Master admins can manage companies" ON public.companies FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));
CREATE POLICY "Company users can view own company" ON public.companies FOR SELECT USING (id = public.get_user_company_id(auth.uid()));

-- PLANS
CREATE POLICY "Anyone authenticated can view active plans" ON public.plans FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Master admins can manage plans" ON public.plans FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));

-- SUBSCRIPTIONS
CREATE POLICY "Master admins can manage subscriptions" ON public.subscriptions FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));
CREATE POLICY "Company users can view own subscriptions" ON public.subscriptions FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));

-- STORES
CREATE POLICY "Master admins can manage stores" ON public.stores FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));
CREATE POLICY "Company users can view own stores" ON public.stores FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Company admins can update own stores" ON public.stores FOR UPDATE USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(), 'company_admin')));

-- STORE SETTINGS
CREATE POLICY "Master admins can manage store settings" ON public.store_settings FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));
CREATE POLICY "Company users can view own store settings" ON public.store_settings FOR SELECT USING (
  store_id IN (SELECT id FROM public.stores WHERE company_id = public.get_user_company_id(auth.uid()))
);
CREATE POLICY "Company admins can update own store settings" ON public.store_settings FOR UPDATE USING (
  store_id IN (SELECT id FROM public.stores WHERE company_id = public.get_user_company_id(auth.uid()))
  AND public.has_role(auth.uid(), 'company_admin')
);

-- CATEGORIES
CREATE POLICY "Master admins can manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));
CREATE POLICY "Company users can manage own categories" ON public.categories FOR ALL USING (
  store_id IN (SELECT id FROM public.stores WHERE company_id = public.get_user_company_id(auth.uid()))
);

-- PRODUCTS
CREATE POLICY "Master admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));
CREATE POLICY "Company users can manage own products" ON public.products FOR ALL USING (
  store_id IN (SELECT id FROM public.stores WHERE company_id = public.get_user_company_id(auth.uid()))
);

-- PRODUCT VARIATIONS
CREATE POLICY "Master admins can manage variations" ON public.product_variations FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));
CREATE POLICY "Company users can manage own variations" ON public.product_variations FOR ALL USING (
  product_id IN (SELECT p.id FROM public.products p JOIN public.stores s ON p.store_id = s.id WHERE s.company_id = public.get_user_company_id(auth.uid()))
);

-- CUSTOMERS
CREATE POLICY "Master admins can manage customers" ON public.customers FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));
CREATE POLICY "Company users can manage own customers" ON public.customers FOR ALL USING (
  store_id IN (SELECT id FROM public.stores WHERE company_id = public.get_user_company_id(auth.uid()))
);

-- ORDERS
CREATE POLICY "Master admins can manage orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));
CREATE POLICY "Company users can manage own orders" ON public.orders FOR ALL USING (
  store_id IN (SELECT id FROM public.stores WHERE company_id = public.get_user_company_id(auth.uid()))
);

-- ORDER ITEMS
CREATE POLICY "Master admins can manage order items" ON public.order_items FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));
CREATE POLICY "Company users can view own order items" ON public.order_items FOR SELECT USING (
  order_id IN (SELECT o.id FROM public.orders o JOIN public.stores s ON o.store_id = s.id WHERE s.company_id = public.get_user_company_id(auth.uid()))
);

-- COUPONS
CREATE POLICY "Master admins can manage coupons" ON public.coupons FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));
CREATE POLICY "Company users can manage own coupons" ON public.coupons FOR ALL USING (
  store_id IN (SELECT id FROM public.stores WHERE company_id = public.get_user_company_id(auth.uid()))
);

-- BANNERS
CREATE POLICY "Master admins can manage banners" ON public.banners FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));
CREATE POLICY "Company users can manage own banners" ON public.banners FOR ALL USING (
  store_id IN (SELECT id FROM public.stores WHERE company_id = public.get_user_company_id(auth.uid()))
);

-- PAYMENT HISTORY
CREATE POLICY "Master admins can manage payment history" ON public.payment_history FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));
CREATE POLICY "Company users can view own payment history" ON public.payment_history FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));

-- ACTIVITY LOGS
CREATE POLICY "Master admins can view all logs" ON public.activity_logs FOR SELECT USING (public.has_role(auth.uid(), 'master_admin'));
CREATE POLICY "Master admins can insert logs" ON public.activity_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'master_admin'));
CREATE POLICY "Company users can view own logs" ON public.activity_logs FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Authenticated users can insert logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Master admins can manage notifications" ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_company ON public.profiles(company_id);
CREATE INDEX idx_profiles_user ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_stores_company ON public.stores(company_id);
CREATE INDEX idx_products_store ON public.products(store_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_orders_store ON public.orders(store_id);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_categories_store ON public.categories(store_id);
CREATE INDEX idx_customers_store ON public.customers(store_id);
CREATE INDEX idx_coupons_store ON public.coupons(store_id);
CREATE INDEX idx_banners_store ON public.banners(store_id);
CREATE INDEX idx_subscriptions_company ON public.subscriptions(company_id);
CREATE INDEX idx_payment_history_company ON public.payment_history(company_id);
CREATE INDEX idx_activity_logs_company ON public.activity_logs(company_id);
CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
