
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Package,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";

import {
  getCustomerOrders,
  type CustomerOrder,
} from "../../services/storefront/orderService";



const formatCurrency = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const getStatusStyle = (status: string) => {
  switch (status) {
    case "delivered":
    case "paid":
      return "bg-brand-mint text-brand-forest";

    case "cancelled":
    case "failed":
    case "refunded":
      return "bg-brand-warning-bg text-brand-warning";

    case "shipped":
    case "processing":
    case "confirmed":
      return "bg-blue-50 text-blue-700";

    case "refund_pending":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

const StatusBadge = ({
  label,
  status,
}: {
  label: string;
  status: string;
}) => (
  <div className="flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-2">
    <span className="text-xs font-medium text-brand-muted">
      {label}
    </span>

    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyle(status)}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  </div>
);

const Orders = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await getCustomerOrders();
      setOrders(result);
    } catch (err) {
      console.error("Failed to load customer orders:", err);
      setError("Unable to load your orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  return (
    
      
     

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="py-20 text-center text-brand-muted">
            Loading your orders...
          </div>
        ) : error ? (
          <section className="rounded-2xl border border-white/70 bg-white/85 px-5 py-16 text-center shadow-sm backdrop-blur-sm">
            <Package className="mx-auto h-12 w-12 text-brand-muted" />

            <p className="mt-4 text-sm text-brand-warning">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadOrders()}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-sage"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </section>
        ) : (
          <>
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-brand-text sm:text-3xl">
                My Orders
              </h1>

              <p className="mt-2 text-sm text-brand-muted">
                Track your purchases and view your order details.
              </p>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-2xl border border-white/70 bg-white/85 px-5 py-16 text-center shadow-sm backdrop-blur-sm">
                <ShoppingBag className="mx-auto h-14 w-14 text-brand-muted" />

                <h2 className="mt-5 text-xl font-bold text-brand-text">
                  No orders yet
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-brand-muted">
                  Your purchases will appear here once you place your first order.
                </p>

                <Link
                  to="/store"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-sage"
                >
                  Start shopping
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {orders.map((order) => (
                  <article
                    key={order._id}
                    className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 border-b border-brand-border p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs text-brand-muted">
                          Order number
                        </p>

                        <h2 className="mt-1 font-bold text-brand-text">
                          {order.orderNumber}
                        </h2>

                        <p className="mt-1 text-xs text-brand-muted">
                          Placed on {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge
                          label="Order:"
                          status={order.orderStatus}
                        />

                        <StatusBadge
                          label="Payment:"
                          status={order.paymentStatus}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 p-5">
                      {order.items.map((item, index) => (
                        <div
                          key={`${order._id}-${index}`}
                          className="flex items-center gap-4"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-16 w-16 rounded-lg border border-brand-border object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-gray">
                              <Package className="text-brand-muted" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-brand-text">
                              {item.name}
                            </p>

                            <p className="mt-1 text-xs text-brand-muted">
                              Quantity: {item.quantity}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-semibold text-brand-text">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-4 border-t border-brand-border/70 bg-brand-mint/40 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs text-brand-muted">
                          Order total
                        </p>

                        <p className="mt-1 text-lg font-bold text-brand-forest">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </div>

                      <Link
                        to={`/store/orders/${order._id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-forest px-5 py-3 text-sm font-semibold text-brand-forest transition hover:bg-brand-mint"
                      >
                        View order details
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    
  );
};

export default Orders;
