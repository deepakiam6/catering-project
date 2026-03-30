import { Routes, Route } from "react-router-dom";
import AdminLogin from "../pages/admin/AdminLogin";
import Dashboard from "../pages/admin/dashboard/Dashboard";
import AdminFoodView from "../pages/admin/dashboard/AdminFoodView";
import DishDetails from "../pages/user/DishDetails";
import BookFood from "../pages/admin/events/BookFood";
import CreateMahal from "../pages/admin/create-mahal/CreateMahal";
import Saving from "../pages/admin/events/Saving";
import UserLogin from "../pages/user/UserLogin";
import BookFoodDashboard from "../pages/user/BookFoodDashboard";
import Home from "../pages/user/Home.tsx";






export const AppRoutes = () => {
  return (
        
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/menu" element={<DishDetails />} />
      <Route path="/book-food/:id" element={<BookFood />} />
      <Route path="/create-mahal" element={<CreateMahal />} />
      <Route path="/create-mahal/:id" element={<CreateMahal />} />
      <Route path="/book-food/:id/saving" element={<Saving />} />
      <Route path="/userlogin" element={<UserLogin/>}/>
      <Route path="/book-food/:id/dashboard" element={<BookFoodDashboard />} />
      <Route path="/admin/food-view/:id" element={<AdminFoodView />} />



    </Routes>
    
  );
};
