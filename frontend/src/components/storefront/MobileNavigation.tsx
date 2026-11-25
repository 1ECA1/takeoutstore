
import {
  Home,
  LayoutGrid,
  ShoppingCart,
  ClipboardList,
  UserRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface MobileNavigationProps {
  cartCount: number;
}

const MobileNavigation = ({ cartCount }: MobileNavigationProps) => {
  const links = [
    { label: "Store", path: "/store", icon: Home },
    { label: "Categories", path: "/store/categories", icon: LayoutGrid },
    { label: "Cart", path: "/store/cart", icon: ShoppingCart },
    { label: "Orders", path: "/store/orders", icon: ClipboardList },
    { label: "Profile", path: "/store/profile", icon: UserRound },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-white/10 bg-brand-forest px-2 pb-[env(safe-area-inset-bottom)] pt-3 text-white shadow-[0_-8px_25px_rgba(0,0,0,0.12)] md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/store"}
              className={({ isActive }) =>
                `relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] transition ${
                  isActive
                    ? "text-white"
                    : "text-white/60 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon size={21} />
                    {link.label === "Cart" && cartCount > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-brand-forest">
                        {cartCount}
                      </span>
                    )}
                  </span>

                  <span className={isActive ? "font-semibold" : ""}>
                    {link.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;
