/* ── Auth Helpers ───────────────────────────────────────── */

export type AuthSession = {
  role: "admin" | "manager";
  phone?: string;
};

type ClientSession = {
  id?: string | number;
};

const AUTH_KEY = "authSession";
const CLIENT_AUTH_KEY = "currentUser";
const CLIENT_AUTH_ALIASES = [
  CLIENT_AUTH_KEY,
  "clientAuth",
  "clientSession",
  "client",
  "userAuth",
  "eventAuth",
] as const;

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
  for (const key of CLIENT_AUTH_ALIASES) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      return JSON.parse(raw) as T;
    } catch {
      continue;
    }
  }

  return null;
};

export const setClientAuth = (session: unknown) => {
  const value = JSON.stringify(session);
  localStorage.setItem(CLIENT_AUTH_KEY, value);
  localStorage.setItem("clientAuth", value);
};

export const clearClientAuth = () => {
  CLIENT_AUTH_ALIASES.forEach((key) => localStorage.removeItem(key));
};

export const isClientAuthenticated = () => getClientAuth() !== null;

export const getDefaultRouteForRole = (role?: AuthSession["role"] | "client") => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "manager") return "/manager/dashboard";
  if (role === "client") return getClientDashboardRoute();
  return "/";
};

export const getClientEventId = (session?: ClientSession | null) => {
  const client = session ?? getClientAuth<ClientSession>();
  const id = client?.id;

  if (id === undefined || id === null) return null;

  const value = String(id).trim();
  return value ? value : null;
};

export const getClientDashboardRoute = (session?: ClientSession | null) => {
  const eventId = getClientEventId(session);
  return eventId ? `/book-food/${eventId}/dashboard` : "/userlogin";
};

export const getDefaultRouteForSession = () => {
  const auth = getAuth();
  if (auth?.role) return getDefaultRouteForRole(auth.role);
  if (isClientAuthenticated()) return getClientDashboardRoute();
  return "/";
};
