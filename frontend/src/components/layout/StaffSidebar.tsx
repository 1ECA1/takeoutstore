
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Truck,
  UserRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface StaffSidebarProps {
  onNavigate?: () => void;
}

const StaffSidebar = ({ onNavigate }: StaffSidebarProps) => {
  const { user } = useAuth();
  const permissions = user?.permissions || [];

  const hasAny = (items: string[]) =>
    items.some((permission) => permissions.includes(permission));

  const menuGroups = [
    {
      title: "WORKSPACE",
      items: [
        {
          name: "Dashboard",
          path: "/staff",
          icon: LayoutDashboard,
          visible: true,
        },
      ],
    },
    {
      title: "MY RESPONSIBILITIES",
      items: [
        {
          name: "Orders",
          path: "/staff/orders",
          icon: ShoppingCart,
          visible: permissions.includes("orders.view"),
        },
        {
          name: "Products",
          path: "/staff/products",
          icon: Package,
          visible: hasAny([
            "products.view",
            "products.create",
            "products.update",
            "products.delete",
          ]),
        },
        {
          name: "Inventory",
          path: "/staff/inventory",
          icon: Boxes,
          visible: hasAny([
            "inventory.view",
            "inventory.adjust",
            "inventory.logs.view",
            "inventory.analytics.view",
          ]),
        },
        {
          name: "Customers",
          path: "/staff/customers",
          icon: Users,
          visible: hasAny([
            "customers.view",
            "customers.segments.view",
          ]),
        },
        {
          name: "Suppliers",
          path: "/staff/suppliers",
          icon: Truck,
          visible: hasAny([
            "suppliers.view",
            "suppliers.create",
            "suppliers.update",
            "suppliers.delete",
            "suppliers.analytics.view",
          ]),
        },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        {
          name: "My Profile",
          path: "/staff/profile",
          icon: UserRound,
          visible: true,
        },
      ],
    },
  ];

  return (
    <aside className="flex h-full min-h-screen w-full flex-col overflow-y-auto bg-[#090B0A] text-white">
      <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold">
          E
        </div>
        <div>
          <h1 className="text-base font-bold tracking-wide">Enterprise</h1>
          <p className="text-[10px] uppercase tracking-[2px] text-white/40">
            Staff Portal
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-7 px-3 py-6">
        {menuGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.visible);

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title}>
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[1.5px] text-white/35">
                {group.title}
              </p>

              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/staff"}
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
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600/20 text-sm font-bold text-emerald-400">
            {user?.name?.trim().charAt(0).toUpperCase() || "S"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {user?.name || "Staff Member"}
            </p>
            <p className="mt-0.5 text-xs capitalize text-white/40">
              {user?.role || "staff"} account
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default StaffSidebar;
