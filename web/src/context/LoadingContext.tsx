import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { API_LOADING_EVENT_NAME } from "../services/api";

type LoadingContextValue = {
  isLoading: boolean;
  startLoading: (key?: string) => void;
  stopLoading: (key?: string) => void;
  withLoading: <T>(work: Promise<T> | (() => Promise<T>), key?: string) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

const ROUTE_LOADING_KEY = "__route_change__";
const ROUTE_LOADING_MIN_MS = 300;

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const activeKeysRef = useRef(new Set<string>());
  const routeStartRef = useRef<number>(0);
  const routeFirstPaintRef = useRef(true);
  const [isLoading, setIsLoading] = useState(false);

  const syncLoadingState = useCallback(() => {
    setIsLoading(activeKeysRef.current.size > 0);
  }, []);

  const startLoading = useCallback(
    (key = `loading-${Date.now()}-${Math.random()}`) => {
      activeKeysRef.current.add(key);
      syncLoadingState();
    },
    [syncLoadingState]
  );

  const stopLoading = useCallback(
    (key = ROUTE_LOADING_KEY) => {
      activeKeysRef.current.delete(key);
      syncLoadingState();
    },
    [syncLoadingState]
  );

  const withLoading = useCallback(
    async <T,>(work: Promise<T> | (() => Promise<T>), key = `loading-${Date.now()}-${Math.random()}`) => {
      startLoading(key);
      try {
        const task = typeof work === "function" ? work() : work;
        return await task;
      } finally {
        stopLoading(key);
      }
    },
    [startLoading, stopLoading]
  );

  useEffect(() => {
    if (routeFirstPaintRef.current) {
      routeFirstPaintRef.current = false;
      return;
    }

    routeStartRef.current = Date.now();
    startLoading(ROUTE_LOADING_KEY);

    const timer = window.setTimeout(() => {
      const elapsed = Date.now() - routeStartRef.current;
      const remaining = Math.max(0, ROUTE_LOADING_MIN_MS - elapsed);

      window.setTimeout(() => {
        stopLoading(ROUTE_LOADING_KEY);
      }, remaining);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.key, location.pathname, location.search, startLoading, stopLoading]);

  useEffect(() => {
    const handleApiLoading = (event: Event) => {
      const customEvent = event as CustomEvent<{ active?: boolean }>;

      if (customEvent.detail?.active) {
        startLoading("api-loading");
        return;
      }

      stopLoading("api-loading");
    };

    window.addEventListener(API_LOADING_EVENT_NAME, handleApiLoading);
    return () => window.removeEventListener(API_LOADING_EVENT_NAME, handleApiLoading);
  }, [startLoading, stopLoading]);

  const value = useMemo<LoadingContextValue>(
    () => ({
      isLoading,
      startLoading,
      stopLoading,
      withLoading,
    }),
    [isLoading, startLoading, stopLoading, withLoading]
  );

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};

export const useLoading = () => {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }

  return context;
};
