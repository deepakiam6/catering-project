import { Navigate } from "react-router-dom";
import { getAuth } from "../utils/auth";
/* ── Admin-only route ── */
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = getAuth();
  if (!auth) return <Navigate to="/admin/login" replace />;
  if (auth.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-md border border-red-100 p-8 max-w-sm text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-500" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Access Denied</h2>
          <p className="text-sm text-gray-500 mb-5">You don't have permission to view this page.</p>
          <a href="/admin/login" className="inline-block bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
            Back to Login
          </a>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

/* ── Manager-only route ── */
export const ManagerRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = getAuth();
  if (!auth) return <Navigate to="/admin/login" replace />;
  if (auth.role !== "manager") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-md border border-red-100 p-8 max-w-sm text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-500" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Access Denied</h2>
          <p className="text-sm text-gray-500 mb-5">You don't have permission to view this page.</p>
          <a href="/admin/login" className="inline-block bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
            Back to Login
          </a>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};