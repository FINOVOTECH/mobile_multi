import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import { Platform } from "react-native";
import * as Config from "./Config";

const TENANT_BRANDING_CACHE_KEY = "tenant_branding_cache_v1";
const TENANT_ID_CACHE_KEY = "tenant_id_cache_v1";

const resolveLockedTenantId = () => {
  if (!Config?.useHybridApp) return "";
  return String(Config?.defaultTenantId || "")
    .trim()
    .toUpperCase();
};

const decodeJwtPayload = (token = "") => {
  try {
    const raw = String(token || "")
      .replace(/^Bearer\s+/i, "")
      .replace(/^"|"$/g, "");
    const parts = raw.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
};

export const getTenantIdFromToken = (token = "") => {
  const payload = decodeJwtPayload(token);
  return String(payload?.tenantId || "")
    .trim()
    .toUpperCase();
};

const normalizeColor = (value, fallback) => {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  const hexMatch = raw.match(/#[0-9a-fA-F]{6}/);
  return hexMatch ? hexMatch[0] : fallback;
};

export const applyTenantBrandingToRuntime = (branding = {}) => {
  const lockedTenantId = resolveLockedTenantId();
  const fallbackTenantId = String(
    Config?.RuntimeTenant?.tenantId || Config?.defaultTenantId || ""
  )
    .trim()
    .toUpperCase();
  const incomingTenantId = String(branding?.tenantId || "")
    .trim()
    .toUpperCase();

  const primary = normalizeColor(branding.primaryColor, Config.Colors.primary);
  const secondary = normalizeColor(
    branding.secondaryColor,
    Config.Colors.secondary
  );
  const accent = normalizeColor(branding.accentColor, Config.Colors.secondary);
  const bg = normalizeColor(branding.loginBgColor, Config.Colors.cyan_blue);

  Config.Colors.primary = primary;
  Config.Colors.secondary = secondary;
  Config.Colors.cyan_blue = bg;
  Config.Colors.bottomColor = primary;
  Config.Colors.bottomTabColor = primary;
  Config.Colors.textColor.textColor_7 = primary;

  // Never blank tenantId from partial branding payloads; keep active tenant context stable.
  Config.RuntimeTenant.tenantId =
    lockedTenantId || incomingTenantId || fallbackTenantId;
  Config.RuntimeTenant.appName = String(branding.appName || "");
  Config.RuntimeTenant.brokerName = String(branding.brokerName || "");
  Config.RuntimeTenant.brokerUrl = String(branding.brokerUrl || "");
  Config.RuntimeTenant.logoUrl = String(
    branding.logoUrl || branding.brandLogoUrl || branding.finovoLogo || ""
  );
  Config.RuntimeTenant.exchangePreference = String(
    branding.exchangePreference || "BOTH"
  ).toUpperCase();
  Config.RuntimeTenant.availableExchanges =
    Array.isArray(branding.availableExchanges) &&
    branding.availableExchanges.length
      ? branding.availableExchanges
      : ["BSE", "NSE", "ALL"];
  Config.RuntimeTenant.preferredExchange = String(
    branding.preferredExchange || "BSE"
  ).toUpperCase();
  Config.RuntimeTenant.primaryColor = primary;
  Config.RuntimeTenant.secondaryColor = secondary;
  Config.RuntimeTenant.accentColor = accent;
  Config.RuntimeTenant.mobileAppConfig = branding.mobileAppConfig || {};
  Config.RuntimeTenant.mobileAccess = {
    enableClientLogin: branding?.mobileAppConfig?.enableClientLogin !== false,
    enableEmployeeLogin:
      branding?.mobileAppConfig?.enableEmployeeLogin !== false,
    enableTenantAdminLogin:
      branding?.mobileAppConfig?.enableTenantAdminLogin !== false,
  };

  // Override runtime URLs from mobileAppConfig if configured
  const mobCfg = branding.mobileAppConfig || {};
  const exportEnv = String(mobCfg.exportEnvironment || "").toUpperCase();
  const apiOverride = exportEnv === "LOCAL"
    ? (mobCfg.localBackendBaseUrl || mobCfg.liveBackendBaseUrl)
    : (mobCfg.liveBackendBaseUrl || mobCfg.localBackendBaseUrl);
  const webOverride = exportEnv === "LOCAL"
    ? (mobCfg.localFrontendUrlTemplate || mobCfg.liveFrontendUrlTemplate)
    : (mobCfg.liveFrontendUrlTemplate || mobCfg.localFrontendUrlTemplate);
  if (apiOverride || webOverride) {
    Config.setRuntimeUrls({
      apiBaseUrl: apiOverride || "",
      webHostTemplate: webOverride || "",
    });
  }
};

export const fetchAndCacheTenantBranding = async (tenantId) => {
  const key = String(tenantId || "")
    .trim()
    .toUpperCase();
  if (!key) return null;

  const normalizeBase = (value = "") =>
    String(value || "")
      .trim()
      .replace(/\/+$/, "");

  // Config.baseUrl is already resolved correctly for each device type
  // (emulator → 10.0.2.2:8000, physical device → 192.168.x.x:8000 or localhost, prod → https://…)
  // Try it first so physical devices don't waste time on 10.0.2.2 which only works for emulators.
  const localHost = Platform.OS === "android" ? "10.0.2.2" : "localhost";
  const baseCandidates = [
    Config.getBaseUrl() || "",
    Config.tenantBrandingBaseUrl || Config.baseUrl || "",
    __DEV__ ? `http://${localHost}:8000` : "",
    __DEV__ ? "http://127.0.0.1:8000" : "",
  ]
    .map(normalizeBase)
    .filter(Boolean);

  const dedup = [];
  for (const base of baseCandidates) {
    if (!dedup.includes(base)) dedup.push(base);
  }

  const urls = dedup.map((base) => `${base}/api/v1/tenant/${key}/branding`);
  let lastError = "Failed to load tenant branding";

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const raw = await response.text();
      let json = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch (_) {
        json = null;
      }

      if (response.ok && json?.success && json?.branding) {
        const brandingPayload = {
          ...json.branding,
          tenantId: key,
        };
        // Apply immediately, persist in background
        applyTenantBrandingToRuntime(brandingPayload);
        AsyncStorage.multiSet([
          [TENANT_ID_CACHE_KEY, key],
          [TENANT_BRANDING_CACHE_KEY, JSON.stringify(brandingPayload)],
        ]).catch(() => {});
        return brandingPayload;
      }

      const msg = json?.message || raw || `HTTP ${response.status}`;
      lastError = String(msg).slice(0, 180);
    } catch (err) {
      lastError = err?.message || "Network error while loading tenant branding";
    }
  }

  throw new Error(lastError || "Failed to load tenant branding");
};

export const bootstrapTenantBranding = async (options = {}) => {
  const skipNetwork = options?.skipNetwork === true;
  const lockedTenantId = resolveLockedTenantId();
  try {
    const cachedRaw = await AsyncStorage.getItem(TENANT_BRANDING_CACHE_KEY);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      const cachedTenantId = String(cached?.tenantId || "")
        .trim()
        .toUpperCase();
      const shouldUseCache =
        !lockedTenantId || cachedTenantId === lockedTenantId;
      if (shouldUseCache) {
        applyTenantBrandingToRuntime(cached);
      }
    }
  } catch (_) {
    // no-op
  }

  if (skipNetwork) return null;

  try {
    // Read both storage keys in parallel
    const [[, tokenVal], [, cacheVal]] = await AsyncStorage.multiGet([
      Config.store_key_login_details,
      TENANT_ID_CACHE_KEY,
    ]);
    const fromToken = getTenantIdFromToken(tokenVal);
    const fromCache = String(cacheVal || "").trim().toUpperCase();
    const fallbackTenant = String(Config?.defaultTenantId || "")
      .trim()
      .toUpperCase();
    const tenantId = lockedTenantId || fromToken || fromCache || fallbackTenant;
    if (!tenantId) return null;
    try {
      return await fetchAndCacheTenantBranding(tenantId);
    } catch (_) {
      if (fallbackTenant && fallbackTenant !== tenantId) {
        return await fetchAndCacheTenantBranding(fallbackTenant);
      }
      return null;
    }
  } catch (_) {
    return null;
  }
};

export const refreshTenantBrandingForToken = async (token) => {
  const tenantId = getTenantIdFromToken(token);
  if (!tenantId) return null;
  return fetchAndCacheTenantBranding(tenantId);
};
