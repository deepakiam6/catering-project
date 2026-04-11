/* ── Auth Helpers ───────────────────────────────────────── */

export type AuthSession = {
  role: "admin" | "manager";
  phone?: string;
};

const AUTH_KEY = "authSession";

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