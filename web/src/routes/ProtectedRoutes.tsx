import { Navigate, useLocation, useParams } from "react-router-dom";
import {
  getAuth,
  getClientAuth,
  getClientEventId,
  getDefaultRouteForSession,
} from "../utils/auth";

/* ---------------------------------- */
/* Protected Route Wrapper            */
/* ---------------------------------- */
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
  const auth = getAuth();
  const client = getClientAuth();
  const fallbackRoute = getDefaultRouteForSession();
  const currentPath = `${location.pathname}${location.search}${location.hash}`;

  if (!allow) {
    const hasSession = Boolean(auth?.role || getClientEventId(client));
    const nextRoute =
      hasSession && fallbackRoute !== currentPath
        ? fallbackRoute
        : redirectTo;

    return (
      <Navigate
        to={nextRoute}
        replace
        state={{ from: currentPath }}
      />
    );
  }

  return <>{children}</>;
};

/* ---------------------------------- */
/* Login Auto Redirect                */
/* ---------------------------------- */
const AuthRedirect = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const auth = getAuth();
  const client = getClientAuth();
  const redirectTo = getDefaultRouteForSession();

  if (auth?.role || getClientEventId(client)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

/* ---------------------------------- */
/* Admin Protected Route              */
/* ---------------------------------- */
export const AdminRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const auth = getAuth();

  return (
    <RoleRedirect
      allow={auth?.role === "admin"}
      redirectTo="/admin/login"
    >
      {children}
    </RoleRedirect>
  );
};

/* ---------------------------------- */
/* Manager Protected Route            */
/* ---------------------------------- */
export const ManagerRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const auth = getAuth();

  return (
    <RoleRedirect
      allow={auth?.role === "manager"}
      redirectTo="/admin/login"
    >
      {children}
    </RoleRedirect>
  );
};

export const AdminManagerRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const auth = getAuth();

  return (
    <RoleRedirect
      allow={auth?.role === "admin" || auth?.role === "manager"}
      redirectTo="/admin/login"
    >
      {children}
    </RoleRedirect>
  );
};

/* ---------------------------------- */
/* Client Protected Route             */
/* ---------------------------------- */
export const ClientRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const client = getClientAuth();
  const { id } = useParams<{ id: string }>();
  const clientEventId = getClientEventId(client);
  const isLoggedIn = Boolean(clientEventId);
  const isRouteOwner = !id || clientEventId === String(id).trim();

  return (
    <RoleRedirect
      allow={Boolean(isLoggedIn && isRouteOwner)}
      redirectTo="/userlogin"
    >
      {children}
    </RoleRedirect>
  );
};

/* ---------------------------------- */
/* Admin Login Page Route             */
/* ---------------------------------- */
export const AdminLoginRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <AuthRedirect>
      {children}
    </AuthRedirect>
  );
};

/* ---------------------------------- */
/* Client Login Page Route            */
/* ---------------------------------- */
export const ClientLoginRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <AuthRedirect>
      {children}
    </AuthRedirect>
  );
};
