import { Platform } from "react-native";

// ─── Local dev machine LAN IP (fallback for WiFi testing without adb reverse) ───
// Update this to your machine's current WiFi IP if you cannot use adb reverse.
// Find it with: ipconfig getifaddr en0   (macOS)
const DEV_MACHINE_LAN_IP = "192.168.100.138";

const getAndroidDeviceSignals = () => {
  const constants = Platform?.constants || {};
  const model = String(constants.Model || constants.model || "").toLowerCase();
  const brand = String(constants.Brand || constants.brand || "").toLowerCase();
  const device = String(constants.Device || constants.device || "").toLowerCase();
  const fingerprint = String(
    constants.Fingerprint || constants.fingerprint || ""
  ).toLowerCase();
  return { model, brand, device, fingerprint };
};

const isAndroidEmulator = () => {
  if (Platform.OS !== "android") return false;
  const { model, brand, device, fingerprint } = getAndroidDeviceSignals();
  return (
    model.includes("sdk") ||
    model.includes("emulator") ||
    model.includes("google_sdk") ||
    device.includes("emulator") ||
    device.includes("sdk") ||
    brand.includes("generic") ||
    fingerprint.includes("generic") ||
    fingerprint.includes("vbox")
  );
};

// ─── API base URL ───────────────────────────────────────────────────────────────
// Physical Android device: uses the LAN IP so the phone can reach the dev machine
// directly over WiFi without needing adb reverse port forwarding.
// The actual backend/frontend URLs are also stored in mobileAppConfig (DB) and
// take precedence at runtime — this is just the fallback for first-boot / no-cache.
const DEV_API_BASE_URL = (() => {
  if (Platform.OS === "ios") return "http://localhost:8000";
  if (isAndroidEmulator()) return "http://10.0.2.2:8000";
  if (DEV_MACHINE_LAN_IP) return `http://${DEV_MACHINE_LAN_IP}:8000`; // physical device
  return "http://localhost:8000";
})();

const PROD_API_BASE_URL = "http://localhost:8048";

const DEV_WEB_HOST_TEMPLATE = (() => {
  if (Platform.OS === "ios") return "http://localhost:5174";
  if (isAndroidEmulator()) return "http://10.0.2.2:5174";
  if (DEV_MACHINE_LAN_IP) return `http://${DEV_MACHINE_LAN_IP}:5174`; // physical device
  return "http://localhost:5174";
})();

const PROD_WEB_HOST_TEMPLATE = "http://localhost:5174";
const WEB_FALLBACK_URL = "https://mf.finovo.tech";

// ─── Runtime-overridable URLs ────────────────────────────────────────────────
// These start with the build-time defaults but can be overridden at runtime
// by mobileAppConfig from the tenant branding API response.
const _defaults = {
  baseUrl: __DEV__ ? DEV_API_BASE_URL : PROD_API_BASE_URL,
  hybridWebHostTemplate: __DEV__ ? DEV_WEB_HOST_TEMPLATE : PROD_WEB_HOST_TEMPLATE,
};
let _runtimeBaseUrl = "";
let _runtimeWebHost = "";

export const getBaseUrl = () => _runtimeBaseUrl || _defaults.baseUrl;
export const getHybridWebHostTemplate = () => _runtimeWebHost || _defaults.hybridWebHostTemplate;

// Backward-compatible named exports — used by most of the codebase
export const baseUrl = _defaults.baseUrl;
export const tenantBrandingBaseUrl = _defaults.baseUrl;
export const hybridWebHostTemplate = _defaults.hybridWebHostTemplate;
export const hybridWebFallbackUrl = WEB_FALLBACK_URL;
export const useHybridApp = true;
export const defaultTenantId = "INDUS";
export const hybridClientOnlyApp = true;
export const store_key_login_details = "token"
export const store_key_login_role = "loginRole"

/**
 * Called by tenantBrandingRuntime after fetching mobileAppConfig from the API.
 * Overrides the API base URL and frontend URL at runtime so the app
 * can switch between LOCAL and LIVE without a rebuild.
 */
export const setRuntimeUrls = ({ apiBaseUrl, webHostTemplate } = {}) => {
  const newApi = String(apiBaseUrl || "").trim().replace(/\/+$/, "");
  const newWeb = String(webHostTemplate || "").trim().replace(/\/+$/, "");
  if (newApi) _runtimeBaseUrl = newApi;
  if (newWeb) _runtimeWebHost = newWeb;
};

export const clientCode = "clientCode";
export const WEIGHTS = {
    regular: "normal",
    bold: "bold",
    semibold: "500",
    medium: "600",
    light: "300",
    extraBold: "900"
};

export const fontFamilys = {
    Poppins_Black: 'Poppins-Black',
    Poppins_BlackItalic: 'Poppins-BlackItalic',
    Poppins_Bold: 'Poppins-Bold',
    Poppins_BoldItalic: 'Poppins-BoldItalic',
    Poppins_ExtraBold: 'Poppins-ExtraBold',
    Poppins_ExtraBoldItalic: 'Poppins-ExtraBoldItalic',
    Poppins_ExtraLightItalic: 'Poppins-ExtraLightItalic',
    Poppins_Italic: 'Poppins-Italic',
    Poppins_Light: 'Poppins-Light',
    Poppins_LightItalic: 'Poppins-LightItalic',
    Poppins_Medium: 'Poppins-Medium',
    Poppins_MediumItalic: 'Poppins-MediumItalic',
    Poppins_Regular: 'Poppins-Regular',
    Poppins_SemiBold: 'Poppins-SemiBold',
    Poppins_SemiBoldItalic: 'Poppins-SemiBoldItalic',
    Poppins_Thin: 'Poppins-Thin',
    Poppins_ThinItalic: 'Poppins-ThinItalic',

};

export const Colors = {
    primary: '#1768BF',
    secondary: '#94BC39',
    bottomTabColor: '#f6fbff',
    activeColor: '#000000',
    inactiveColor: '#000000',
    inputField: '#F6F6F6',
    bodyBg: '#F5F5F5',
    errorField: '#FFE8E8',
    errorText: '#BD0000',
    successField: '#F5FFEA',
    successText: '#6FB423',
    defaultColor: '#FFFF',
    lineColor: '#204461',
    inputField_1: '#E4E4E4',
    errorFieldBorder: '#f02424',
    black: '#000',
    white: '#FFFFFF',
    borderColor: '#FFFFFF',
    borderColor1: 'rgba(52, 52, 52, 0.3)',
    bottomColor: "#0061A1",
    bottomTabColor: "rgba(28, 30, 32, 1)",
    red: '#A41616',
    searchBgInput: "#ECECEC",
    searchBriderInput: "#C6CACF",
    yellow: "#FFEE02",
    green: "#098F3C",
    cyan_blue: '#f6fbff',
    purple_main:'#5F3C80',
    itemSeparatorBorder: "#515151",
    gray:"#c9c6c5",
    RGBAColors: {
        primary: 'rgba(32, 78, 113, 1.0)',
        secondary: 'rgba(173, 59, 68, 1.0)',
        inputField: '#F6F6F6',
        bodyBg: '#F5F5F5',
        errorField: '#FFE8E8',
        errorText: '#BD0000',
        successField: '#F5FFEA',
        successText: '#6FB423',
        defaultColor: '#fff',
        lineColor: 'rgba(32, 68, 97, 1.0)',
        inputField_1: 'rgba(228, 228, 228, 1.0)',
        themeColor: 'rgba(32, 68, 97, 1.0)',
        lightBlue: 'rgba(0, 142, 238, 1)',
        lightBlack: 'rgba(28, 30, 32, 0.3)',
        lightBlack1: 'rgba(52, 52, 52, 0.33)',
        white: 'rgba(255, 255, 255, 0.5)',
        lightWhite: 'rgba(255, 255, 255, 0.5)'
    },
    textColor: {
        textColor_1: "#FFFFFF",
        textColor_2: "#787878",
        textColor_3: "#6FCB4E",
        textColor_4: "#888888",
        textColor_5: "rgba(174, 174, 174, 0.8)",
        textColor_6: "rgba(203, 130, 78, 1)",
        textColor_7: "rgba(63, 148, 205, 1)",

    },
    backgroundColors: {
        bg_1: '#060606',
        bg_2: "#1c241f",
        bg_3: "#e4e4e5",
        bg_4: "#1C1E20",
        bg_5: "rgba(78, 203, 113, 0.19)",
        bg_6: "rgba(203, 145, 78, 0.19)",
        bg_7: "rgba(137, 59, 59, 0.19)",
        bg_8: "rgba(2, 28, 45, 1)",
        bg_9: "rgba(0, 90, 195, 1)",
    },
};

export const RuntimeTenant = {
    tenantId: defaultTenantId,
    appName: "",
    brokerName: "",
    brokerUrl: "",
    logoUrl: "",
    exchangePreference: "BOTH",
    availableExchanges: ["BSE", "NSE", "ALL"],
    preferredExchange: "BSE",
    primaryColor: Colors.primary,
    secondaryColor: Colors.secondary,
    accentColor: Colors.secondary,
    mobileAppConfig: {},
    mobileAccess: {
        enableClientLogin: true,
        enableEmployeeLogin: true,
        enableTenantAdminLogin: true,
    },
};
