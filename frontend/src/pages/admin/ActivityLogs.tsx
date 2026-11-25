
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

interface Activity {
  _id: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  action: string;
  description: string;
  ipAddress?: string;
  createdAt: string;
}

interface Pagination {
  currentPage: number;
  pageSize: number;
  totalActivities: number;
  totalPages: number;
}

const activityTypes = [
  "account_registered",
  "user_login",
  "user_logout",
  "product_viewed",
  "cart_item_added",
  "cart_item_updated",
  "cart_item_removed",
  "cart_cleared",
  "order_placed",
  "order_cancelled",
  "payment.verified",
  "payment.late_capture",
  "order.payment_reconciled",
  "order.reservation_expired",

  // Staff activity tracking
  "product.created",
  "product.updated",
  "product.deleted",
  "inventory.stock_adjusted",
  "supplier.created",
  "supplier.updated",
  "supplier.deleted",
  "order.status_updated",
];

const formatAction = (action: string) =>
  action.replace(/[._]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (date: string) =>
  new Date(date).toLocaleString();

const formatRole = (role?: string) => {
  if (!role) return "Unknown role";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export default function ActivityLogs() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    pageSize: 20,
    totalActivities: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/activity-logs", {
        params: {
          page: pagination.currentPage,
          limit: pagination.pageSize,
          search: search.trim() || undefined,
          action: action || undefined,
        },
      });

      setActivities(response.data.data.activities);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to load activity logs."
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, search, action]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const changePage = (page: number) => {
    setPagination((previous) => ({
      ...previous,
      currentPage: page,
    }));
  };

  const resetFilters = () => {
    setSearch("");
    setAction("");
    setPagination((previous) => ({
      ...previous,
      currentPage: 1,
    }));
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3C2B]">
            Activity Logs
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor staff actions and events across your platform.
          </p>
        </div>

        <button
          onClick={fetchActivities}
          className="rounded-lg bg-[#1B3C2B] px-4 py-2 text-sm font-medium text-white hover:bg-[#3D6A52]"
        >
          Refresh Logs
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#E4E6E5] bg-white p-5">
          <p className="text-sm text-gray-500">Total Activities</p>
          <p className="mt-2 text-2xl font-bold text-[#1B3C2B]">
            {pagination.totalActivities.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-[#E4E6E5] bg-white p-5">
          <p className="text-sm text-gray-500">Activities on This Page</p>
          <p className="mt-2 text-2xl font-bold text-[#1B3C2B]">
            {activities.length}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#E4E6E5] bg-white p-4 md:flex-row">
        <input
          type="text"
          value={search}
          placeholder="Search description, action or IP address..."
          onChange={(event) => {
            setSearch(event.target.value);
            setPagination((previous) => ({
              ...previous,
              currentPage: 1,
            }));
          }}
          className="min-w-0 flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-[#3D6A52]"
        />

        <select
          value={action}
          onChange={(event) => {
            setAction(event.target.value);
            setPagination((previous) => ({
              ...previous,
              currentPage: 1,
            }));
          }}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-[#3D6A52]"
        >
          <option value="">All Activity Types</option>
          {activityTypes.map((type) => (
            <option key={type} value={type}>
              {formatAction(type)}
            </option>
          ))}
        </select>

        <button
          onClick={resetFilters}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Clear Filters
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E4E6E5] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-[#E6F0EA] text-[#1B3C2B]">
              <tr>
                <th className="px-5 py-4 font-semibold">User</th>
                <th className="px-5 py-4 font-semibold">Role</th>
                <th className="px-5 py-4 font-semibold">Activity</th>
                <th className="px-5 py-4 font-semibold">Description</th>
                <th className="px-5 py-4 font-semibold">IP Address</th>
                <th className="px-5 py-4 font-semibold">Date & Time</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    Loading activity logs...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    No activity records found.
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity._id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">
                        {activity.user?.name || "System / Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.user?.email || "No user email"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {formatRole(activity.user?.role)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-[#E6F0EA] px-3 py-1 text-xs font-medium text-[#1B3C2B]">
                        {formatAction(activity.action)}
                      </span>
                    </td>

                    <td className="max-w-xs px-5 py-4 text-gray-600">
                      {activity.description || "No description"}
                    </td>

                    <td className="px-5 py-4 text-gray-500">
                      {activity.ipAddress || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                      {formatDate(activity.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm text-gray-500">
            Page {pagination.currentPage} of {pagination.totalPages || 1}
            {" · "}
            {pagination.totalActivities} activities
          </p>

          <div className="flex gap-2">
            <button
              disabled={pagination.currentPage <= 1 || loading}
              onClick={() => changePage(pagination.currentPage - 1)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              disabled={
                pagination.currentPage >= pagination.totalPages || loading
              }
              onClick={() => changePage(pagination.currentPage + 1)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
