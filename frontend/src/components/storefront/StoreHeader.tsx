
import { useState } from "react";
import {
  Search,
  ShoppingCart,
  UserRound,
  ChevronDown,
  ClipboardList,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  LayoutDashboard,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface StoreHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  cartCount: number;
  onCartClick: () => void;
}

const StoreHeader = ({
  searchQuery,
  onSearchChange,
  cartCount,
  onCartClick,
}: StoreHeaderProps) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const handleSignOut = () => {
    setAccountMenuOpen(false);
    logout();
    navigate("/store", { replace: true });
  };

  const dashboardPath =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "staff"
        ? "/staff"
        : "/store";

  return (
    <header className="sticky top-0 z-40 border-b border-brand-border bg-white">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/store"
          className="shrink-0 text-lg font-bold text-brand-forest sm:text-xl"
        >
          Enterprise Store
        </Link>

        <div className="mx-auto hidden max-w-2xl flex-1 items-center rounded-xl bg-brand-gray px-4 md:flex">
          <Search size={19} className="shrink-0 text-brand-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="w-full bg-transparent px-3 py-3 text-sm outline-none"
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountMenuOpen((open) => !open)}
              aria-label="Account menu"
              aria-expanded={accountMenuOpen}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-brand-forest transition hover:bg-brand-gray md:px-3"
            >
              <UserRound size={20} />

              <span className="hidden whitespace-nowrap md:inline">
                {isAuthenticated
                  ? user?.name?.split(" ")[0]
                  : "Login / Signup"}
              </span>

              <ChevronDown
                size={15}
                className={`hidden transition md:block ${
                  accountMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {accountMenuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close account menu"
                  onClick={() => setAccountMenuOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />

                <div className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-xl border border-brand-border bg-white shadow-xl">
                  {isAuthenticated ? (
                    <>
                      <div className="border-b border-brand-border bg-brand-gray/60 px-4 py-4">
                        <p className="truncate text-sm font-bold text-brand-text">
                          {user?.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-brand-muted">
                          {user?.email}
                        </p>
                        <p className="mt-2 text-xs font-semibold capitalize text-brand-sage">
                          {user?.role} account
                        </p>
                      </div>

                      {user?.role === "customer" ? (
                        <div className="p-2">
                          <Link
                            to="/store/orders"
                            onClick={() => setAccountMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-brand-text transition hover:bg-brand-gray"
                          >
                            <ClipboardList size={18} />
                            My Orders
                          </Link>

                          <Link
                            to="/store/profile"
                            onClick={() => setAccountMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-brand-text transition hover:bg-brand-gray"
                          >
                            <Settings size={18} />
                            My Profile
                          </Link>
                        </div>
                      ) : (
                        <div className="p-2">
                          <Link
                            to={dashboardPath}
                            onClick={() => setAccountMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-brand-text transition hover:bg-brand-gray"
                          >
                            <LayoutDashboard size={18} />
                            Go to Dashboard
                          </Link>
                        </div>
                      )}

                      <div className="border-t border-brand-border p-2">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-brand-warning transition hover:bg-brand-gray"
                        >
                          <LogOut size={18} />
                          Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-2">
                      <Link
                        to="/login"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-brand-text transition hover:bg-brand-gray"
                      >
                        <LogIn size={18} />
                        Sign In
                      </Link>

                      <Link
                        to="/register"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-brand-forest transition hover:bg-brand-gray"
                      >
                        <UserPlus size={18} />
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onCartClick}
            aria-label={`Open cart, ${cartCount} items`}
            className="relative flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-brand-forest transition hover:bg-brand-gray md:px-3"
          >
            <ShoppingCart size={21} />
            <span className="hidden md:inline">Cart</span>

            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-forest px-1 text-xs font-semibold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <div className="flex items-center rounded-xl bg-brand-gray px-3">
          <Search size={18} className="text-brand-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="w-full bg-transparent px-3 py-3 text-sm outline-none"
          />
        </div>
      </div>
    </header>
  );
};

export default StoreHeader;
