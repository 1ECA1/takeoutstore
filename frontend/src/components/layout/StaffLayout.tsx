
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import StaffSidebar from "./StaffSidebar";
import Topbar from "./Topbar";

const pageTitles: Record<string, string> = {
  "/staff": "Staff Dashboard",
  "/staff/orders": "Order Management",
  "/staff/products": "Product Management",
  "/staff/inventory": "Inventory Management",
  "/staff/customers": "Customer Management",
  "/staff/suppliers": "Supplier Management",
  "/staff/profile": "My Profile",
};

const StaffLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] || "Staff Workspace";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F6F7F6]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <StaffSidebar />
      </aside>

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <StaffSidebar onNavigate={() => setMobileMenuOpen(false)} />
      </aside>

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

export default StaffLayout;
