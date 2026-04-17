/* ── Auth Helpers ───────────────────────────────────────── */

export type AuthSession = {
  role: "admin" | "manager";
  phone?: string;
};

const AUTH_KEY = "authSession";
const CLIENT_AUTH_KEY = "currentUser";

export const getAuth = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const setAuth = (session: AuthSession) => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
};

export const clearAuth = () => {
  localStorage.removeItem(AUTH_KEY);
};

export const isAdmin = () => getAuth()?.role === "admin";
export const isManager = () => getAuth()?.role === "manager";

export const getClientAuth = <T = Record<string, unknown>>(): T | null => {
  try {
    const raw = localStorage.getItem(CLIENT_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const setClientAuth = (session: unknown) => {
  localStorage.setItem(CLIENT_AUTH_KEY, JSON.stringify(session));
};

export const clearClientAuth = () => {
  localStorage.removeItem(CLIENT_AUTH_KEY);
};

export const isClientAuthenticated = () => getClientAuth() !== null;

export const getDefaultRouteForRole = (role?: AuthSession["role"] | "client") => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "manager") return "/manager/dashboard";
  if (role === "client") return "/";
  return "/";
};

export const getDefaultRouteForSession = () => {
  const auth = getAuth();
  if (auth?.role) return getDefaultRouteForRole(auth.role);
  if (isClientAuthenticated()) return getDefaultRouteForRole("client");
  return "/";
};
