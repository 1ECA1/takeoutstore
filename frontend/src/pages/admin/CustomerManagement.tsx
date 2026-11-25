
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

interface Customer {
  _id: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
  createdAt: string;
  totalSpent?: number;
  paidOrderCount?: number;
  lastPurchaseDate?: string | null;
  segment?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
  createdAt: string;
}

interface Insights {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalSpent: number;
  lastPurchaseDate: string | null;
}

interface Activity {
  _id: string;
  action: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

type CustomerTab = "directory" | "segments";

const formatMoney = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (date?: string | null) => {
  if (!date) return "Not available";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "Not available"
    : parsed.toLocaleString();
};

const segmentLabels: Record<string, string> = {
  high_value: "High Value",
  returning: "Returning",
  active: "Active",
  new: "New",
  inactive: "Inactive",
};

const segmentStyles: Record<string, string> = {
  high_value: "bg-purple-100 text-purple-700",
  returning: "bg-blue-100 text-blue-700",
  active: "bg-emerald-100 text-emerald-700",
  new: "bg-amber-100 text-amber-700",
  inactive: "bg-gray-100 text-gray-600",
};

const actionLabel = (action: string) =>
  action
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const CustomerManagement = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === "admin";
  const permissions = user?.permissions || [];

  const canViewCustomers =
    isAdmin || permissions.includes("customers.view");

  const canViewInsights =
    isAdmin || permissions.includes("customers.insights.view");

  const canViewPurchaseHistory =
    isAdmin || permissions.includes("customers.purchase_history.view");

  const canViewActivity =
    isAdmin || permissions.includes("customers.activity.view");

  const canViewSegments =
    isAdmin || permissions.includes("customers.segments.view");

  const canViewCustomerDetails =
    canViewInsights || canViewPurchaseHistory || canViewActivity;

  const backPath = location.pathname.startsWith("/staff")
    ? "/staff"
    : "/admin";

  const [activeTab, setActiveTab] = useState<CustomerTab>(
    canViewCustomers ? "directory" : "segments"
  );

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const [segments, setSegments] = useState<Customer[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState("all");

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadCustomers = async (
    pageNumber = 1,
    searchTerm = search
  ) => {
    if (!canViewCustomers) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customers", {
        params: {
          page: pageNumber,
          limit: 10,
          search: searchTerm,
        },
      });

      setCustomers(response.data.data || []);
      setPage(response.data.pagination?.currentPage || 1);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalCustomers(
        response.data.pagination?.totalCustomers || 0
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadSegments = async () => {
    if (!canViewSegments) return;

    try {
      setSegmentsLoading(true);
      setError("");

      const response = await api.get("/customers/segments");

      setSegments(response.data.data?.customers || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to load customer segments."
      );
    } finally {
      setSegmentsLoading(false);
    }
  };

  useEffect(() => {
    if (canViewCustomers) {
      loadCustomers(1, "");
    } else {
      setLoading(false);
    }
  }, [canViewCustomers]);

  useEffect(() => {
    if (canViewSegments) {
      loadSegments();
    }
  }, [canViewSegments]);

  const viewCustomer = async (customer: Customer) => {
    if (!canViewCustomerDetails) return;

    try {
      setSelectedCustomer(customer);
      setDetailsLoading(true);
      setError("");

      setOrders([]);
      setInsights(null);
      setActivities([]);

      const requests: Promise<any>[] = [];

      if (canViewInsights) {
        requests.push(
          api.get(`/customers/${customer._id}/insights`)
        );
      }

      if (canViewPurchaseHistory) {
        requests.push(
          api.get(`/customers/${customer._id}/purchase-history`)
        );
      }

      if (canViewActivity) {
        requests.push(
          api.get(`/customers/${customer._id}/activity`, {
            params: { page: 1, limit: 20 },
          })
        );
      }

      const responses = await Promise.all(requests);
      let responseIndex = 0;

      if (canViewInsights) {
        setInsights(
          responses[responseIndex].data.data.insights
        );
        responseIndex++;
      }

      if (canViewPurchaseHistory) {
        setOrders(
          responses[responseIndex].data.data.orders || []
        );
        responseIndex++;
      }

      if (canViewActivity) {
        setActivities(
          responses[responseIndex].data.data.activities || []
        );
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to load customer information."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedCustomer(null);
    setOrders([]);
    setInsights(null);
    setActivities([]);
    setError("");
  };

  const filteredSegments = segments.filter((customer) => {
    const matchesSearch =
      `${customer.name} ${customer.email}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesSegment =
      segmentFilter === "all" ||
      customer.segment === segmentFilter;

    return matchesSearch && matchesSegment;
  });

  const segmentCounts = segments.reduce<Record<string, number>>(
    (counts, customer) => {
      const segment = customer.segment || "inactive";
      counts[segment] = (counts[segment] || 0) + 1;
      return counts;
    },
    {}
  );

  return (
    <main className="min-h-screen bg-brand-gray">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-brand-forest px-6 py-5 text-white">
        <div>
          <Link
            to={backPath}
            className="text-sm text-brand-mint hover:underline"
          >
            &larr; {isAdmin ? "Admin" : "Staff"} Dashboard
          </Link>

          <h1 className="mt-2 text-2xl font-bold">
            Customer Management
          </h1>

          <p className="mt-1 text-sm text-brand-mint">
            Manage authorized customer records and customer insights.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-6 p-6">
        {(canViewCustomers || canViewSegments) && (
          <div className="flex flex-wrap gap-2">
            {canViewCustomers && (
              <button
                onClick={() => {
                  setActiveTab("directory");
                  closeDetails();
                }}
                className={`rounded-lg px-5 py-3 text-sm font-semibold ${
                  activeTab === "directory"
                    ? "bg-brand-forest text-white"
                    : "border border-brand-border bg-white text-brand-forest"
                }`}
              >
                Customer Directory
              </button>
            )}

            {canViewSegments && (
              <button
                onClick={() => {
                  setActiveTab("segments");
                  closeDetails();
                }}
                className={`rounded-lg px-5 py-3 text-sm font-semibold ${
                  activeTab === "segments"
                    ? "bg-brand-forest text-white"
                    : "border border-brand-border bg-white text-brand-forest"
                }`}
              >
                Customer Segments
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {activeTab === "segments" && canViewSegments && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-brand-forest">
                Customer Lifecycle Segments
              </h2>
              <p className="mt-1 text-sm text-brand-muted">
                Customers grouped by purchasing activity and value.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(segmentLabels).map(([key, label]) => (
                <div
                  key={key}
                  className="rounded-xl border border-brand-border bg-white p-5"
                >
                  <p className="text-sm text-brand-muted">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-brand-forest">
                    {segmentCounts[key] || 0}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customers..."
                className="min-w-0 flex-1 rounded-lg border border-brand-border bg-white p-3"
              />

              <select
                value={segmentFilter}
                onChange={(event) => setSegmentFilter(event.target.value)}
                className="rounded-lg border border-brand-border bg-white p-3"
              >
                <option value="all">All Segments</option>
                {Object.entries(segmentLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              <button
                onClick={loadSegments}
                className="rounded-lg bg-brand-forest px-5 py-3 font-semibold text-white"
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-brand-border bg-white">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-brand-mint text-brand-forest">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Segment</th>
                    <th className="p-4">Paid Orders</th>
                    <th className="p-4">Total Spent</th>
                    <th className="p-4">Last Purchase</th>
                  </tr>
                </thead>

                <tbody>
                  {segmentsLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center">
                        Loading customer segments...
                      </td>
                    </tr>
                  ) : filteredSegments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-brand-muted"
                      >
                        No customers found in this segment.
                      </td>
                    </tr>
                  ) : (
                    filteredSegments.map((customer) => (
                      <tr
                        key={customer._id}
                        className="border-t border-brand-border"
                      >
                        <td className="p-4 font-semibold">
                          {customer.name}
                        </td>
                        <td className="p-4">{customer.email}</td>
                        <td className="p-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              segmentStyles[customer.segment || "inactive"]
                            }`}
                          >
                            {segmentLabels[customer.segment || "inactive"]}
                          </span>
                        </td>
                        <td className="p-4">
                          {customer.paidOrderCount || 0}
                        </td>
                        <td className="p-4 font-semibold">
                          {formatMoney(customer.totalSpent)}
                        </td>
                        <td className="p-4">
                          {customer.lastPurchaseDate
                            ? formatDate(customer.lastPurchaseDate)
                            : "No purchases"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-sm text-brand-muted">
              Showing {filteredSegments.length} of {segments.length} customers.
            </p>
          </section>
        )}

        {activeTab === "directory" && canViewCustomers && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-brand-border bg-white p-5">
                <p className="text-sm text-brand-muted">
                  Total Registered Customers
                </p>
                <p className="mt-2 text-3xl font-bold text-brand-forest">
                  {totalCustomers}
                </p>
              </div>

              <div className="rounded-xl border border-brand-border bg-white p-5">
                <p className="text-sm text-brand-muted">
                  Customers on This Page
                </p>
                <p className="mt-2 text-3xl font-bold text-brand-forest">
                  {customers.length}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") loadCustomers(1, search);
                }}
                placeholder="Search customer name or email..."
                className="min-w-0 flex-1 rounded-lg border border-brand-border bg-white p-3"
              />

              <button
                onClick={() => loadCustomers(1, search)}
                className="rounded-lg bg-brand-forest px-6 py-3 font-semibold text-white hover:bg-brand-sage"
              >
                Search
              </button>

              <button
                onClick={() => {
                  setSearch("");
                  loadCustomers(1, "");
                }}
                className="rounded-lg border border-brand-border bg-white px-5 py-3 font-semibold"
              >
                Reset
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-brand-border bg-white">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-brand-mint text-brand-forest">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4">Date Registered</th>
                    {canViewCustomerDetails && (
                      <th className="p-4">Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={canViewCustomerDetails ? 5 : 4}
                        className="p-8 text-center"
                      >
                        Loading customers...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canViewCustomerDetails ? 5 : 4}
                        className="p-8 text-center text-brand-muted"
                      >
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr
                        key={customer._id}
                        className="border-t border-brand-border"
                      >
                        <td className="p-4 font-semibold">
                          {customer.name}
                        </td>
                        <td className="p-4">{customer.email}</td>
                        <td className="p-4">
                          <span className="rounded-full bg-brand-mint px-3 py-1 text-xs font-semibold capitalize text-brand-forest">
                            {customer.status || "Active"}
                          </span>
                        </td>
                        <td className="p-4">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </td>
                        {canViewCustomerDetails && (
                          <td className="p-4">
                            <button
                              onClick={() => viewCustomer(customer)}
                              className="font-semibold text-brand-forest hover:underline"
                            >
                              View Details
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-brand-muted">
                Page {page} of {totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => loadCustomers(page - 1)}
                  className="rounded-lg border border-brand-border bg-white px-4 py-2 disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  disabled={page >= totalPages || loading}
                  onClick={() => loadCustomers(page + 1)}
                  className="rounded-lg border border-brand-border bg-white px-4 py-2 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>

            {selectedCustomer && (
              <section className="space-y-5 rounded-xl border border-brand-border bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-brand-muted">
                      Customer Profile
                    </p>
                    <h2 className="text-xl font-bold text-brand-forest">
                      {selectedCustomer.name}
                    </h2>
                    <p className="text-sm text-brand-muted">
                      {selectedCustomer.email}
                    </p>
                  </div>

                  <button
                    onClick={closeDetails}
                    className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold"
                  >
                    Close Details
                  </button>
                </div>

                {detailsLoading ? (
                  <p className="py-6 text-center">
                    Loading customer details...
                  </p>
                ) : (
                  <>
                    {canViewInsights && (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg bg-brand-gray p-4">
                          <p className="text-sm text-brand-muted">
                            Total Orders
                          </p>
                          <p className="mt-2 text-2xl font-bold">
                            {insights?.totalOrders ?? 0}
                          </p>
                        </div>

                        <div className="rounded-lg bg-brand-gray p-4">
                          <p className="text-sm text-brand-muted">
                            Paid Orders
                          </p>
                          <p className="mt-2 text-2xl font-bold">
                            {insights?.paidOrders ?? 0}
                          </p>
                        </div>

                        <div className="rounded-lg bg-brand-gray p-4">
                          <p className="text-sm text-brand-muted">
                            Pending Orders
                          </p>
                          <p className="mt-2 text-2xl font-bold">
                            {insights?.pendingOrders ?? 0}
                          </p>
                        </div>

                        <div className="rounded-lg bg-brand-gray p-4">
                          <p className="text-sm text-brand-muted">
                            Total Spent
                          </p>
                          <p className="mt-2 text-xl font-bold">
                            {formatMoney(insights?.totalSpent)}
                          </p>
                        </div>
                      </div>
                    )}

                    {canViewPurchaseHistory && (
                      <div>
                        <h3 className="mb-3 text-lg font-bold">
                          Purchase History
                        </h3>

                        <div className="overflow-x-auto rounded-lg border border-brand-border">
                          <table className="w-full min-w-[650px] text-left text-sm">
                            <thead className="bg-brand-mint text-brand-forest">
                              <tr>
                                <th className="p-3">Order Number</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Payment</th>
                                <th className="p-3">Order Status</th>
                                <th className="p-3">Date</th>
                              </tr>
                            </thead>

                            <tbody>
                              {orders.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="p-6 text-center text-brand-muted"
                                  >
                                    No orders found for this customer.
                                  </td>
                                </tr>
                              ) : (
                                orders.map((order) => (
                                  <tr
                                    key={order._id}
                                    className="border-t border-brand-border"
                                  >
                                    <td className="p-3 font-medium">
                                      {order.orderNumber}
                                    </td>
                                    <td className="p-3">
                                      {formatMoney(order.totalAmount)}
                                    </td>
                                    <td className="p-3 capitalize">
                                      {order.paymentStatus}
                                    </td>
                                    <td className="p-3 capitalize">
                                      {order.orderStatus?.replaceAll("_", " ")}
                                    </td>
                                    <td className="p-3">
                                      {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {canViewActivity && (
                      <div>
                        <h3 className="mb-3 text-lg font-bold">
                          Customer Activity Timeline
                        </h3>

                        {activities.length === 0 ? (
                          <p className="rounded-lg bg-brand-gray p-5 text-sm text-brand-muted">
                            No customer activity has been recorded.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {activities.map((activity) => (
                              <div
                                key={activity._id}
                                className="flex gap-4 rounded-lg border border-brand-border p-4"
                              >
                                <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-brand-sage" />

                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-brand-forest">
                                    {actionLabel(activity.action)}
                                  </p>

                                  <p className="mt-1 text-sm text-brand-muted">
                                    {activity.description ||
                                      "No additional description."}
                                  </p>

                                  <p className="mt-2 text-xs text-brand-muted">
                                    {formatDate(activity.createdAt)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </>
        )}

        {!canViewCustomers &&
          !canViewSegments && (
            <div className="rounded-xl border border-brand-border bg-white p-8 text-center">
              <h2 className="text-xl font-bold text-brand-forest">
                Customer Access Required
              </h2>
              <p className="mt-2 text-sm text-brand-muted">
                Your account does not have permission to access customer records or segments.
                Contact your administrator if you need access.
              </p>
            </div>
          )}

        {!canViewCustomers &&
          canViewActivity &&
          !canViewSegments && (
            <div className="rounded-xl border border-brand-border bg-white p-6 text-sm text-brand-muted">
              You have permission to view customer activity, but selecting a
              customer currently requires the customers.view permission.
              Ask your administrator to assign both permissions.
            </div>
          )}
      </section>
    </main>
  );
};

export default CustomerManagement;
