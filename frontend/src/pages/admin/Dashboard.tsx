
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Wallet,
  ShoppingBag,
  Users,
  TrendingUp,
  Package,
  Boxes,
  RefreshCw,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

interface DashboardData {
  products: { total: number; active: number };
  customers: { total: number };
  orders: {
    total: number;
    paid: number;
    pending: number;
    cancelled: number;
  };
  revenue: { total: number; averageOrderValue: number };
  inventory: { totalStock: number; totalValue: number };
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    customer?: { name?: string; email?: string };
    totalAmount: number;
    paymentStatus: string;
    orderStatus: string;
    createdAt: string;
  }>;
}

interface SalesReport {
  _id: string;
  totalOrders: number;
  totalRevenue: number;
}

interface BestSeller {
  _id: string;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

const COLORS = ["#059669", "#0D9488", "#3B82F6", "#E29E3B"];

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

const Dashboard = () => {
  const { user } = useAuth();

  const [summary, setSummary] = useState<DashboardData | null>(null);
  const [sales, setSales] = useState<SalesReport[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryRes, salesRes, productsRes] = await Promise.all([
        api.get("/analytics/dashboard-summary"),
        api.get("/analytics/sales-reports", {
          params: { period },
        }),
        api.get("/analytics/best-selling-products", {
          params: { limit: 5 },
        }),
      ]);

      setSummary(summaryRes.data.data);
      setSales(salesRes.data.data.reports || []);
      setBestSellers(productsRes.data.data.products || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard information. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const orderStatusData = summary
    ? [
        { name: "Paid", value: summary.orders.paid },
        { name: "Pending", value: summary.orders.pending },
        { name: "Cancelled", value: summary.orders.cancelled },
        {
          name: "Other",
          value: Math.max(
            summary.orders.total -
              summary.orders.paid -
              summary.orders.pending -
              summary.orders.cancelled,
            0,
          ),
        },
      ].filter((item) => item.value > 0)
    : [];

  const stats = summary
    ? [
        {
          label: "Total Revenue",
          value: money(summary.revenue.total),
          detail: "Revenue from paid orders",
          icon: Wallet,
          iconColor: "text-emerald-600",
          iconBg: "bg-emerald-50",
        },
        {
          label: "Total Orders",
          value: summary.orders.total.toLocaleString(),
          detail: `${summary.orders.paid} paid orders`,
          icon: ShoppingBag,
          iconColor: "text-blue-600",
          iconBg: "bg-blue-50",
        },
        {
          label: "Average Order Value",
          value: money(summary.revenue.averageOrderValue),
          detail: "Average paid order",
          icon: TrendingUp,
          iconColor: "text-teal-600",
          iconBg: "bg-teal-50",
        },
        {
          label: "Total Customers",
          value: summary.customers.total.toLocaleString(),
          detail: "Registered customers",
          icon: Users,
          iconColor: "text-amber-600",
          iconBg: "bg-amber-50",
        },
      ]
    : [];

  if (loading && !summary) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto animate-spin text-emerald-700" size={28} />
          <p className="mt-3 text-sm text-gray-500">
            Loading your business dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">Dashboard could not be loaded</p>
        <p className="mt-1 text-sm">{error}</p>
        <button
          onClick={loadDashboard}
          className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Dashboard heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[2px] text-emerald-700">
            BUSINESS OVERVIEW
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#1A1D1C] sm:text-3xl">
            Welcome back, {user?.name?.split(" ")[0] || "Administrator"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your store.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-[#E4E6E5] bg-white px-4 py-2.5 text-sm font-semibold text-[#1B3C2B] shadow-sm transition hover:bg-[#E6F0EA] disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {error} Some dashboard information may be outdated.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-xl border border-[#E4E6E5] bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <h2 className="mt-3 break-words text-2xl font-bold text-[#1A1D1C]">
                    {stat.value}
                  </h2>
                </div>
                <div className={`rounded-xl p-3 ${stat.iconBg}`}>
                  <Icon size={21} className={stat.iconColor} />
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500">{stat.detail}</p>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full w-2/3 rounded-full bg-emerald-600" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales chart and order status */}
      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.8fr_1fr]">
        <section className="min-w-0 rounded-xl border border-[#E4E6E5] bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-[#1A1D1C]">Sales Overview</h2>
              <p className="mt-1 text-xs text-gray-500">
                Revenue performance from paid orders
              </p>
            </div>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="h-[280px] w-full">
            {sales.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sales}
                  margin={{ top: 10, right: 12, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#EDF0ED"
                  />
                  <XAxis
                    dataKey="_id"
                    tick={{ fontSize: 11, fill: "#89918C" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#89918C" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      value >= 1000000
                        ? `₦${(value / 1000000).toFixed(1)}m`
                        : value >= 1000
                          ? `₦${(value / 1000).toFixed(0)}k`
                          : `₦${value}`
                    }
                    width={65}
                  />
                  <Tooltip
                    formatter={(value) => [money(Number(value)), "Revenue"]}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #E4E6E5",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No paid sales data available for this period.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[#E4E6E5] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[#1A1D1C]">Order Status</h2>
          <p className="mt-1 text-xs text-gray-500">
            Distribution of all customer orders
          </p>

          <div className="relative mt-3 h-[220px]">
            {orderStatusData.length ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={91}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {orderStatusData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[#1A1D1C]">
                    {summary.orders.total.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400">Orders</span>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No order data available.
              </div>
            )}
          </div>

          <div className="mt-2 space-y-3">
            {orderStatusData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-500">{item.name}</span>
                </div>
                <span className="font-semibold text-[#1A1D1C]">
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Product performance and inventory */}
      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.5fr_1fr]">
        <section className="overflow-hidden rounded-xl border border-[#E4E6E5] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <div>
              <h2 className="font-bold text-[#1A1D1C]">
                Top-Selling Products
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Best performers by quantity sold
              </p>
            </div>
            <Package size={20} className="text-emerald-700" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-[#F8F9F8] text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Units Sold</th>
                  <th className="px-5 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bestSellers.map((product, index) => (
                  <tr key={product._id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F0EA] text-xs font-bold text-emerald-800">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-[#1A1D1C]">
                          {product.productName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-600">
                      {product.totalQuantitySold.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#1B3C2B]">
                      {money(product.totalRevenue)}
                    </td>
                  </tr>
                ))}
                {!bestSellers.length && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-10 text-center text-gray-400"
                    >
                      No product sales available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-[#E4E6E5] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#1A1D1C]">
                Inventory Snapshot
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Current product and stock overview
              </p>
            </div>
            <Boxes size={21} className="text-emerald-700" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#F6F7F6] p-4">
              <Package size={19} className="text-emerald-700" />
              <p className="mt-3 text-xs text-gray-500">Total Products</p>
              <p className="mt-1 text-2xl font-bold text-[#1A1D1C]">
                {summary.products.total.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-[#F6F7F6] p-4">
              <CheckCircle2 size={19} className="text-emerald-700" />
              <p className="mt-3 text-xs text-gray-500">Active Products</p>
              <p className="mt-1 text-2xl font-bold text-[#1A1D1C]">
                {summary.products.active.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-[#F6F7F6] p-4">
              <Boxes size={19} className="text-blue-700" />
              <p className="mt-3 text-xs text-gray-500">Stock Units</p>
              <p className="mt-1 text-2xl font-bold text-[#1A1D1C]">
                {summary.inventory.totalStock.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-[#F6F7F6] p-4">
              <Wallet size={19} className="text-amber-700" />
              <p className="mt-3 text-xs text-gray-500">Stock Value</p>
              <p className="mt-1 break-words text-lg font-bold text-[#1A1D1C]">
                {money(summary.inventory.totalValue)}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Pending orders</span>
              <span className="flex items-center gap-1.5 font-semibold text-amber-600">
                <Clock size={15} />
                {summary.orders.pending}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-500">Cancelled orders</span>
              <span className="flex items-center gap-1.5 font-semibold text-red-600">
                <XCircle size={15} />
                {summary.orders.cancelled}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Recent orders */}
      <section className="overflow-hidden rounded-xl border border-[#E4E6E5] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="font-bold text-[#1A1D1C]">Recent Orders</h2>
            <p className="mt-1 text-xs text-gray-500">
              Latest five customer orders
            </p>
          </div>
          <ShoppingBag size={20} className="text-emerald-700" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-[#F8F9F8] text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Order Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summary.recentOrders.map((order) => (
                <tr key={order._id}>
                  <td className="px-5 py-4 font-semibold text-[#1B3C2B]">
                    {order.orderNumber}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {order.customer?.name ||
                      order.customer?.email ||
                      "Customer"}
                  </td>
                  <td className="px-5 py-4 font-medium">
                    {money(order.totalAmount)}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs capitalize text-gray-700">
                      {order.paymentStatus.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[#E6F0EA] px-2.5 py-1 text-xs capitalize text-[#1B3C2B]">
                      {order.orderStatus.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("en-NG")}
                  </td>
                </tr>
              ))}

              {!summary.recentOrders.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-gray-400"
                  >
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
