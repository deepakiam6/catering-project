import { Navigate, useLocation } from "react-router-dom";
import {
  getAuth,
  getClientAuth,
  getDefaultRouteForRole,
  type AuthSession,
} from "../utils/auth";

const RoleRedirect = ({
  allow,
  redirectTo,
  children,
}: {
  allow: boolean;
  redirectTo: string;
  children: React.ReactNode;
}) => {
  const location = useLocation();

  if (!allow) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

const AuthRedirect = ({
  fallbackRole,
  children,
}: {
  fallbackRole: AuthSession["role"] | "client";
  children: React.ReactNode;
}) => {
  const auth = getAuth();
  const client = getClientAuth();

  if (auth?.role === "admin") {
    return <Navigate to={getDefaultRouteForRole("admin")} replace />;
  }

  if (auth?.role === "manager") {
    return <Navigate to={getDefaultRouteForRole("manager")} replace />;
  }

  if (client && fallbackRole === "client") {
    const eventId = String((client as { id?: string }).id ?? "").trim();
    if (eventId) {
      return <Navigate to={`/book-food/${eventId}/dashboard`} replace />;
    }
  }

  return <>{children}</>;
};

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = getAuth();
  return (
    <RoleRedirect allow={auth?.role === "admin"} redirectTo="/admin/login">
      {children}
    </RoleRedirect>
  );
};

export const ManagerRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = getAuth();
  return (
    <RoleRedirect allow={auth?.role === "manager"} redirectTo="/admin/login">
      {children}
    </RoleRedirect>
  );
};

export const ClientRoute = ({ children }: { children: React.ReactNode }) => {
  const client = getClientAuth();
  return (
    <RoleRedirect allow={Boolean(client)} redirectTo="/userlogin">
      {children}
    </RoleRedirect>
  );
};

export const AdminLoginRoute = ({ children }: { children: React.ReactNode }) => (
  <AuthRedirect fallbackRole="admin">{children}</AuthRedirect>
);

export const ClientLoginRoute = ({ children }: { children: React.ReactNode }) => (
  <AuthRedirect fallbackRole="client">{children}</AuthRedirect>
);
