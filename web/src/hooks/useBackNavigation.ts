import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getDefaultRouteForRole, getDefaultRouteForSession } from "../utils/auth";

type BackNavigationOptions = {
  role?: "admin" | "manager" | "client";
  fallbackPath?: string;
  replace?: boolean;
};

export const useBackNavigation = (options: BackNavigationOptions = {}) => {
  const navigate = useNavigate();

  return useCallback(() => {
    const historyState = window.history.state as { idx?: number } | null;
    const canGoBack = typeof historyState?.idx === "number" && historyState.idx > 0;

    if (canGoBack) {
      navigate(-1);
      return;
    }

    const fallbackPath =
      options.fallbackPath ??
      getDefaultRouteForRole(options.role) ??
      getDefaultRouteForSession();

    navigate(fallbackPath, { replace: options.replace ?? true });
  }, [navigate, options.fallbackPath, options.replace, options.role]);
};
