
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

type Segment =
  | "high_value"
  | "returning"
  | "active"
  | "new"
  | "inactive";

interface CustomerSegment {
  _id: string;
  name: string;
  email: string;
  status?: string;
  createdAt: string;
  totalSpent: number;
  paidOrderCount: number;
  lastPurchaseDate: string | null;
  segment: Segment;
}

const segmentDetails: Record<
  Segment,
  { label: string; description: string }
> = {
  high_value: {
    label: "High Value",
    description: "Customers with at least ₦500,000 in paid purchases.",
  },
  returning: {
    label: "Returning",
    description: "Customers with at least two paid orders.",
  },
  active: {
    label: "Active",
    description: "Customers with a recent purchase within 90 days.",
  },
  new: {
    label: "New",
    description: "Customers registered within the last 30 days.",
  },
  inactive: {
    label: "Inactive",
    description: "Customers who do not currently meet another segment rule.",
  },
};

const formatMoney = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);

const CustomerInsights = () => {
  const [customers, setCustomers] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<Segment | "all">(
    "all"
  );
  const [search, setSearch] = useState("");

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customers/segments");

      setCustomers(response.data.data?.customers || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to load customer insights."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const segmentCounts = {
    high_value: customers.filter((c) => c.segment === "high_value").length,
    returning: customers.filter((c) => c.segment === "returning").length,
    active: customers.filter((c) => c.segment === "active").length,
    new: customers.filter((c) => c.segment === "new").length,
    inactive: customers.filter((c) => c.segment === "inactive").length,
  };

  const totalRevenue = customers.reduce(
    (total, customer) => total + customer.totalSpent,
    0
  );

  const filteredCustomers = customers.filter((customer) => {
    const matchesSegment =
      selectedSegment === "all" ||
      customer.segment === selectedSegment;

    const matchesSearch =
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.email.toLowerCase().includes(search.toLowerCase());

    return matchesSegment && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-brand-gray">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-brand-forest px-6 py-5 text-white">
        <div>
          <Link
            to="/admin"
            className="text-sm text-brand-mint hover:underline"
          >
            &larr; Admin Dashboard
          </Link>

          <h1 className="mt-2 text-2xl font-bold">Customer Insights</h1>

          <p className="mt-1 text-sm text-brand-mint">
            Understand customer spending, purchasing behaviour and lifecycle segments.
          </p>
        </div>

        <button
          onClick={loadInsights}
          disabled={loading}
          className="rounded-lg bg-white px-5 py-2.5 font-semibold text-brand-forest hover:bg-brand-mint disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Insights"}
        </button>
      </header>

      <section className="mx-auto max-w-7xl space-y-6 p-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-brand-border bg-white p-5">
            <p className="text-sm text-brand-muted">Total Customers</p>
            <p className="mt-2 text-3xl font-bold text-brand-forest">
              {customers.length}
            </p>
          </div>

          <div className="rounded-xl border border-brand-border bg-white p-5">
            <p className="text-sm text-brand-muted">
              Total Paid Purchase Value
            </p>
            <p className="mt-2 text-2xl font-bold text-brand-forest">
              {formatMoney(totalRevenue)}
            </p>
          </div>

          <div className="rounded-xl border border-brand-border bg-white p-5">
            <p className="text-sm text-brand-muted">Returning Customers</p>
            <p className="mt-2 text-3xl font-bold text-brand-forest">
              {segmentCounts.returning}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(segmentDetails) as Segment[]).map((segment) => (
            <button
              key={segment}
              onClick={() => setSelectedSegment(
                selectedSegment === segment ? "all" : segment
              )}
              className={`rounded-xl border p-5 text-left transition ${
                selectedSegment === segment
                  ? "border-brand-forest bg-brand-mint"
                  : "border-brand-border bg-white hover:border-brand-sage"
              }`}
            >
              <p className="text-sm font-medium text-brand-muted">
                {segmentDetails[segment].label}
              </p>
              <p className="mt-2 text-3xl font-bold text-brand-forest">
                {segmentCounts[segment]}
              </p>
              <p className="mt-2 text-xs text-brand-muted">
                {segmentDetails[segment].description}
              </p>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name or email..."
            className="min-w-0 flex-1 rounded-lg border border-brand-border bg-white p-3"
          />

          <select
            value={selectedSegment}
            onChange={(e) =>
              setSelectedSegment(e.target.value as Segment | "all")
            }
            className="rounded-lg border border-brand-border bg-white p-3"
          >
            <option value="all">All Segments</option>
            {(Object.keys(segmentDetails) as Segment[]).map((segment) => (
              <option key={segment} value={segment}>
                {segmentDetails[segment].label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-brand-border bg-white">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-brand-mint text-brand-forest">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Segment</th>
                <th className="p-4">Paid Orders</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4">Last Purchase</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    Loading customer insights...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-brand-muted"
                  >
                    No customers match your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="border-t border-brand-border"
                  >
                    <td className="p-4">
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-xs text-brand-muted">
                        {customer.email}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className="rounded-full bg-brand-mint px-3 py-1 text-xs font-semibold capitalize text-brand-forest">
                        {segmentDetails[customer.segment]?.label ||
                          customer.segment}
                      </span>
                    </td>

                    <td className="p-4">{customer.paidOrderCount}</td>

                    <td className="p-4 font-semibold">
                      {formatMoney(customer.totalSpent)}
                    </td>

                    <td className="p-4">
                      {customer.lastPurchaseDate
                        ? new Date(
                            customer.lastPurchaseDate
                          ).toLocaleDateString()
                        : "No purchases"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-brand-muted">
          Showing {filteredCustomers.length} of {customers.length} customers.
        </p>
      </section>
    </main>
  );
};

export default CustomerInsights;
