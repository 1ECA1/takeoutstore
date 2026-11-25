
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Package,
  CreditCard,
  CalendarDays,
  RefreshCw,
} from "lucide-react";
import {
  getCustomerOrderById,
  type CustomerOrder,
} from "../../services/storefront/orderService";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (date: string) =>
  new Date(date).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const statusStyle = (status: string) => {
  switch (status) {
    case "confirmed":
    case "paid":
    case "delivered":
      return "bg-green-100 text-green-800";
    case "processing":
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "shipped":
      return "bg-blue-100 text-blue-800";
    case "cancelled":
    case "failed":
      return "bg-red-100 text-red-800";
    case "refund_pending":
      return "bg-orange-100 text-orange-800";
    case "refunded":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const formatStatus = (status: string) =>
  status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const OrderDetails = () => {
  const location = useLocation();

  const id = location.pathname.match(
    /^\/store\/orders\/([^/]+)\/?$/
  )?.[1];

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadOrder = async () => {
      if (!id) {
        setError("No order ID was provided.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result = await getCustomerOrderById(id);

        if (isActive) {
          setOrder(result);
        }
      } catch {
        if (isActive) {
          setError(
            "We could not load this order. It may not exist or may no longer be available."
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      isActive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-7 w-7 animate-spin text-[#1B3C2B]" />
          <p className="text-sm text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900">
          Order unavailable
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          {error || "We could not find this order."}
        </p>
        <Link
          to="/store/orders"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1B3C2B] px-5 py-3 text-sm font-medium text-white hover:bg-[#3D6A52]"
        >
          <ArrowLeft size={16} />
          Back to my orders
        </Link>
      </div>
    );
  }

  const shipping = order.shippingAddress;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 pb-24">
      <Link
        to="/store/orders"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#3D6A52] hover:text-[#1B3C2B]"
      >
        <ArrowLeft size={17} />
        Back to my orders
      </Link>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-gray-500">Order details</p>
          <h1 className="mt-1 text-2xl font-bold text-[#1A1D1C]">
            {order.orderNumber || `Order #${order._id.slice(-8).toUpperCase()}`}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <CalendarDays size={15} />
            Placed {formatDate(order.createdAt)}
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${statusStyle(order.orderStatus)}`}
        >
          {formatStatus(order.orderStatus)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-[#E4E6E5] bg-white p-5">
            <div className="mb-5 flex items-center gap-2">
              <Package className="text-[#3D6A52]" size={20} />
              <h2 className="font-semibold text-[#1A1D1C]">
                Items in this order
              </h2>
            </div>

            <div className="divide-y divide-[#E4E6E5]">
              {order.items.map((item, index) => (
                <div
                  key={`${item.product}-${index}`}
                  className="flex gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F6F7F6]">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="text-gray-300" size={28} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-[#1A1D1C]">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#1B3C2B]">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[#E4E6E5] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="text-[#3D6A52]" size={20} />
              <h2 className="font-semibold text-[#1A1D1C]">
                Delivery address
              </h2>
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <p className="font-semibold text-[#1A1D1C]">
                {shipping.fullName}
              </p>
              <p>{shipping.phone}</p>
              <p>{shipping.address}</p>
              <p>
                {[shipping.city, shipping.state, shipping.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-[#E4E6E5] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="text-[#3D6A52]" size={20} />
              <h2 className="font-semibold text-[#1A1D1C]">
                Payment information
              </h2>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Payment method</span>
                <span className="text-right font-medium text-[#1A1D1C]">
                  {formatStatus(order.paymentMethod)}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Payment status</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(order.paymentStatus)}`}
                >
                  {formatStatus(order.paymentStatus)}
                </span>
              </div>

              {order.paymentReference && (
                <div className="border-t border-[#E4E6E5] pt-3">
                  <p className="text-gray-500">Payment reference</p>
                  <p className="mt-1 break-all font-medium text-[#1A1D1C]">
                    {order.paymentReference}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-[#E4E6E5] bg-white p-5">
            <h2 className="mb-4 font-semibold text-[#1A1D1C]">
              Order summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{formatCurrency(order.shippingFee)}</span>
              </div>

              <div className="border-t border-[#E4E6E5] pt-3">
                <div className="flex justify-between text-base font-bold text-[#1B3C2B]">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
