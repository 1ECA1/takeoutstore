
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import api from "../../services/api";

interface DashboardData {
  products: { total: number; active: number };
  customers: { total: number };
  orders: { total: number; paid: number; pending: number; cancelled: number };
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

interface PaymentRevenue {
  _id: string;
  totalOrders: number;
  totalRevenue: number;
}

const COLORS = ["#1B3C2B", "#3D6A52", "#E29E3B", "#B85A3A", "#8A9A91"];

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

const Analytics = () => {
  const [summary, setSummary] = useState<DashboardData | null>(null);
  const [sales, setSales] = useState<SalesReport[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [paymentRevenue, setPaymentRevenue] = useState<PaymentRevenue[]>([]);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryRes, salesRes, productsRes, paymentRes] =
        await Promise.all([
          api.get("/analytics/dashboard-summary"),
          api.get("/analytics/sales-reports", { params: { period } }),
          api.get("/analytics/best-selling-products", {
            params: { limit: 5 },
          }),
          api.get("/analytics/revenue-by-payment-method"),
        ]);

      setSummary(summaryRes.data.data);
      setSales(salesRes.data.data.reports || []);
      setBestSellers(productsRes.data.data.products || []);
      setPaymentRevenue(paymentRes.data.data.revenue || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to load analytics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
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
            0
          ),
        },
      ].filter((item) => item.value > 0)
    : [];

  if (loading && !summary) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading business analytics...
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
          <button
            onClick={loadAnalytics}
            className="ml-4 font-semibold underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const stats = [
    {
      label: "Total Revenue",
      value: money(summary.revenue.total),
      detail: "From paid orders",
    },
    {
      label: "Total Orders",
      value: summary.orders.total.toLocaleString(),
      detail: `${summary.orders.paid} paid orders`,
    },
    {
      label: "Total Customers",
      value: summary.customers.total.toLocaleString(),
      detail: "Registered customers",
    },
    {
      label: "Average Order Value",
      value: money(summary.revenue.averageOrderValue),
      detail: "Average paid order",
    },
    {
      label: "Total Products",
      value: summary.products.total.toLocaleString(),
      detail: `${summary.products.active} active products`,
    },
    {
      label: "Inventory Units",
      value: summary.inventory.totalStock.toLocaleString(),
      detail: `Value: ${money(summary.inventory.totalValue)}`,
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wider text-[#3D6A52]">
            BUSINESS PERFORMANCE
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#1A1D1C]">
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor sales, orders, customers and inventory performance.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-[#1B3C2B] hover:bg-[#E6F0EA]"
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error} Some analytics sections may not have refreshed.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[#E4E6E5] bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <h2 className="mt-2 text-2xl font-bold text-[#1B3C2B]">
              {stat.value}
            </h2>
            <p className="mt-2 text-xs text-gray-500">{stat.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-[#E4E6E5] bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-[#1A1D1C]">Sales Performance</h2>
              <p className="text-xs text-gray-500">
                Revenue from paid orders
              </p>
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="h-72">
            {sales.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => money(Number(value))} />
                  <Line
                    type="monotone"
                    dataKey="totalRevenue"
                    name="Revenue"
                    stroke="#1B3C2B"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-20 text-center text-sm text-gray-400">
                No paid sales data available yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[#E4E6E5] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[#1A1D1C]">Order Status</h2>
          <p className="mb-4 text-xs text-gray-500">
            Distribution of all orders
          </p>

          <div className="h-72">
            {orderStatusData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label
                  >
                    {orderStatusData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-20 text-center text-sm text-gray-400">
                No order data available.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-[#E4E6E5] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[#1A1D1C]">Best-Selling Products</h2>
          <p className="mb-5 text-xs text-gray-500">
            Top five products by quantity sold
          </p>

          <div className="h-72">
            {bestSellers.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestSellers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="productName"
                    width={110}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="totalQuantitySold"
                    name="Units Sold"
                    fill="#3D6A52"
                    radius={[0, 5, 5, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-20 text-center text-sm text-gray-400">
                No product sales data available yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[#E4E6E5] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[#1A1D1C]">
            Revenue by Payment Method
          </h2>
          <p className="mb-5 text-xs text-gray-500">
            Breakdown of successful payments
          </p>

          {paymentRevenue.length ? (
            <div className="space-y-4">
              {paymentRevenue.map((item) => (
                <div key={item._id}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span className="font-medium capitalize text-gray-700">
                      {(item._id || "Other").replaceAll("_", " ")}
                    </span>
                    <span className="font-semibold text-[#1B3C2B]">
                      {money(item.totalRevenue)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#E6F0EA]">
                    <div
                      className="h-full rounded-full bg-[#3D6A52]"
                      style={{
                        width: `${
                          summary.revenue.total > 0
                            ? Math.min(
                                (item.totalRevenue / summary.revenue.total) *
                                  100,
                                100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {item.totalOrders} paid orders
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-20 text-center text-sm text-gray-400">
              No payment data available yet.
            </p>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#E4E6E5] bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="font-bold text-[#1A1D1C]">Recent Orders</h2>
          <p className="text-xs text-gray-500">
            Five most recently created orders
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-[#F6F7F6] text-xs uppercase text-gray-500">
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
                  <td className="px-5 py-4">
                    {order.customer?.name || order.customer?.email || "Customer"}
                  </td>
                  <td className="px-5 py-4 font-medium">
                    {money(order.totalAmount)}
                  </td>
                  <td className="px-5 py-4 capitalize">
                    {order.paymentStatus.replaceAll("_", " ")}
                  </td>
                  <td className="px-5 py-4 capitalize">
                    {order.orderStatus.replaceAll("_", " ")}
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("en-NG")}
                  </td>
                </tr>
              ))}
              {!summary.recentOrders.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
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

export default Analytics;
