import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCompanies from "./pages/admin/AdminCompanies";
import AdminFinancial from "./pages/admin/AdminFinancial";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminSettings from "./pages/admin/AdminSettings";

import ClientLayout from "./layouts/ClientLayout";
import ClientDashboard from "./pages/panel/ClientDashboard";
import ClientProducts from "./pages/panel/ClientProducts";
import ClientCategories from "./pages/panel/ClientCategories";
import ClientOrders from "./pages/panel/ClientOrders";
import ClientCustomers from "./pages/panel/ClientCustomers";
import ClientCoupons from "./pages/panel/ClientCoupons";
import ClientBanners from "./pages/panel/ClientBanners";
import ClientSettings from "./pages/panel/ClientSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Dashboard redirect */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            {/* Admin Master */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="master_admin"><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="companies" element={<AdminCompanies />} />
              <Route path="financial" element={<AdminFinancial />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="plans" element={<AdminPlans />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Client Panel */}
            <Route path="/panel" element={<ProtectedRoute allowedRoles={["company_admin", "company_staff"]}><ClientLayout /></ProtectedRoute>}>
              <Route index element={<ClientDashboard />} />
              <Route path="products" element={<ClientProducts />} />
              <Route path="categories" element={<ClientCategories />} />
              <Route path="orders" element={<ClientOrders />} />
              <Route path="customers" element={<ClientCustomers />} />
              <Route path="coupons" element={<ClientCoupons />} />
              <Route path="banners" element={<ClientBanners />} />
              <Route path="settings" element={<ClientSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
