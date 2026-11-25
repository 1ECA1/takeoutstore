
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Boxes,
  Truck,
  BarChart3,
  UserRound,
  ClipboardList,
  Target,
  UserSearch,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface SidebarProps {
  onNavigate?: () => void;
}

const menuGroups = [
  {
    title: "OVERVIEW",
    items: [
      { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
      { name: "Analytics", path: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "COMMERCE",
    items: [
      { name: "Orders", path: "/admin/orders", icon: ShoppingCart },
      { name: "Products", path: "/admin/products", icon: Package },
      { name: "Categories", path: "/admin/categories", icon: Boxes },
      { name: "Inventory", path: "/admin/inventory", icon: Boxes },
      { name: "Suppliers", path: "/admin/suppliers", icon: Truck },
    ],
  },
  {
    title: "CUSTOMER RELATIONS",
    items: [
      { name: "Customers", path: "/admin/customers", icon: Users },
      { name: "Customer Insights", path: "/admin/insights", icon: UserSearch },
      { name: "Lead Management", path: "/admin/leads", icon: Target },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { name: "Staff", path: "/admin/staff", icon: UserRound },
      { name: "Activity Logs", path: "/admin/activity-logs", icon: ClipboardList },
    ],
  },
];

const Sidebar = ({ onNavigate }: SidebarProps) => {
  const { user } = useAuth();

  return (
    <aside className="flex h-full min-h-screen w-full flex-col overflow-y-auto bg-[#090B0A] text-white">
      <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold">
          E
        </div>
        <div>
          <h1 className="text-base font-bold tracking-wide">Enterprise</h1>
          <p className="text-[10px] uppercase tracking-[2px] text-white/40">
            Commerce Admin
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-7 px-3 py-6">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-3 px-3 text-[10px] font-bold tracking-[1.5px] text-white/35">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/admin"}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${
                        isActive
                          ? "bg-emerald-600/20 font-semibold text-emerald-400"
                          : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                      }`
                    }
                  >
                    <Icon size={18} strokeWidth={1.8} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600/20 text-sm font-bold text-emerald-400">
            {user?.name?.trim().charAt(0).toUpperCase() || "A"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {user?.name || "Administrator"}
            </p>
            <p className="mt-0.5 text-xs capitalize text-white/40">
              {user?.role || "admin"} account
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
