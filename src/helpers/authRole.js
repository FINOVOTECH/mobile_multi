import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Config from "./Config";

export const ROLE_CLIENT = "client";
export const ROLE_EMPLOYEE = "employee";
export const ROLE_TENANT_ADMIN = "tenant_admin";

export const normalizeRole = (value = "") => {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === ROLE_EMPLOYEE) return ROLE_EMPLOYEE;
  if (raw === ROLE_TENANT_ADMIN) return ROLE_TENANT_ADMIN;
  return ROLE_CLIENT;
};

export const isStaffRole = (role = "") => {
  const normalized = normalizeRole(role);
  return normalized === ROLE_EMPLOYEE || normalized === ROLE_TENANT_ADMIN;
};

export const getStoredLoginRole = async () => {
  try {
    const saved = await AsyncStorage.getItem(Config.store_key_login_role);
    return normalizeRole(saved);
  } catch (_) {
    return ROLE_CLIENT;
  }
};
