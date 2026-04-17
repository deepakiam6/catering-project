import { Navigate, Route, Routes } from "react-router-dom";
import AdminLogin from "../pages/admin/AdminLogin";
import CreateMahal from "../pages/admin/create-mahal/CreateMahal";
import AdminFoodView from "../pages/admin/dashboard/AdminFoodView";
import AssignVendor from "../pages/admin/dashboard/AssignVendor";
import Dashboard from "../pages/admin/dashboard/Dashboard";
import EventSheets from "../pages/admin/dashboard/Eventsheets";
import BookFood from "../pages/admin/events/BookFood";
import ManagerDashboard from "../pages/manager/ManagerDashboard";
import BookFoodDashboard from "../pages/user/BookFoodDashboard";
import DishDetails from "../pages/user/DishDetails";
import Home from "../pages/user/Home";
import UserEditFood from "../pages/user/UserEditFood";
import UserLogin from "../pages/user/UserLogin";
import {
  AdminLoginRoute,
  AdminRoute,
  ClientLoginRoute,
  ClientRoute,
  ManagerRoute,
} from "./ProtectedRoutes";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/admin/login"
        element={
          <AdminLoginRoute>
            <AdminLogin />
          </AdminLoginRoute>
        }
      />
      <Route path="/menu" element={<DishDetails />} />
      <Route
        path="/userlogin"
        element={
          <ClientLoginRoute>
            <UserLogin />
          </ClientLoginRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/food-view/:id"
        element={
          <AdminRoute>
            <AdminFoodView />
          </AdminRoute>
        }
      />
      <Route
        path="/assign-vendor/:id"
        element={
          <AdminRoute>
            <AssignVendor />
          </AdminRoute>
        }
      />
      <Route
        path="/event-sheets"
        element={
          <AdminRoute>
            <EventSheets />
          </AdminRoute>
        }
      />
      <Route
        path="/create-mahal"
        element={
          <AdminRoute>
            <CreateMahal />
          </AdminRoute>
        }
      />
      <Route
        path="/create-mahal/:id"
        element={
          <AdminRoute>
            <CreateMahal />
          </AdminRoute>
        }
      />

      <Route
        path="/manager/dashboard"
        element={
          <ManagerRoute>
            <ManagerDashboard />
          </ManagerRoute>
        }
      />

      <Route path="/book-food/:id" element={<BookFood />} />
      <Route
        path="/book-food/:id/dashboard"
        element={
          <ClientRoute>
            <BookFoodDashboard />
          </ClientRoute>
        }
      />
      <Route
        path="/user-edit-food/:id"
        element={
          <ClientRoute>
            <UserEditFood />
          </ClientRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
