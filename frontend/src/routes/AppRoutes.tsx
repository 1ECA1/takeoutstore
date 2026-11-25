import { Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import StaffDashboard from "../pages/staff/StaffDashboard";

import Dashboard from "../pages/admin/Dashboard";
import LeadManagement from "../pages/admin/LeadManagement";
import CustomerManagement from "../pages/admin/CustomerManagement";
import CustomerInsights from "../pages/admin/CustomerInsights";
import Analytics from "../pages/admin/Analytics";
import InventoryManagement from "../pages/admin/InventoryManagement";
import SupplierManagement from "../pages/admin/SupplierManagement";
import OrderManagement from "../pages/admin/OrderManagement";
import StaffManagement from "../pages/admin/StaffManagement";
import ActivityLogs from "../pages/admin/ActivityLogs";
import ProductManagement from "../pages/admin/ProductManagement";
import CategoryManagement from "../pages/admin/CategoryManagement";
import StaffProfile from "../pages/staff/StaffProfile";

import AdminLayout from "../components/layout/AdminLayout";
import StaffLayout from "../components/layout/StaffLayout";
import StorefrontLayout from "../components/layout/storefront/StorefrontLayout";

import ProtectedRoute from "./ProtectedRoute";
import RoleBasedRoute from "./RoleBasedRoute";
import { useAuth } from "../hooks/useAuth";

interface StaffPermissionRouteProps {
  permissions: string[];
  children: React.ReactNode;
}

const StaffPermissionRoute = ({
  permissions,
  children,
}: StaffPermissionRouteProps) => {
  const { user } = useAuth();

  const hasPermission = permissions.some((permission) =>
    user?.permissions?.includes(permission),
  );

  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const RoleRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/store" replace />;
  }

  switch (user.role) {
    case "admin":
      return <Navigate to="/admin" replace />;
    case "staff":
      return <Navigate to="/staff" replace />;
    case "customer":
      return <Navigate to="/store" replace />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />

      <Route path="/store/*" element={<StorefrontLayout />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleBasedRoute allowedRoles={["customer"]} />}>
          <Route path="/customer" element={<Navigate to="/store" replace />} />
        </Route>

        {/* Staff Portal */}
        {/* Staff Portal */}
        <Route element={<RoleBasedRoute allowedRoles={["staff"]} />}>
          <Route element={<StaffLayout />}>
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/staff/profile" element={<StaffProfile />} />

            <Route
              path="/staff/orders"
              element={
                <StaffPermissionRoute permissions={["orders.view"]}>
                  <OrderManagement />
                </StaffPermissionRoute>
              }
            />

            <Route
              path="/staff/products"
              element={
                <StaffPermissionRoute
                  permissions={[
                    "products.view",
                    "products.create",
                    "products.update",
                    "products.delete",
                  ]}
                >
                  <ProductManagement />
                </StaffPermissionRoute>
              }
            />

            <Route
              path="/staff/inventory"
              element={
                <StaffPermissionRoute
                  permissions={[
                    "inventory.view",
                    "inventory.adjust",
                    "inventory.logs.view",
                    "inventory.analytics.view",
                  ]}
                >
                  <InventoryManagement />
                </StaffPermissionRoute>
              }
            />

            <Route
              path="/staff/customers"
              element={
                <StaffPermissionRoute
                  permissions={[
                    "customers.view",
                    "customers.purchase_history.view",
                    "customers.insights.view",
                    "customers.activity.view",
                    "customers.segments.view",
                  ]}
                >
                  <CustomerManagement />
                </StaffPermissionRoute>
              }
            />

            <Route
              path="/staff/suppliers"
              element={
                <StaffPermissionRoute
                  permissions={[
                    "suppliers.view",
                    "suppliers.create",
                    "suppliers.update",
                    "suppliers.delete",
                    "suppliers.analytics.view",
                  ]}
                >
                  <SupplierManagement />
                </StaffPermissionRoute>
              }
            />
          </Route>
        </Route>

        {/* Admin Portal — unchanged */}
        <Route element={<RoleBasedRoute allowedRoles={["admin"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/leads" element={<LeadManagement />} />
            <Route path="/admin/customers" element={<CustomerManagement />} />
            <Route path="/admin/insights" element={<CustomerInsights />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/suppliers" element={<SupplierManagement />} />
            <Route path="/admin/inventory" element={<InventoryManagement />} />
            <Route path="/admin/orders" element={<OrderManagement />} />
            <Route path="/admin/staff" element={<StaffManagement />} />
            <Route path="/admin/activity-logs" element={<ActivityLogs />} />
            <Route path="/admin/products" element={<ProductManagement />} />
            <Route path="/admin/categories" element={<CategoryManagement />} />
          </Route>
        </Route>
      </Route>

      <Route
        path="/unauthorized"
        element={
          <main className="flex min-h-screen items-center justify-center bg-brand-gray">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-brand-warning">
                Access Denied
              </h1>
              <p className="mt-3 text-brand-muted">
                You do not have permission to access this page.
              </p>
              <a
                href="/"
                className="mt-5 inline-block text-brand-forest underline"
              >
                Return to your dashboard
              </a>
            </div>
          </main>
        }
      />

      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
};

export default AppRoutes;
