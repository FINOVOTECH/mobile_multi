import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Alert,
  BackHandler,
  Modal,
  Platform,
  Switch,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ReactNativeBiometrics from "react-native-biometrics";
import * as Config from "../../../helpers/Config";

const rnBiometrics = new ReactNativeBiometrics({
  allowDeviceCredentials: true,
});
const BIOMETRIC_LOGIN_STORAGE_KEY = "mobile.biometric.quickLogin.v1";
const TENANT_ID_CACHE_KEY = "tenant_id_cache_v1";

const MOBILE_VIEWPORT_FIX_SCRIPT = `
  (function () {
    try {
      var applyViewportFix = function () {
        var docEl = document.documentElement;
        var body = document.body;
        if (docEl) {
          docEl.classList.add("rn-webview");
          docEl.style.maxWidth = "100%";
          docEl.style.overflowX = "hidden";
        }
        if (body) {
          body.classList.add("rn-webview");
          body.style.maxWidth = "100%";
          body.style.overflowX = "hidden";
        }

        /* Only compute safe-bottom from visualViewport if native didn't already inject it.
           buildNativeConfigScript sets --rn-safe-bottom with accurate native insets. */
        var nativeInjected = window.__RN_HYBRID_CONFIG__ && window.__RN_HYBRID_CONFIG__.isHybridApp;
        if (!nativeInjected) {
          var vv = window.visualViewport;
          var safeBottom = 0;
          if (vv && typeof vv.height === "number") {
            safeBottom = Math.max(
              0,
              Math.round(window.innerHeight - vv.height - (vv.offsetTop || 0))
            );
          }
          if (docEl) {
            docEl.style.setProperty("--rn-safe-bottom", safeBottom + "px");
          }
        }
      };

      if (document.documentElement) {
        document.documentElement.classList.add("rn-webview");
      }
      if (document.body) {
        document.body.classList.add("rn-webview");
      }

      var head = document.head || document.getElementsByTagName("head")[0];
      if (head) {
        var meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
          meta = document.createElement("meta");
          meta.setAttribute("name", "viewport");
          head.appendChild(meta);
        }
        meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover");

        var style = document.getElementById("__rn_mobile_fit_fix__");
        if (!style) {
          style = document.createElement("style");
          style.id = "__rn_mobile_fit_fix__";
          head.appendChild(style);
        }
        style.innerHTML = [
          "html, body, #root { max-width: 100% !important; overflow-x: hidden !important; }",
          "*, *::before, *::after { box-sizing: border-box; }",
          "img, svg, video, canvas, iframe { max-width: 100% !important; height: auto !important; }",
          "input, select, textarea, button { max-width: 100% !important; }",
          /* Prevent native-browser "feel" — no tap flash, no callout menu */
          "*, *::before, *::after { -webkit-tap-highlight-color: transparent !important; -webkit-touch-callout: none !important; }",
          /* Re-enable callout on form controls */
          "input, textarea, select, [contenteditable] { -webkit-touch-callout: default !important; }",
          /* Disable the grey flash on Android when tapping links/buttons */
          "a, button, [role='button'], [tabindex] { -webkit-tap-highlight-color: transparent !important; outline: none !important; }",
          "html.rn-webview .app-route-scroll { padding-bottom: calc(max(env(safe-area-inset-bottom, 0px), var(--rn-safe-bottom, 0px)) + 62px) !important; }",
          "html.rn-webview .mobile-profile-dropdown { position: fixed !important; top: 40px !important; right: 8px !important; left: auto !important; max-width: calc(100vw - 16px) !important; z-index: 999 !important; }",
          "html.rn-webview .mobile-notification-dropdown { position: fixed !important; top: 40px !important; right: 8px !important; left: auto !important; max-width: calc(100vw - 16px) !important; z-index: 999 !important; }"
        ].join(" ");
      }

      applyViewportFix();
      var schedule = function () {
        setTimeout(applyViewportFix, 60);
      };
      window.addEventListener("resize", schedule, { passive: true });
      window.addEventListener("orientationchange", schedule, { passive: true });
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", schedule);
        window.visualViewport.addEventListener("scroll", schedule);
      }
      setTimeout(applyViewportFix, 240);
    } catch (e) {}
  })();
  true;
`;

/**
 * Build a script that exposes native config to the web page before any page JS runs.
 * The web frontend reads window.__RN_HYBRID_CONFIG__ to get the correct API base URL
 * and tenant ID, avoiding fragile hostname-based auto-detection.
 * It also injects accurate safe-area CSS variables using values from react-native-safe-area-context
 * so the web's bottom nav and scroll padding are correct on every device.
 */
const buildNativeConfigScript = (apiBaseUrl, tenantId, safeAreaBottom, safeAreaTop, biometricInfo = {}) => {
  const cfg = JSON.stringify({
    apiBaseUrl: String(apiBaseUrl || "").replace(/\/+$/, ""),
    tenantId: String(tenantId || "").toLowerCase(),
    isHybridApp: true,
    biometricAvailable: !!biometricInfo.available,
    biometricType: String(biometricInfo.type || ""),
    biometricEnabled: !!biometricInfo.enabled,
  });
  const bottom = Math.round(Number(safeAreaBottom) || 0);
  const top = Math.round(Number(safeAreaTop) || 0);
  return `(function(){try{window.__RN_HYBRID_CONFIG__=${cfg};window.__RN_TENANT_ID__=String((window.__RN_HYBRID_CONFIG__&&window.__RN_HYBRID_CONFIG__.tenantId)||'').toUpperCase();var r=document.documentElement;r.style.setProperty('--rn-safe-bottom','${bottom}px');r.style.setProperty('--rn-safe-top','${top}px');try{var t=String((window.__RN_HYBRID_CONFIG__&&window.__RN_HYBRID_CONFIG__.tenantId)||'').trim().toUpperCase();if(t){localStorage.setItem('__active_tenant_slug__',t);sessionStorage.setItem('__active_tenant_slug__',t);localStorage.setItem('tenantSlug',t);localStorage.setItem('tenantId',t);var u=new URL(window.location.href);var q=String(u.searchParams.get('tenant')||u.searchParams.get('tenantId')||'').trim().toUpperCase();if(!q){u.searchParams.set('tenant',t.toLowerCase());history.replaceState(null,'',u.toString());}}}catch(_){}}catch(e){}})();true;`;
};

const normalizeBaseUrl = (value = "") => {
  let raw = String(value || "").trim();
  if (!raw) return "";
  if (
    !/^https?:\/\//i.test(raw) &&
    /[a-z0-9.-]+\.[a-z]{2,}(:\d+)?/i.test(raw)
  ) {
    raw = `http://${raw}`;
  }
  try {
    const parsed = new URL(raw);
    return `${parsed.protocol}//${parsed.host}`;
  } catch (_) {
    return raw.replace(/\/+$/, "");
  }
};

const deriveLocalWebBaseFromBackend = (backendBase = "") => {
  const normalized = normalizeBaseUrl(backendBase);
  if (!normalized) return "";
  try {
    const parsed = new URL(normalized);
    const currentPort = String(parsed.port || "");
    if (currentPort === "8000") parsed.port = "5174";
    else if (!currentPort) parsed.port = "5174";
    return `${parsed.protocol}//${parsed.host}`;
  } catch (_) {
    return normalized.replace(":8000", ":5174").replace(/\/+$/, "");
  }
};

const isLocalDevHost = (value = "") => {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return false;
  return (
    raw.includes("localhost") ||
    raw.includes("127.0.0.1") ||
    raw.includes("10.0.2.2") ||
    raw.includes("192.168.") ||
    raw.includes("172.16.") ||
    raw.includes("172.17.") ||
    raw.includes("172.18.") ||
    raw.includes("172.19.") ||
    raw.includes("172.2") ||
    raw.includes("172.30.") ||
    raw.includes("172.31.") ||
    raw.includes("http://10.") ||
    raw.includes("https://10.")
  );
};

const withTenantQuery = (base = "", tenant = "", path = "/") => {
  const t = String(tenant || "")
    .trim()
    .toLowerCase();
  if (!base || !t) return "";
  const p = path.startsWith("/") ? path : `/${path}`;
  const baseWithPath = /\/$/.test(base) ? base.slice(0, -1) : base;
  const url = `${baseWithPath}${p === "/" ? "" : p}`;
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}tenant=${encodeURIComponent(t)}`;
};

const ensureTenantQuery = (rawUrl = "", tenant = "") => {
  const value = String(rawUrl || "").trim();
  const t = String(tenant || "")
    .trim()
    .toLowerCase();
  if (!value || !t) return value;
  try {
    const parsed = new URL(value);
    const current = String(parsed.searchParams.get("tenant") || "")
      .trim()
      .toLowerCase();
    if (current !== t) parsed.searchParams.set("tenant", t);
    return parsed.toString();
  } catch (_) {
    if (/([?&])tenant=/i.test(value)) {
      return value.replace(/([?&])tenant=[^&]*/i, `$1tenant=${encodeURIComponent(t)}`);
    }
    const joiner = value.includes("?") ? "&" : "?";
    return `${value}${joiner}tenant=${encodeURIComponent(t)}`;
  }
};

const normalizeAndroidLocalhostSubdomain = (base = "") => {
  const raw = String(base || "").trim();
  if (!raw || Platform.OS !== "android") return raw;
  try {
    const parsed = new URL(raw);
    if (parsed.hostname && parsed.hostname.endsWith(".localhost")) {
      parsed.hostname = "localhost";
      return `${parsed.protocol}//${parsed.host}`;
    }
    return raw;
  } catch (_) {
    return raw.replace(/^https?:\/\/[^/]*\.localhost(?::\d+)?/i, (m) => {
      const protocol = m.startsWith("https://") ? "https://" : "http://";
      const portMatch = m.match(/:(\d+)$/);
      return `${protocol}localhost${portMatch ? `:${portMatch[1]}` : ""}`;
    });
  }
};

const applyTenantTemplate = (template = "", tenant = "") => {
  const raw = String(template || "").trim();
  const t = String(tenant || "")
    .trim()
    .toLowerCase();
  if (!raw || !t) return raw;
  return raw
    .replace(/\{tenant\}/gi, t)
    .replace(/\$\{tenant\}/gi, t)
    .replace(/:tenant\b/gi, t)
    .replace(/undefined/gi, t);
};

const toTenantUrl = (tenantId = "", path = "/") => {
  const t = String(tenantId || "")
    .trim()
    .toLowerCase();
  if (!t) return "";
  const mobileCfg = Config?.RuntimeTenant?.mobileAppConfig || {};
  const exportEnv =
    String(mobileCfg.exportEnvironment || "").toUpperCase() === "LOCAL"
      ? "LOCAL"
      : "LIVE";
  const localBackendBase = String(mobileCfg.localBackendBaseUrl || "").trim();
  const localWebBase = deriveLocalWebBaseFromBackend(localBackendBase);
  const localTemplate = String(mobileCfg.localFrontendUrlTemplate || "").trim();
  const liveTemplate = String(mobileCfg.liveFrontendUrlTemplate || "").trim();
  const localTemplateBase = normalizeBaseUrl(
    applyTenantTemplate(localTemplate, t)
  );
  const liveTemplateBase = normalizeBaseUrl(
    applyTenantTemplate(liveTemplate, t)
  );
  const rawBroker = String(Config?.RuntimeTenant?.brokerUrl || "").trim();
  const brokerBase = normalizeBaseUrl(rawBroker);
  const rawTemplate = String(Config.getHybridWebHostTemplate() || Config.hybridWebHostTemplate || "").trim();
  const templateBase = applyTenantTemplate(rawTemplate, t);
  const normalizedTemplateBase = normalizeBaseUrl(templateBase);

  let base = "";
  if (exportEnv === "LOCAL") {
    if (localTemplateBase) {
      base = localTemplateBase;
    } else if (brokerBase && isLocalDevHost(brokerBase)) {
      base = brokerBase;
    } else if (
      normalizedTemplateBase &&
      isLocalDevHost(normalizedTemplateBase)
    ) {
      base = normalizedTemplateBase;
    } else if (localWebBase) {
      base = localWebBase;
    } else if (brokerBase) {
      base = brokerBase;
    } else {
      base = normalizedTemplateBase;
    }
  } else if (liveTemplateBase) {
    base = liveTemplateBase;
  } else if (brokerBase) {
    base = brokerBase;
  } else {
    base = normalizedTemplateBase;
  }

  base = normalizeAndroidLocalhostSubdomain(base);
  const launchUrl = withTenantQuery(base, t, path);
  return normalizeLaunchUrlForDevice(ensureTenantQuery(launchUrl, t));
};

const normalizeLaunchUrlForDevice = (rawUrl = "") => {
  const value = String(rawUrl || "").trim();
  if (!value) return value;
  if (Platform.OS !== "android") return value;

  const constants = Platform.constants || {};
  const model = String(constants.Model || constants.model || "").toLowerCase();
  const brand = String(constants.Brand || constants.brand || "").toLowerCase();
  const device = String(
    constants.Device || constants.device || ""
  ).toLowerCase();
  const fingerprint = String(
    constants.Fingerprint || constants.fingerprint || ""
  ).toLowerCase();
  const isLikelyEmulator =
    model.includes("sdk") ||
    model.includes("emulator") ||
    device.includes("emulator") ||
    brand.includes("generic") ||
    fingerprint.includes("generic") ||
    fingerprint.includes("vbox");

  const lanIp = String(Config.getBaseUrl() || Config.baseUrl || "")
    .replace(/^https?:\/\//, "")
    .replace(/:\d+.*$/, "");
  const physicalHost = lanIp && /^\d+\.\d+\.\d+\.\d+$/.test(lanIp)
    ? lanIp
    : "localhost";

  let normalized = value;
  if (isLikelyEmulator) {
    normalized = normalized
      .replace("http://localhost:", "http://10.0.2.2:")
      .replace("http://127.0.0.1:", "http://10.0.2.2:");
  } else {
    // Physical device — resolve to the dev machine's LAN IP so the phone can reach it over WiFi.
    normalized = normalized
      .replace("http://10.0.2.2:", `http://${physicalHost}:`)
      .replace("http://127.0.0.1:", `http://${physicalHost}:`)
      .replace("http://localhost:", `http://${physicalHost}:`);
  }

  normalized = normalized.replace(/:\/\/[^/.]+\.localhost(?::\d+)?/i, (m) => {
    const port = (m.match(/:(\d+)$/) || [])[1];
    const host = isLikelyEmulator ? "10.0.2.2" : physicalHost;
    return `://${host}${port ? `:${port}` : ""}`;
  });
  return normalized;
};

const resolveTenantApiBaseForAuth = () => {
  const mobileCfg = Config?.RuntimeTenant?.mobileAppConfig || {};
  const exportEnv =
    String(mobileCfg.exportEnvironment || "").toUpperCase() === "LOCAL"
      ? "LOCAL"
      : "LIVE";
  const localApiBase = normalizeBaseUrl(mobileCfg.localBackendBaseUrl || "");
  const liveApiBase = normalizeBaseUrl(mobileCfg.liveBackendBaseUrl || "");
  const configuredBase =
    exportEnv === "LOCAL"
      ? localApiBase || liveApiBase
      : liveApiBase || localApiBase;
  const fallbackBase = normalizeBaseUrl(Config.getBaseUrl() || Config.baseUrl || "");
  const selected = configuredBase || fallbackBase;
  return normalizeLaunchUrlForDevice(selected);
};

const isLikelyPostLoginUrl = (rawUrl = "") => {
  const url = String(rawUrl || "").toLowerCase();
  if (!url || url === "about:blank") return false;
  return [
    "/dashboard",
    "/home",
    "/portfolio",
    "/invest",
    "/orders",
    "/bank",
    "/profile",
    "/account",
    "/more",
  ].some((token) => url.includes(token));
};

const ROLE_LABEL = {
  TENANT_ADMIN: "Broker",
  EMPLOYEE: "Employee",
  CLIENT: "Client",
};

const normalizeBiometricTypeLabel = (type = "") => {
  const t = String(type || "").toUpperCase();
  if (t.includes("FACE")) return "Face ID";
  if (t.includes("TOUCH")) return "Touch ID";
  if (t.includes("FINGER")) return "Fingerprint";
  if (t.includes("BIOMETRICS")) return "Biometrics";
  return "Biometrics";
};

const parseBiometricStore = (raw = "") => {
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
};

const parseJsonSafely = (raw = "") => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

const buildApiErrorMessage = ({
  fallback = "Request failed",
  status = 0,
  data = null,
  raw = "",
}) => {
  const fromData = String(data?.message || data?.error || "").trim();
  const fromRaw = String(raw || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  const message = fromData || fromRaw || fallback;
  return status ? `[${status}] ${message}` : message;
};

export default function HybridWeb() {
  const webRef = useRef(null);
  const [persistedTenantCode, setPersistedTenantCode] = useState("");
  const buildTenantCode = String(Config?.defaultTenantId || "")
    .trim()
    .toUpperCase();
  const runtimeTenantCode = String(Config?.RuntimeTenant?.tenantId || "")
    .trim()
    .toUpperCase();
  const lockedTenantCode =
    buildTenantCode || runtimeTenantCode || persistedTenantCode;
  const tenantLockEnabled = !!lockedTenantCode;
  const initialTenantCode = lockedTenantCode;
  const initialTenantUrl =
    toTenantUrl(initialTenantCode) || "about:blank";
  const [tenantInput, setTenantInput] = useState(initialTenantCode);
  const [roleMode, setRoleMode] = useState("CLIENT");
  const [showAuthModal, setShowAuthModal] = useState(!initialTenantCode);
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [authStep, setAuthStep] = useState("CREDENTIALS");
  const [authBusy, setAuthBusy] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(initialTenantUrl !== "about:blank");
  const [error, setError] = useState("");
  const [currentUrl, setCurrentUrl] = useState(initialTenantUrl);
  const [showStaffCTA, setShowStaffCTA] = useState(true);
  const [clientSessionStarted, setClientSessionStarted] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [biometricSession, setBiometricSession] = useState(null);
  const [enableBiometricLogin, setEnableBiometricLogin] = useState(true);
  const appStateRef = useRef(AppState.currentState);
  const forceClientOnly = Config?.hybridClientOnlyApp === true;
  const mobileAccess = Config?.RuntimeTenant?.mobileAccess || {};
  const canClientLogin = true;
  const canTenantAdminLogin =
    !forceClientOnly && mobileAccess?.enableTenantAdminLogin !== false;
  const canEmployeeLogin =
    !forceClientOnly && mobileAccess?.enableEmployeeLogin !== false;

  const tenantCode = (tenantLockEnabled ? lockedTenantCode : runtimeTenantCode)
    .trim()
    .toUpperCase();
  const hasTenant = !!tenantCode;
  const url = useMemo(() => toTenantUrl(tenantCode), [tenantCode]);

  // Get accurate native safe area insets (e.g. Android gesture bar, iPhone notch).
  // We inject these into the WebView as CSS variables so the web layout handles
  // bottom nav spacing and header spacing correctly on every device model.
  const { bottom: safeAreaBottom, top: safeAreaTop } = useSafeAreaInsets();

  // Inject native config + safe area into the WebView BEFORE any page JS runs.
  // - apiBaseUrl: fixes "Invalid Broker" — web uses this instead of guessing from hostname
  // - --rn-safe-bottom / --rn-safe-top: web CSS uses these for nav spacing
  // Track whether client biometric quick-login is enabled for this tenant
  const [clientBiometricEnabled, setClientBiometricEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(BIOMETRIC_LOGIN_STORAGE_KEY);
        const parsed = parseBiometricStore(raw);
        const nextTenant = resolveTenantCode();
        const entry = parsed?.[nextTenant];
        setClientBiometricEnabled(
          !!entry?.biometricLoginToken && entry?.role === "CLIENT"
        );
      } catch (_) {}
    })();
  }, []);

  const injectedBootstrapScript = useMemo(() => {
    const apiBase = resolveTenantApiBaseForAuth();
    const tid = tenantCode.toLowerCase();
    return (
      buildNativeConfigScript(apiBase, tid, safeAreaBottom, safeAreaTop, {
        available: biometricAvailable,
        type: biometricType,
        enabled: clientBiometricEnabled,
      }) +
      "\n" +
      MOBILE_VIEWPORT_FIX_SCRIPT
    );
  }, [tenantCode, safeAreaBottom, safeAreaTop, biometricAvailable, biometricType, clientBiometricEnabled]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cachedTenant = String(
          (await AsyncStorage.getItem(TENANT_ID_CACHE_KEY)) || ""
        )
          .trim()
          .toUpperCase();
        if (!active || !cachedTenant) return;
        setPersistedTenantCode(cachedTenant);
        if (!String(Config?.RuntimeTenant?.tenantId || "").trim()) {
          Config.RuntimeTenant.tenantId = cachedTenant;
        }
        setTenantInput((prev) => prev || cachedTenant);
      } catch (_) {
        // no-op
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!lockedTenantCode) return;
    setShowAuthModal(false);
  }, [lockedTenantCode]);

  useEffect(() => {
    if (!forceClientOnly) return;
    if (roleMode !== "CLIENT") setRoleMode("CLIENT");
    setShowStaffCTA(false);
  }, [forceClientOnly, roleMode]);

  useEffect(() => {
    if (!tenantLockEnabled) return;
    if (!lockedTenantCode) return;
    if (
      String(Config?.RuntimeTenant?.tenantId || "")
        .trim()
        .toUpperCase() !== lockedTenantCode
    ) {
      Config.RuntimeTenant.tenantId = lockedTenantCode;
    }
    setTenantInput(lockedTenantCode);
    setCurrentUrl((prev) => {
      const nextUrl = toTenantUrl(lockedTenantCode) || "about:blank";
      const marker = `tenant=${String(lockedTenantCode || "").toLowerCase()}`;
      if (!prev || prev === "about:blank") return nextUrl;
      return String(prev).toLowerCase().includes(marker) ? prev : nextUrl;
    });
  }, [tenantLockEnabled, lockedTenantCode]);

  const resolveTenantCode = () => {
    if (tenantLockEnabled && lockedTenantCode) return lockedTenantCode;
    const runtime = String(Config?.RuntimeTenant?.tenantId || "")
      .trim()
      .toUpperCase();
    if (runtime) return runtime;
    const fromInput = String(tenantInput || "")
      .trim()
      .toUpperCase();
    if (fromInput) return fromInput;
    const fallback = String(Config?.defaultTenantId || "")
      .trim()
      .toUpperCase();
    return fallback;
  };

  const resolveBiometricLabel = () =>
    normalizeBiometricTypeLabel(biometricType);

  const upsertBiometricSession = async (tenantId, payload) => {
    const tenantKey = String(tenantId || "")
      .trim()
      .toUpperCase();
    if (!tenantKey) return;
    const raw = await AsyncStorage.getItem(BIOMETRIC_LOGIN_STORAGE_KEY);
    const parsed = parseBiometricStore(raw);
    parsed[tenantKey] = {
      tenantId: tenantKey,
      role: String(payload?.role || "").toUpperCase(),
      identity: String(payload?.identity || "").trim(),
      biometricLoginToken: String(payload?.biometricLoginToken || "").trim(),
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(
      BIOMETRIC_LOGIN_STORAGE_KEY,
      JSON.stringify(parsed)
    );
    setBiometricSession(parsed[tenantKey]);
  };

  const removeBiometricSession = async (tenantId) => {
    const tenantKey = String(tenantId || "")
      .trim()
      .toUpperCase();
    if (!tenantKey) return;
    const raw = await AsyncStorage.getItem(BIOMETRIC_LOGIN_STORAGE_KEY);
    const parsed = parseBiometricStore(raw);
    if (parsed[tenantKey]) {
      delete parsed[tenantKey];
      await AsyncStorage.setItem(
        BIOMETRIC_LOGIN_STORAGE_KEY,
        JSON.stringify(parsed)
      );
    }
    setBiometricSession(null);
  };

  const hydrateBiometricSession = async (tenantId) => {
    const tenantKey = String(tenantId || "")
      .trim()
      .toUpperCase();
    if (!tenantKey) {
      setBiometricSession(null);
      return;
    }
    const raw = await AsyncStorage.getItem(BIOMETRIC_LOGIN_STORAGE_KEY);
    const parsed = parseBiometricStore(raw);
    setBiometricSession(parsed?.[tenantKey] || null);
  };

  const applyLaunchUrl = ({ role, launchUrl }) => {
    const normalizedRole = String(role || roleMode || "CLIENT").toUpperCase();
    const activeTenant = resolveTenantCode();
    const normalizedLaunch = normalizeLaunchUrlForDevice(
      String(launchUrl || "")
    );
    const nextUrl =
      normalizedRole === "CLIENT"
        ? ensureTenantQuery(normalizedLaunch, activeTenant)
        : normalizedLaunch;

    setRoleMode(normalizedRole);
    if (activeTenant) {
      Config.RuntimeTenant.tenantId = activeTenant;
      setTenantInput(activeTenant);
    }
    setCurrentUrl(nextUrl);
    setLoading(true);
    setShowAuthModal(false);
    if (normalizedRole === "CLIENT") {
      setShowStaffCTA(false);
      setClientSessionStarted(true);
    } else {
      setShowStaffCTA(false);
      setClientSessionStarted(false);
    }
  };

  useEffect(() => {
    const nextUrl = url || "about:blank";
    const freshUrl = nextUrl;
    setCurrentUrl((prev) => (prev === freshUrl ? prev : freshUrl));
    if (nextUrl !== "about:blank") {
      setLoading(true);
    }
  }, [url]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const info = await rnBiometrics.isSensorAvailable();
        if (!active) return;
        const available = !!info?.available;
        setBiometricAvailable(available);
        setBiometricType(String(info?.biometryType || ""));
        if (!available) {
          setBiometricSession(null);
          return;
        }
        const nextTenant = resolveTenantCode();
        await hydrateBiometricSession(nextTenant);
      } catch (_) {
        if (!active) return;
        setBiometricAvailable(false);
        setBiometricType("");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!biometricAvailable) return;
    const nextTenant = resolveTenantCode();
    hydrateBiometricSession(nextTenant).catch(() => {});
  }, [
    biometricAvailable,
    tenantInput,
    runtimeTenantCode,
    lockedTenantCode,
    tenantLockEnabled,
  ]);

  useEffect(() => {
    if (clientSessionStarted) {
      setShowStaffCTA(false);
      return;
    }
    if (!showAuthModal && hasTenant && roleMode === "CLIENT") {
      setShowStaffCTA(true);
    }
  }, [clientSessionStarted, hasTenant, roleMode, showAuthModal]);

  useFocusEffect(
    React.useCallback(() => {
      const onBack = () => {
        if (canGoBack && webRef.current) {
          webRef.current.goBack();
          return true;
        }
        return false;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => sub.remove();
    }, [canGoBack])
  );

  const applyTenant = () => {
    const next = resolveTenantCode();
    if (!next) return;
    Config.RuntimeTenant.tenantId = next;
    setTenantInput(next);
    setCurrentUrl(toTenantUrl(next));
    setError("");
    setLoading(true);
    if (roleMode === "CLIENT") {
      setShowAuthModal(false);
      setShowStaffCTA(false);
      setClientSessionStarted(true);
    }
  };

  const switchToRole = (nextRole = "CLIENT") => {
    const role = String(nextRole || "CLIENT").toUpperCase();
    if (forceClientOnly && role !== "CLIENT") return;
    setRoleMode(role);
    setAuthStep("CREDENTIALS");
    setOtp("");
    setIdentity("");
    setPassword("");
    setError("");

    if (role === "CLIENT") {
      const nextTenant = String(Config?.RuntimeTenant?.tenantId || "")
        .trim()
        .toUpperCase();
      if (nextTenant) {
        setCurrentUrl(toTenantUrl(nextTenant, "/"));
        setLoading(true);
      }
      return;
    }

    setCurrentUrl("about:blank");
    setLoading(false);
  };

  const sendOtpForRole = async () => {
    const nextTenant = resolveTenantCode();
    if (!nextTenant) {
      setError("Tenant not selected.");
      return;
    }
    Config.RuntimeTenant.tenantId = nextTenant;
    setTenantInput(nextTenant);
    if (roleMode !== "CLIENT" && (!identity || !password)) {
      setError("Identity and password are required.");
      return;
    }

    try {
      setAuthBusy(true);
      setError("");
      const reqUrl = `${resolveTenantApiBaseForAuth()}/api/v1/tenant/${encodeURIComponent(
        nextTenant
      )}/mobile-webview-auth/send-otp`;
      const res = await fetch(reqUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleMode, identity, password }),
      });
      const raw = await res.text();
      const data = parseJsonSafely(raw);
      if (!res.ok || !data?.success) {
        throw new Error(
          buildApiErrorMessage({
            fallback: "Failed to send OTP",
            status: res.status,
            data,
            raw,
          })
        );
      }
      if (data?.launchUrl) {
        applyLaunchUrl({ role: roleMode, launchUrl: data.launchUrl });
        if (
          biometricAvailable &&
          enableBiometricLogin &&
          data?.biometricLoginToken
        ) {
          await upsertBiometricSession(nextTenant, {
            role: roleMode,
            identity,
            biometricLoginToken: data.biometricLoginToken,
          });
        }
        return;
      }
      setAuthStep("OTP");
    } catch (e) {
      setError(String(e?.message || "Failed to send OTP"));
    } finally {
      setAuthBusy(false);
    }
  };

  const verifyOtpForRole = async () => {
    const nextTenant = resolveTenantCode();
    if (!nextTenant) {
      setError("Tenant not selected.");
      return;
    }
    Config.RuntimeTenant.tenantId = nextTenant;
    setTenantInput(nextTenant);
    if (!otp) {
      setError("OTP is required.");
      return;
    }

    try {
      setAuthBusy(true);
      setError("");
      const reqUrl = `${resolveTenantApiBaseForAuth()}/api/v1/tenant/${encodeURIComponent(
        nextTenant
      )}/mobile-webview-auth/verify-otp`;
      const res = await fetch(reqUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleMode, identity, password, otp }),
      });
      const raw = await res.text();
      const data = parseJsonSafely(raw);
      if (!res.ok || !data?.success) {
        throw new Error(
          buildApiErrorMessage({
            fallback: "OTP verification failed",
            status: res.status,
            data,
            raw,
          })
        );
      }
      if (!data?.launchUrl) {
        throw new Error("Launch URL not provided by server.");
      }
      applyLaunchUrl({ role: roleMode, launchUrl: data.launchUrl });
      if (
        biometricAvailable &&
        enableBiometricLogin &&
        data?.biometricLoginToken
      ) {
        await upsertBiometricSession(nextTenant, {
          role: roleMode,
          identity,
          biometricLoginToken: data.biometricLoginToken,
        });
        Alert.alert(
          "Biometric Enabled",
          `Next login can use ${resolveBiometricLabel()} without OTP.`
        );
      } else if (!enableBiometricLogin) {
        await removeBiometricSession(nextTenant);
      }
      setAuthStep("CREDENTIALS");
      setOtp("");
    } catch (e) {
      setError(String(e?.message || "OTP verification failed"));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleBiometricQuickLogin = async () => {
    const nextTenant = resolveTenantCode();
    if (!nextTenant) {
      setError("Tenant not selected.");
      return;
    }
    const stored = biometricSession;
    if (!stored?.biometricLoginToken || !stored?.role) {
      setError("No biometric login session found for this tenant.");
      return;
    }

    try {
      setBiometricBusy(true);
      setError("");
      const promptResult = await rnBiometrics.simplePrompt({
        promptMessage: `Authenticate with ${resolveBiometricLabel()}`,
        cancelButtonText: "Cancel",
      });
      if (!promptResult?.success) return;

      const res = await fetch(
        `${resolveTenantApiBaseForAuth()}/api/v1/tenant/${encodeURIComponent(
          nextTenant
        )}/mobile-webview-auth/biometric-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: stored.role,
            biometricLoginToken: stored.biometricLoginToken,
          }),
        }
      );
      const raw = await res.text();
      const data = parseJsonSafely(raw);
      if (!res.ok || !data?.success) {
        throw new Error(
          buildApiErrorMessage({
            fallback: "Biometric login failed",
            status: res.status,
            data,
            raw,
          })
        );
      }
      if (!data?.launchUrl) {
        throw new Error("Launch URL not provided by server.");
      }

      if (data?.biometricLoginToken) {
        await upsertBiometricSession(nextTenant, {
          role: stored.role,
          identity: stored.identity || "",
          biometricLoginToken: data.biometricLoginToken,
        });
      }
      applyLaunchUrl({ role: stored.role, launchUrl: data.launchUrl });
    } catch (e) {
      const msg = String(e?.message || "Biometric login failed");
      setError(msg);
      if (
        /invalid biometric token|token|disabled|mismatch|expired/i.test(msg)
      ) {
        await removeBiometricSession(nextTenant);
      }
    } finally {
      setBiometricBusy(false);
    }
  };

  // ── WebView ↔ Native message bridge for client biometric ──
  const handleWebViewMessage = async (event) => {
    try {
      const raw = String(event?.nativeEvent?.data || "");
      if (!raw.startsWith("{")) return;
      const msg = JSON.parse(raw);
      const nextTenant = resolveTenantCode();

      if (msg.type === "BIOMETRIC_ENABLE") {
        // Client wants to enable biometric quick-login
        // msg.payload = { token, clientCode, identity }
        if (!biometricAvailable) {
          webRef.current?.injectJavaScript(
            `window.__NATIVE_BIOMETRIC_RESPONSE__&&window.__NATIVE_BIOMETRIC_RESPONSE__({success:false,error:"Biometric not available on this device"});true;`
          );
          return;
        }
        const { token, clientCode, identity } = msg.payload || {};
        if (!token || !clientCode) {
          webRef.current?.injectJavaScript(
            `window.__NATIVE_BIOMETRIC_RESPONSE__&&window.__NATIVE_BIOMETRIC_RESPONSE__({success:false,error:"Missing session data"});true;`
          );
          return;
        }
        // Prompt biometric to confirm identity
        const promptResult = await rnBiometrics.simplePrompt({
          promptMessage: `Enable ${resolveBiometricLabel()} login`,
          cancelButtonText: "Cancel",
        });
        if (!promptResult?.success) {
          webRef.current?.injectJavaScript(
            `window.__NATIVE_BIOMETRIC_RESPONSE__&&window.__NATIVE_BIOMETRIC_RESPONSE__({success:false,error:"Authentication cancelled"});true;`
          );
          return;
        }
        // Save client session for biometric quick-login
        await upsertBiometricSession(nextTenant, {
          role: "CLIENT",
          identity: identity || clientCode,
          biometricLoginToken: token,
        });
        setClientBiometricEnabled(true);
        // Update the injected config so web knows it's enabled
        webRef.current?.injectJavaScript(
          `window.__RN_HYBRID_CONFIG__&&(window.__RN_HYBRID_CONFIG__.biometricEnabled=true);window.__NATIVE_BIOMETRIC_RESPONSE__&&window.__NATIVE_BIOMETRIC_RESPONSE__({success:true});true;`
        );
      } else if (msg.type === "BIOMETRIC_DISABLE") {
        await removeBiometricSession(nextTenant);
        setClientBiometricEnabled(false);
        webRef.current?.injectJavaScript(
          `window.__RN_HYBRID_CONFIG__&&(window.__RN_HYBRID_CONFIG__.biometricEnabled=false);window.__NATIVE_BIOMETRIC_RESPONSE__&&window.__NATIVE_BIOMETRIC_RESPONSE__({success:true});true;`
        );
      } else if (msg.type === "BIOMETRIC_STATUS") {
        const raw2 = await AsyncStorage.getItem(BIOMETRIC_LOGIN_STORAGE_KEY);
        const parsed = parseBiometricStore(raw2);
        const entry = parsed?.[nextTenant];
        const enabled = !!entry?.biometricLoginToken && entry?.role === "CLIENT";
        webRef.current?.injectJavaScript(
          `window.__NATIVE_BIOMETRIC_RESPONSE__&&window.__NATIVE_BIOMETRIC_RESPONSE__({success:true,available:${biometricAvailable},type:"${biometricType}",enabled:${enabled}});true;`
        );
      } else if (msg.type === "CLIENT_LOGOUT") {
        // Remove biometric session on logout
        await removeBiometricSession(nextTenant);
        setClientBiometricEnabled(false);
      }
    } catch (e) {
      // Silently handle parse errors from non-JSON messages
    }
  };

  // ── Client biometric quick-login on app start ──
  const pendingBioInjectRef = useRef(null);

  useEffect(() => {
    if (!biometricAvailable) return;
    if (!forceClientOnly) return;
    let active = true;
    (async () => {
      try {
        const nextTenant = resolveTenantCode();
        if (!nextTenant) return;
        const raw = await AsyncStorage.getItem(BIOMETRIC_LOGIN_STORAGE_KEY);
        const parsed = parseBiometricStore(raw);
        const entry = parsed?.[nextTenant];
        if (!entry?.biometricLoginToken || entry?.role !== "CLIENT") return;
        if (!active) return;

        const promptResult = await rnBiometrics.simplePrompt({
          promptMessage: `Login with ${resolveBiometricLabel()}`,
          cancelButtonText: "Use OTP instead",
        });
        if (!promptResult?.success || !active) return;

        // Prepare session injection script — will run as soon as WebView is ready
        const token = entry.biometricLoginToken;
        const identity = entry.identity || "";
        const injectSession = `
          (function(){
            try {
              sessionStorage.setItem('token', ${JSON.stringify(token)});
              sessionStorage.setItem('clientCode', ${JSON.stringify(identity)});
              if (window.location.pathname === '/' || window.location.pathname === '/login') {
                window.location.href = window.location.origin + '/home' + window.location.search;
              }
            } catch(e) {}
          })();true;
        `;
        // Try injecting immediately if WebView is already loaded
        if (webRef.current) {
          webRef.current.injectJavaScript(injectSession);
        }
        // Also store it so onLoadEnd can inject if WebView hasn't loaded yet
        pendingBioInjectRef.current = injectSession;
      } catch (_) {}
    })();
    return () => { active = false; };
  }, [biometricAvailable, forceClientOnly]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <WebView
        ref={webRef}
        source={{
          uri: currentUrl || "about:blank",
        }}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        cacheMode={
          Platform.OS === "android" ? "LOAD_DEFAULT" : undefined
        }
        androidLayerType="none"
        keyboardDisplayRequiresUserAction={false}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        setSupportMultipleWindows={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="large" color={Config.Colors.primary} />
          </View>
        )}
        mixedContentMode="always"
        scalesPageToFit={false}
        textZoom={100}
        originWhitelist={["http://*", "https://*"]}
        injectedJavaScriptBeforeContentLoaded={injectedBootstrapScript}
        injectedJavaScript={MOBILE_VIEWPORT_FIX_SCRIPT}
        allowsBackForwardNavigationGestures={false}
        allowsLinkPreview={false}
        dataDetectorTypes="none"
        overScrollMode="never"
        bounces={false}
        pullToRefreshEnabled={false}
        onNavigationStateChange={(navState) => {
          setCanGoBack(!!navState?.canGoBack);
          const nextUrl = String(navState?.url || "");
          if (roleMode === "CLIENT" && isLikelyPostLoginUrl(nextUrl)) {
            setClientSessionStarted(true);
            setShowStaffCTA(false);
          }
        }}
        onLoadStart={() => {
          setError("");
          setLoading(true);
        }}
        onLoadProgress={(e) => {
          if ((e?.nativeEvent?.progress || 0) > 0.4) setLoading(false);
        }}
        onLoadEnd={() => {
          setLoading(false);
          // Inject pending biometric session as soon as page finishes loading
          if (pendingBioInjectRef.current && webRef.current) {
            webRef.current.injectJavaScript(pendingBioInjectRef.current);
            pendingBioInjectRef.current = null;
          }
        }}
        onHttpError={(e) => {
          setLoading(false);
          const statusCode = e?.nativeEvent?.statusCode;
          const description = String(
            e?.nativeEvent?.description || "HTTP error while loading page."
          );
          setError(statusCode ? `[${statusCode}] ${description}` : description);
        }}
        onRenderProcessGone={() => {
          setLoading(false);
          setError("Web engine was restarted by Android. Tap Retry.");
        }}
        onError={(e) => {
          setLoading(false);
          const description = String(
            e?.nativeEvent?.description || "Page cannot load."
          );
          setError(description);
        }}
        onMessage={handleWebViewMessage}
      />

      {!hasTenant ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Enter tenant code and tap Load</Text>
          <Text style={styles.emptyText}>Example: MOTISONS</Text>
        </View>
      ) : null}

      <Modal
        visible={showAuthModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Tenant Access</Text>
            </View>

            {tenantLockEnabled ? (
              <Text style={styles.tenantHint}>Tenant: {lockedTenantCode}</Text>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Tenant code (e.g. MOTISONS)"
                  autoCapitalize="characters"
                  value={tenantInput}
                  onChangeText={(v) =>
                    setTenantInput(
                      String(v || "")
                        .replace(/[^A-Za-z0-9_-]/g, "")
                        .toUpperCase()
                    )
                  }
                />
                <TouchableOpacity style={styles.btn} onPress={applyTenant}>
                  <Text style={styles.btnTxt}>Load Tenant</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.staffWrap}>
              {!forceClientOnly ? (
                <>
                  <Text style={styles.staffLabel}>Select Login</Text>
                  <View style={styles.authRoleRow}>
                    {canClientLogin ? (
                      <TouchableOpacity
                        style={[
                          styles.roleBtn,
                          roleMode === "CLIENT" ? styles.roleBtnActive : null,
                        ]}
                        onPress={() => switchToRole("CLIENT")}
                      >
                        <Text
                          style={[
                            styles.roleTxt,
                            roleMode === "CLIENT" ? styles.roleTxtActive : null,
                          ]}
                        >
                          Client
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    {canTenantAdminLogin ? (
                      <TouchableOpacity
                        style={[
                          styles.roleBtn,
                          roleMode === "TENANT_ADMIN" ? styles.roleBtnActive : null,
                        ]}
                        onPress={() => switchToRole("TENANT_ADMIN")}
                      >
                        <Text
                          style={[
                            styles.roleTxt,
                            roleMode === "TENANT_ADMIN"
                              ? styles.roleTxtActive
                              : null,
                          ]}
                        >
                          Broker
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    {canEmployeeLogin ? (
                      <TouchableOpacity
                        style={[
                          styles.roleBtn,
                          roleMode === "EMPLOYEE" ? styles.roleBtnActive : null,
                        ]}
                        onPress={() => switchToRole("EMPLOYEE")}
                      >
                        <Text
                          style={[
                            styles.roleTxt,
                            roleMode === "EMPLOYEE" ? styles.roleTxtActive : null,
                          ]}
                        >
                          Employee
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </>
              ) : null}
            </View>

            {biometricAvailable && biometricSession?.biometricLoginToken ? (
              <View style={styles.biometricCard}>
                <Text style={styles.biometricTitle}>
                  Quick Login:{" "}
                  {ROLE_LABEL[
                    String(biometricSession.role || "").toUpperCase()
                  ] || "Staff"}
                </Text>
                {!!biometricSession?.identity ? (
                  <Text style={styles.biometricSubtitle}>
                    {biometricSession.identity}
                  </Text>
                ) : null}
                <View style={styles.biometricActions}>
                  <TouchableOpacity
                    style={[
                      styles.authBtn,
                      biometricBusy ? styles.disabledBtn : null,
                    ]}
                    disabled={biometricBusy}
                    onPress={handleBiometricQuickLogin}
                  >
                    <Text style={styles.authBtnTxt}>
                      {biometricBusy
                        ? "Authenticating..."
                        : `Login with ${resolveBiometricLabel()}`}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.biometricRemoveBtn}
                    onPress={() => removeBiometricSession(resolveTenantCode())}
                  >
                    <Text style={styles.biometricRemoveTxt}>
                      Remove saved biometric
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {roleMode === "CLIENT" ? (
              <TouchableOpacity
                style={styles.authBtn}
                disabled={authBusy}
                onPress={sendOtpForRole}
              >
                <Text style={styles.authBtnTxt}>
                  {authBusy ? "Opening..." : "Open Client Web"}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.authInputsWrap}>
                <Text style={styles.authHint}>
                  {roleMode === "TENANT_ADMIN"
                    ? "Broker login: enter ARN/Admin Email + password, then OTP."
                    : "Employee login: enter employee email + password, then OTP."}
                </Text>
                <TextInput
                  style={styles.authInput}
                  autoCapitalize="none"
                  placeholder={
                    roleMode === "TENANT_ADMIN"
                      ? "ARN or admin email"
                      : "Employee email"
                  }
                  value={identity}
                  onChangeText={setIdentity}
                />
                <TextInput
                  style={styles.authInput}
                  placeholder="Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                {biometricAvailable ? (
                  <View style={styles.biometricSwitchRow}>
                    <Text style={styles.biometricSwitchText}>
                      Enable biometric login after OTP
                    </Text>
                    <Switch
                      value={enableBiometricLogin}
                      onValueChange={setEnableBiometricLogin}
                    />
                  </View>
                ) : null}

                {authStep === "OTP" ? (
                  <>
                    <TextInput
                      style={styles.authInput}
                      placeholder="OTP"
                      keyboardType="number-pad"
                      value={otp}
                      onChangeText={(v) =>
                        setOtp(
                          String(v || "")
                            .replace(/\D/g, "")
                            .slice(0, 6)
                        )
                      }
                    />
                    <TouchableOpacity
                      style={styles.authBtn}
                      disabled={authBusy}
                      onPress={verifyOtpForRole}
                    >
                      <Text style={styles.authBtnTxt}>
                        {authBusy ? "Verifying..." : "Verify OTP"}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.authBtn}
                    disabled={authBusy}
                    onPress={sendOtpForRole}
                  >
                    <Text style={styles.authBtnTxt}>
                      {authBusy ? "Sending..." : "Send OTP"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {!!error ? <Text style={styles.modalError}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowAuthModal(false)}
            >
              <Text style={styles.modalCloseTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* No visible loader — WebView renderLoading handles the initial state */}

      {!loading && error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorTxt}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setError("");
              setLoading(true);
              webRef.current?.reload();
            }}
          >
            <Text style={styles.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!forceClientOnly &&
      !showAuthModal &&
      showStaffCTA &&
      roleMode === "CLIENT" &&
      !clientSessionStarted ? (
        <TouchableOpacity
          style={styles.staffFooter}
          onPress={() => {
            setShowAuthModal(true);
            if (canTenantAdminLogin) setRoleMode("TENANT_ADMIN");
            else if (canEmployeeLogin) setRoleMode("EMPLOYEE");
            else setRoleMode("CLIENT");
            setAuthStep("CREDENTIALS");
            setError("");
          }}
        >
          <Text style={styles.staffFooterTitle}>
            Need Broker/Employee Login?
          </Text>
          <Text style={styles.staffFooterSubtitle}>
            Tap here to open staff access
          </Text>
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  webviewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  btn: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnTxt: { color: "#fff", fontWeight: "700" },
  authRoleRow: {
    flexDirection: "row",
    gap: 8,
  },
  roleBtn: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#fff",
  },
  roleBtnActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  roleTxt: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "600",
  },
  roleTxtActive: {
    color: "#fff",
  },
  disabledBtn: {
    opacity: 0.6,
  },
  authInputsWrap: {
    marginTop: 4,
    gap: 8,
  },
  authHint: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  authInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: "#111827",
    backgroundColor: "#fff",
  },
  authBtn: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  authBtnTxt: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  biometricCard: {
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#eff6ff",
    gap: 6,
  },
  biometricTitle: {
    fontSize: 12,
    color: "#1e3a8a",
    fontWeight: "700",
  },
  biometricSubtitle: {
    fontSize: 12,
    color: "#334155",
  },
  biometricActions: {
    gap: 8,
  },
  biometricRemoveBtn: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  biometricRemoveTxt: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
  },
  biometricSwitchRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  biometricSwitchText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "600",
  },
  loader: {
    position: "absolute",
    right: 14,
    top: 46,  // below the compact web header (~40px)
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loaderTxt: { fontSize: 12, color: "#374151" },
  staffInlineBtn: {
    marginTop: 8,
    alignSelf: "center",
    backgroundColor: "#0f172a",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  staffInlineTxt: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  errorWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 72,  // above compact bottom nav (54px) + safe area buffer
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff1f2",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  errorTxt: { color: "#991b1b", fontSize: 12 },
  retryBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  retryTxt: { color: "#fff", fontWeight: "600", fontSize: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.45)",
    padding: 16,
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalClose: {
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  modalCloseTxt: { color: "#111827", fontSize: 12, fontWeight: "700" },
  modalError: { color: "#b91c1c", fontSize: 12 },
  emptyState: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 140,
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  emptyTitle: { fontSize: 13, fontWeight: "700", color: "#111827" },
  emptyText: { marginTop: 4, fontSize: 12, color: "#4b5563" },
  staffWrap: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 8,
    gap: 8,
    backgroundColor: "#f8fafc",
  },
  staffLabel: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },
  tenantHint: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },
  staffFooter: {
    margin: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  staffFooterTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  staffFooterSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
});
