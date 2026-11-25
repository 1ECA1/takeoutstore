
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/leads": "Lead Management",
  "/admin/customers": "Customer Management",
  "/admin/insights": "Customer Insights",
  "/admin/analytics": "Analytics",
  "/admin/inventory": "Inventory Management",
  "/admin/suppliers": "Supplier Management",
  "/admin/orders": "Order Management",
  "/admin/staff": "Staff Management",
  "/admin/activity-logs": "Activity Logs",
  "/admin/products": "Product Management",
  "/admin/categories": "Category Management",
};

const AdminLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] || "Admin Dashboard";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F6F7F6]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar backdrop */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:pl-64">
        <Topbar
          title={title}
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        <main className="min-w-0 p-4 sm:p-6 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
