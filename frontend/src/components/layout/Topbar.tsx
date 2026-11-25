
import { Bell, LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
}

const Topbar = ({ title, onMenuClick }: TopbarProps) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-[#E4E6E5] bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-[#1A1D1C] hover:bg-[#F1F3F1] lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={23} />
        </button>

        <h2 className="truncate text-lg font-bold text-[#1A1D1C] sm:text-xl">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden w-52 items-center gap-2 rounded-lg border border-[#E4E6E5] bg-[#F8F9F8] px-3 py-2 md:flex lg:w-64">
          <Search size={16} className="text-gray-400" />
          <input
            type="search"
            placeholder="Search anything..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            aria-label="Search"
          />
        </div>

        <button
          type="button"
          className="relative rounded-lg p-2 text-gray-500 transition hover:bg-[#F1F3F1]"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={19} />
        </button>

        <div className="hidden h-7 w-px bg-gray-200 sm:block" />

        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E6F0EA] text-sm font-bold text-[#1B3C2B]">
            {user?.name?.trim().charAt(0).toUpperCase() || "A"}
          </div>
          <div className="hidden text-right xl:block">
            <p className="max-w-32 truncate text-xs font-semibold text-[#1A1D1C]">
              {user?.name || "Administrator"}
            </p>
            <p className="text-[11px] capitalize text-gray-400">
              {user?.role || "admin"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
          className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
