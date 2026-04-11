import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "../pages/admin/AdminLogin";
import Dashboard from "../pages/admin/dashboard/Dashboard";
import AdminFoodView from "../pages/admin/dashboard/AdminFoodView";
import DishDetails from "../pages/user/DishDetails";
import BookFood from "../pages/admin/events/BookFood";
import CreateMahal from "../pages/admin/create-mahal/CreateMahal";
import UserLogin from "../pages/user/UserLogin";
import BookFoodDashboard from "../pages/user/BookFoodDashboard";
import Home from "../pages/user/Home.tsx";
import UserEditFood from "../pages/user/UserEditFood";
import ManagerDashboard from "../pages/manager/ManagerDashboard";    // ← src/pages/manager/ManagerDashboard.tsx
import { AdminRoute, ManagerRoute } from "./ProtectedRoutes";        // ← src/routes/ProtectedRoutes.tsx

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/menu" element={<DishDetails />} />
      <Route path="/userlogin" element={<UserLogin />} />

      {/* Admin protected */}
      <Route path="/admin/dashboard" element={
        <AdminRoute><Dashboard /></AdminRoute>
      } />
      <Route path="/admin/food-view/:id" element={
        <AdminRoute><AdminFoodView /></AdminRoute>
      } />
      <Route path="/create-mahal" element={
        <AdminRoute><CreateMahal /></AdminRoute>
      } />
      <Route path="/create-mahal/:id" element={
        <AdminRoute><CreateMahal /></AdminRoute>
      } />

      {/* Manager protected */}
      <Route path="/manager/dashboard" element={
        <ManagerRoute><ManagerDashboard /></ManagerRoute>
      } />

      {/* Shared */}
      <Route path="/book-food/:id" element={<BookFood />} />
      <Route path="/book-food/:id/dashboard" element={<BookFoodDashboard />} />
      <Route path="/user-edit-food/:id" element={<UserEditFood />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
};