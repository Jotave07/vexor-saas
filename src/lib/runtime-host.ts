const DEFAULT_APP_DOMAIN = "vexortech.cloud";
const RESERVED_SUBDOMAINS = new Set(["www", "api", "painel"]);

function currentHostname() {
  if (typeof window === "undefined") return "";
  return window.location.hostname.toLowerCase();
}

export function getAppDomain() {
  return (import.meta.env.VITE_APP_DOMAIN || DEFAULT_APP_DOMAIN).toLowerCase();
}

export function getTenantSlugFromHost() {
  const hostname = currentHostname();
  const appDomain = getAppDomain();

  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  if (hostname === appDomain) return null;
  if (!hostname.endsWith(`.${appDomain}`)) return null;

  const subdomain = hostname.slice(0, -(`.${appDomain}`).length).split(".")[0];
  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) return null;
  return subdomain;
}

export function resolveStoreSlug(routeSlug?: string) {
  return routeSlug || getTenantSlugFromHost() || "";
}

export function isTenantHostForSlug(slug?: string) {
  const tenantSlug = getTenantSlugFromHost();
  return Boolean(slug && tenantSlug && slug === tenantSlug);
}

export function buildStorePath(slug: string, suffix = "") {
  const normalizedSuffix = suffix || "/";
  if (isTenantHostForSlug(slug)) {
    return normalizedSuffix;
  }
  return `/shop/${slug}${normalizedSuffix === "/" ? "" : normalizedSuffix}`;
}
