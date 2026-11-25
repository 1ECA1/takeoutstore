
import { useCallback, useEffect, useState } from "react";
import {
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Truck,
  ClipboardList,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

interface DashboardStats {
  orders: { total: number; pending: number } | null;
  products: { total: number; active: number } | null;
  inventory: { outOfStock: number; lowStock: number } | null;
  customers: { total: number } | null;
  suppliers: { total: number; active: number } | null;
}

interface RecentActivity {
  _id: string;
  action: string;
  description: string;
  createdAt: string;
}

interface DashboardResponse {
  staff: {
    name: string;
    email: string;
    role: string;
    status: string;
    permissionCount: number;
  };
  stats: DashboardStats;
  recentActivities: RecentActivity[];
}

const emptyStats: DashboardStats = {
  orders: null,
  products: null,
  inventory: null,
  customers: null,
  suppliers: null,
};

const StaffDashboard = () => {
  const { user } = useAuth();
  const permissions = user?.permissions || [];

  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/staff/dashboard");

      setDashboard(response.data.data);
    } catch (err: unknown) {
      console.error("Staff dashboard error:", err);

      setError("Unable to load dashboard information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = dashboard?.stats || emptyStats;

  const hasAny = (items: string[]) =>
    items.some((permission) => permissions.includes(permission));

  const responsibilities = [
    {
      title: "Order Management",
      description: "View customer orders and manage order statuses.",
      path: "/staff/orders",
      icon: ShoppingCart,
      color: "bg-blue-50 text-blue-600",
      visible: permissions.includes("orders.view"),
    },
    {
      title: "Product Management",
      description: "Manage products, product information, and images.",
      path: "/staff/products",
      icon: Package,
      color: "bg-purple-50 text-purple-600",
      visible: hasAny([
        "products.view",
        "products.create",
        "products.update",
        "products.delete",
      ]),
    },
    {
      title: "Inventory Management",
      description:
        "Monitor stock, adjust inventory, and review inventory records.",
      path: "/staff/inventory",
      icon: Boxes,
      color: "bg-amber-50 text-amber-600",
      visible: hasAny([
        "inventory.view",
        "inventory.adjust",
        "inventory.logs.view",
        "inventory.analytics.view",
      ]),
    },
    {
      title: "Customer Management",
      description:
        "Access customer records and available customer insights.",
      path: "/staff/customers",
      icon: Users,
      color: "bg-emerald-50 text-emerald-600",
      visible: hasAny([
        "customers.view",
        "customers.segments.view",
      ]),
    },
    {
      title: "Supplier Management",
      description: "Manage supplier records and supplier analytics.",
      path: "/staff/suppliers",
      icon: Truck,
      color: "bg-orange-50 text-orange-600",
      visible: hasAny([
        "suppliers.view",
        "suppliers.create",
        "suppliers.update",
        "suppliers.delete",
        "suppliers.analytics.view",
      ]),
    },
  ];

  const permissionLabels: Record<string, string> = {
    "orders.view": "View orders",
    "orders.update_status": "Update order status",
    "products.view": "View products",
    "products.create": "Create products",
    "products.update": "Update products",
    "products.delete": "Delete products",
    "products.upload_images": "Upload product images",
    "inventory.view": "View inventory",
    "inventory.adjust": "Adjust inventory",
    "inventory.logs.view": "View inventory logs",
    "inventory.analytics.view": "View inventory analytics",
    "customers.view": "View customers",
    "customers.purchase_history.view": "View purchase history",
    "customers.insights.view": "View customer insights",
    "customers.activity.view": "View customer activity",
    "customers.segments.view": "View customer segments",
    "suppliers.view": "View suppliers",
    "suppliers.create": "Create suppliers",
    "suppliers.update": "Update suppliers",
    "suppliers.delete": "Delete suppliers",
    "suppliers.analytics.view": "View supplier analytics",
  };

  const assignedResponsibilities = responsibilities.filter(
    (item) => item.visible
  );

  const statCards = [
    ...(stats.orders
      ? [
          {
            title: "Total Orders",
            value: stats.orders.total,
            subtitle: `${stats.orders.pending} pending orders`,
            icon: ShoppingCart,
            color: "bg-blue-50 text-blue-600",
          },
        ]
      : []),
    ...(stats.products
      ? [
          {
            title: "Total Products",
            value: stats.products.total,
            subtitle: `${stats.products.active} active products`,
            icon: Package,
            color: "bg-purple-50 text-purple-600",
          },
        ]
      : []),
    ...(stats.inventory
      ? [
          {
            title: "Low Stock Items",
            value: stats.inventory.lowStock,
            subtitle: `${stats.inventory.outOfStock} out of stock`,
            icon: Boxes,
            color: "bg-amber-50 text-amber-600",
          },
        ]
      : []),
    ...(stats.customers
      ? [
          {
            title: "Total Customers",
            value: stats.customers.total,
            subtitle: "Registered customers",
            icon: Users,
            color: "bg-emerald-50 text-emerald-600",
          },
        ]
      : []),
    ...(stats.suppliers
      ? [
          {
            title: "Total Suppliers",
            value: stats.suppliers.total,
            subtitle: `${stats.suppliers.active} active suppliers`,
            icon: Truck,
            color: "bg-orange-50 text-orange-600",
          },
        ]
      : []),
  ];

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString();
  };

  const getActionLabel = (action: string) =>
    action.replace(/[._]/g, " ").replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl bg-[#1B3C2B] p-7 text-white shadow-sm sm:p-9">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-emerald-200">
              STAFF WORKSPACE
            </p>

            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
              Welcome, {user?.name || "Staff Member"}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
              Your workspace is ready. Access your assigned responsibilities
              and carry out your store operations from here.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-full bg-white/10 px-3 py-1.5">
                Account: {dashboard?.staff.status || user?.status || "Active"}
              </span>

              <span className="rounded-full bg-white/10 px-3 py-1.5">
                {permissions.length} assigned permissions
              </span>
            </div>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <ClipboardList size={32} className="text-emerald-200" />
          </div>
        </div>
      </section>

      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle size={18} />
            {error}
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="text-sm font-semibold text-red-700 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-brand-dark">
              Workspace Overview
            </h2>
            <p className="mt-1 text-sm text-brand-muted">
              Live operational information based on your assigned access.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-brand-gray disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-brand-border bg-white p-10 text-center text-sm text-brand-muted">
            Loading your dashboard...
          </div>
        ) : statCards.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="rounded-xl border border-brand-border bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-brand-muted">
                      {card.title}
                    </p>

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}
                    >
                      <Icon size={20} />
                    </div>
                  </div>

                  <p className="mt-4 text-3xl font-bold text-brand-dark">
                    {card.value.toLocaleString()}
                  </p>

                  <p className="mt-2 text-xs text-brand-muted">
                    {card.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          !error && (
            <div className="rounded-xl border border-dashed border-brand-border bg-white p-8 text-center">
              <ShieldCheck
                size={30}
                className="mx-auto text-brand-muted"
              />
              <p className="mt-3 text-sm text-brand-muted">
                No dashboard statistics are available for your assigned
                permissions.
              </p>
            </div>
          )
        )}
      </section>

      <section>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-brand-dark">
            My Responsibilities
          </h2>
          <p className="mt-1 text-sm text-brand-muted">
            Modules and duties assigned to your account.
          </p>
        </div>

        {assignedResponsibilities.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {assignedResponsibilities.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.path}
                  className="rounded-xl border border-brand-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}
                    >
                      <Icon size={21} />
                    </div>

                    <ShieldCheck size={19} className="text-emerald-600" />
                  </div>

                  <h3 className="mt-5 font-bold text-brand-dark">
                    {item.title}
                  </h3>

                  <p className="mt-2 min-h-10 text-sm leading-5 text-brand-muted">
                    {item.description}
                  </p>

                  <Link
                    to={item.path}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-forest hover:text-brand-sage"
                  >
                    Open workspace
                    <ArrowRight size={16} />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-brand-border bg-white px-6 py-12 text-center">
            <ShieldCheck size={36} className="mx-auto text-brand-muted" />

            <h3 className="mt-4 font-semibold text-brand-dark">
              No responsibilities assigned yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-brand-muted">
              Your administrator has not assigned any operational permissions
              to your account. Contact your administrator to get access to
              your work modules.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-mint text-brand-forest">
            <Clock size={21} />
          </div>

          <div>
            <h2 className="font-bold text-brand-dark">My Recent Activity</h2>
            <p className="text-sm text-brand-muted">
              Recent actions performed using your staff account.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="mt-5 text-sm text-brand-muted">
            Loading recent activity...
          </p>
        ) : dashboard?.recentActivities?.length ? (
          <div className="mt-5 divide-y divide-brand-border">
            {dashboard.recentActivities.map((activity) => (
              <div
                key={activity._id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-brand-dark">
                    {getActionLabel(activity.action)}
                  </p>

                  <p className="mt-1 text-sm text-brand-muted">
                    {activity.description}
                  </p>
                </div>

                <span className="shrink-0 text-xs text-brand-muted">
                  {formatDate(activity.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-lg bg-brand-gray p-4 text-sm text-brand-muted">
            No recent activities have been recorded for your account yet.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-mint text-brand-forest">
            <ShieldCheck size={21} />
          </div>

          <div>
            <h2 className="font-bold text-brand-dark">
              My Assigned Permissions
            </h2>
            <p className="text-sm text-brand-muted">
              Your administrator controls these access rights.
            </p>
          </div>
        </div>

        {permissions.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <span
                key={permission}
                className="rounded-lg border border-brand-border bg-brand-gray px-3 py-2 text-xs font-medium text-brand-dark"
              >
                {permissionLabels[permission] || permission}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-brand-muted">
            No permissions have been assigned to your account.
          </p>
        )}
      </section>
    </div>
  );
};

export default StaffDashboard;
