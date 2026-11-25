
import { Link, NavLink } from "react-router-dom";
import {
  Store,
  ShoppingCart,
  ClipboardList,
  UserRound,
  LogIn,
  ChevronRight,
  ShieldCheck,
  LayoutGrid,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";

interface StoreSidebarProps {
  cartCount: number;
  onCartClick: () => void;
}

const StoreSidebar = ({
  cartCount,
  onCartClick,
}: StoreSidebarProps) => {
  const { user, isAuthenticated } = useAuth();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-200 ${
      isActive
        ? "bg-white text-brand-forest shadow-sm"
        : "text-white/75 hover:bg-white/10 hover:text-white"
    }`;

  const iconClass = (isActive: boolean) =>
    isActive ? "text-brand-forest" : "text-white/70 group-hover:text-white";

  return (
  <aside className="fixed inset-y-0 left-0 z-40 hidden w-[270px] lg:block">
  <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#1B3C2B] text-white shadow-xl">
        {/* Brand */}
        <div className="border-b border-white/10 px-6 py-7">
          <Link to="/store" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-forest">
              <Store size={23} />
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-wide">
                Enterprise
              </h2>
              <p className="text-xs tracking-[0.18em] text-white/60">
                DIGITAL STORE
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-7">
          <p className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
            Shopping
          </p>

          <nav className="space-y-2">
            <NavLink to="/store" end className={navClass}>
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-3">
                    <LayoutGrid size={19} className={iconClass(isActive)} />
                    <span className="text-sm font-semibold">
                      Shop Products
                    </span>
                  </span>
                  {isActive && <ChevronRight size={17} />}
                </>
              )}
            </NavLink>

            <button
              type="button"
              onClick={onCartClick}
              className="group flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-white/75 transition-all duration-200 hover:bg-white/10 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <ShoppingCart size={19} className="text-white/70 group-hover:text-white" />
                <span className="text-sm font-semibold">
                  Shopping Cart
                </span>
              </span>

              {cartCount > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-2 text-xs font-bold text-brand-forest">
                  {cartCount}
                </span>
              )}
            </button>

            <NavLink to="/store/orders" className={navClass}>
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-3">
                    <ClipboardList size={19} className={iconClass(isActive)} />
                    <span className="text-sm font-semibold">
                      My Orders
                    </span>
                  </span>
                  {isActive && <ChevronRight size={17} />}
                </>
              )}
            </NavLink>

            <NavLink to="/store/profile" className={navClass}>
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-3">
                    <UserRound size={19} className={iconClass(isActive)} />
                    <span className="text-sm font-semibold">
                      My Profile
                    </span>
                  </span>
                  {isActive && <ChevronRight size={17} />}
                </>
              )}
            </NavLink>
          </nav>

          <div className="my-8 border-t border-white/10" />

          <p className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
            Your Experience
          </p>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-[#A7D6B8]" />
              <p className="text-sm font-semibold text-white">
                Secure Shopping
              </p>
            </div>

            <p className="mt-2 text-xs leading-5 text-white/55">
              Enjoy a convenient and secure shopping experience with us.
            </p>
          </div>
        </div>

        {/* Account section */}
        <div className="border-t border-white/10 bg-black/10 p-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-forest">
                <UserRound size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">
                  {user?.name}
                </p>
                <p className="truncate text-xs capitalize text-white/55">
                  {user?.role} account
                </p>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-brand-forest transition hover:bg-brand-mint"
            >
              <LogIn size={18} />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
};

export default StoreSidebar;
