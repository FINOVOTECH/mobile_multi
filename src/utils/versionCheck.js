import { Alert, Linking, Platform } from "react-native";
import VersionCheck from "react-native-version-check";
import * as Config from "../helpers/Config";
import { bootstrapTenantBranding } from "../helpers/tenantBrandingRuntime";

let hasCheckedVersion = false;

const normalizeVersion = (value = "") =>
  String(value || "")
    .trim()
    .replace(/^[^0-9]*/, "")
    .split(/[^\d]+/)
    .filter(Boolean)
    .map((part) => Number(part) || 0);

const compareVersions = (a = "", b = "") => {
  const x = normalizeVersion(a);
  const y = normalizeVersion(b);
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i += 1) {
    const xv = x[i] || 0;
    const yv = y[i] || 0;
    if (xv > yv) return 1;
    if (xv < yv) return -1;
  }
  return 0;
};

const pickUpdateUrl = (cfg = {}) => {
  if (Platform.OS === "android") {
    return String(cfg.androidApkUrl || "").trim();
  }
  return String(cfg.iosTestflightUrl || cfg.iosIpaUrl || "").trim();
};

export const checkAppVersion = async () => {
  try {
    if (hasCheckedVersion) return;
    hasCheckedVersion = true;

    // Refresh tenant config once so mobileAppConfig is latest from backend/admin.
    await bootstrapTenantBranding();
    const tenantCfg = Config.RuntimeTenant?.mobileAppConfig || {};
    const publishStatus = String(tenantCfg.publishStatus || "DRAFT").toUpperCase();
    if (publishStatus !== "PUBLISHED") return;

    const currentVersion = await VersionCheck.getCurrentVersion();
    const targetVersion = String(tenantCfg.appVersion || "").trim();
    if (!targetVersion) return;
    const isNeeded = compareVersions(targetVersion, currentVersion) > 0;
    if (!isNeeded) return;

    const updateUrl = pickUpdateUrl(tenantCfg);
    const isForce = tenantCfg.forceUpdate === true;
    const notes = String(tenantCfg.releaseNotes || "").trim();
    const msg = notes
      ? `A new app version (${targetVersion}) is available.\n\n${notes}`
      : `A new app version (${targetVersion}) is available.`;

    const actions = [];
    if (!isForce) {
      actions.push({ text: "Later", style: "cancel" });
    }
    actions.push({
      text: "Update Now",
      onPress: async () => {
        if (!updateUrl) return;
        try {
          await Linking.openURL(updateUrl);
        } catch (_) {
          // no-op
        }
      },
    });

    Alert.alert("Update Available", msg, actions, { cancelable: !isForce });
  } catch (e) {
    console.log("Version check failed:", e);
  }
};
