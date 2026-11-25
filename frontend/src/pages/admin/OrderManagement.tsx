
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customer?: {
    _id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
  };
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalOrders: number;
}

const orderStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const paymentStatuses = [
  "pending",
  "paid",
  "failed",
  "refund_pending",
  "refunded",
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount || 0);

const formatDate = (date: string) =>
  new Date(date).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const statusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-indigo-100 text-indigo-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refund_pending: "bg-orange-100 text-orange-800",
    refunded: "bg-gray-100 text-gray-700",
  };

  return classes[status] || "bg-gray-100 text-gray-700";
};

export default function OrderManagement() {
  const { user } = useAuth();

  // Admins retain full access.
  // Staff must have the relevant assigned permissions.
  const canViewOrders =
    user?.role === "admin" ||
    user?.permissions?.includes("orders.view") === true;

  const canUpdateStatus =
    user?.role === "admin" ||
    user?.permissions?.includes("orders.update_status") === true;

  const [orders, setOrders] = useState<Order[]>([]);

  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
  });

  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load orders only when the user has permission.
  const fetchOrders = useCallback(async () => {
    if (!canViewOrders) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders", {
        params: {
          page,
          limit: 10,
          ...(status && { status }),
          ...(paymentStatus && { paymentStatus }),
        },
      });

      setOrders(response.data.data.orders);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  }, [page, status, paymentStatus, canViewOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Update order status only when authorized.
  const updateStatus = async (
    order: Order,
    newStatus: string
  ) => {
    if (!canUpdateStatus) return;

    if (
      newStatus === "cancelled" &&
      !window.confirm(
        `Cancel ${order.orderNumber}? This will restore the reserved product stock.`
      )
    ) {
      return;
    }

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/orders/${order._id}/status`,
        { orderStatus: newStatus }
      );

      setSuccess(
        response.data.message || "Order updated successfully."
      );

      if (selectedOrder?._id === order._id) {
        setSelectedOrder(response.data.data.order);
      }

      await fetchOrders();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to update order status."
      );
    } finally {
      setUpdating(false);
    }
  };

  const canUpdateOrder = (order: Order) =>
    !["cancelled", "delivered"].includes(order.orderStatus);

  // Permission fallback.
  if (!canViewOrders) {
    return (
      <div className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-semibold text-amber-800">
          Order Access Restricted
        </h2>

        <p className="mt-2 text-sm text-amber-700">
          You have not been assigned permission to view orders.
          Contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3C2B]">
          Order Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Review customer orders, monitor payments and manage fulfilment.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Order statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Orders</p>

          <p className="mt-2 text-3xl font-bold text-[#1B3C2B]">
            {pagination.totalOrders}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            Orders on This Page
          </p>

          <p className="mt-2 text-3xl font-bold text-[#1B3C2B]">
            {orders.length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All order statuses</option>

          {orderStatuses.map((item) => (
            <option key={item} value={item}>
              {item.replace("_", " ").toUpperCase()}
            </option>
          ))}
        </select>

        <select
          value={paymentStatus}
          onChange={(e) => {
            setPaymentStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All payment statuses</option>

          {paymentStatuses.map((item) => (
            <option key={item} value={item}>
              {item.replace("_", " ").toUpperCase()}
            </option>
          ))}
        </select>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="rounded-lg bg-[#1B3C2B] px-4 py-2 text-sm font-medium text-white hover:bg-[#3D6A52] disabled:opacity-50"
        >
          Refresh Orders
        </button>
      </div>

      {/* Orders table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <p className="p-8 text-center text-gray-500">
            Loading orders...
          </p>
        ) : orders.length === 0 ? (
          <p className="p-8 text-center text-gray-500">
            No orders found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Order Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 font-medium text-[#1B3C2B]">
                      {order.orderNumber}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium">
                        {order.customer?.name || "Unknown"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {order.customer?.email || ""}
                      </p>
                    </td>

                    <td className="px-4 py-4 font-medium">
                      {formatCurrency(order.totalAmount)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(
                          order.orderStatus
                        )}`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="font-medium text-[#3D6A52] hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Page {pagination.currentPage} of{" "}
          {Math.max(pagination.totalPages, 1)}
        </p>

        <div className="flex gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() =>
              setPage((current) => current - 1)
            }
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>

          <button
            disabled={
              page >= pagination.totalPages || loading
            }
            onClick={() =>
              setPage((current) => current + 1)
            }
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Order details modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1B3C2B]">
                  {selectedOrder.orderNumber}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {formatDate(selectedOrder.createdAt)}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg border px-3 py-1 text-gray-600"
              >
                Close
              </button>
            </div>

            {/* Customer and shipping information */}
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <section>
                <h3 className="font-semibold">Customer</h3>

                <p className="mt-2 text-sm">
                  {selectedOrder.customer?.name || "Unknown"}
                </p>

                <p className="text-sm text-gray-500">
                  {selectedOrder.customer?.email || ""}
                </p>
              </section>

              <section>
                <h3 className="font-semibold">
                  Shipping Address
                </h3>

                <div className="mt-2 text-sm text-gray-600">
                  <p>{selectedOrder.shippingAddress.fullName}</p>
                  <p>{selectedOrder.shippingAddress.phone}</p>
                  <p>{selectedOrder.shippingAddress.address}</p>

                  <p>
                    {selectedOrder.shippingAddress.city},{" "}
                    {selectedOrder.shippingAddress.state}
                  </p>
                </div>
              </section>
            </div>

            {/* Order items */}
            <section className="mt-6">
              <h3 className="font-semibold">Order Items</h3>

              <div className="mt-3 divide-y rounded-lg border">
                {selectedOrder.items.map((item, index) => (
                  <div
                    key={`${item.product}-${index}`}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      )}

                      <div>
                        <p className="font-medium">
                          {item.name}
                        </p>

                        <p className="text-xs text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm font-medium">
                      {formatCurrency(
                        item.price * item.quantity
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Payment totals */}
            <section className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>
                  {formatCurrency(selectedOrder.subtotal)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Shipping Fee
                </span>
                <span>
                  {formatCurrency(selectedOrder.shippingFee)}
                </span>
              </div>

              <div className="flex justify-between border-t pt-3 text-base font-bold">
                <span>Total</span>
                <span>
                  {formatCurrency(selectedOrder.totalAmount)}
                </span>
              </div>
            </section>

            {/* Payment information */}
            <section className="mt-5 grid gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">
                  Payment Method
                </p>

                <p className="mt-1 font-medium">
                  {selectedOrder.paymentMethod.replace("_", " ")}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Payment Status
                </p>

                <p className="mt-1 font-medium capitalize">
                  {selectedOrder.paymentStatus.replace("_", " ")}
                </p>
              </div>
            </section>

            {/* Only authorized staff/admin can update status */}
            {canUpdateStatus && (
              <section className="mt-5">
                <label className="mb-2 block text-sm font-semibold">
                  Update Order Status
                </label>

                {canUpdateOrder(selectedOrder) ? (
                  <select
                    value={selectedOrder.orderStatus}
                    disabled={updating}
                    onChange={(e) =>
                      updateStatus(
                        selectedOrder,
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-50"
                  >
                    {orderStatuses
                      .filter((item) => item !== "pending")
                      .map((item) => (
                        <option key={item} value={item}>
                          {item.toUpperCase()}
                        </option>
                      ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500">
                    This order can no longer be updated.
                  </p>
                )}
              </section>
            )}

            {!canUpdateStatus && (
              <p className="mt-5 rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
                You have view-only access to this order.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
