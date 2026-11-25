
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Package,
  CreditCard,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";

import {
  createCustomerOrder,
  type PaymentMethod,
  type ShippingAddress,
} from "../../services/storefront/orderService";

import {
  initializeCustomerPayment,
} from "../../services/storefront/paymentService";

import type {
  CustomerCartItem,
} from "../../services/storefront/cartService";

const SHIPPING_FEE: number = 0;

const formatCurrency = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;

interface CheckoutProps {
  items: CustomerCartItem[];
  isLoading: boolean;
  cartLoadError: string;
  onCartCleared: () => void;
}

const Checkout = ({
  items,
  isLoading,
  cartLoadError,
  onCartCleared,
}: CheckoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [shippingAddress, setShippingAddress] =
    useState<ShippingAddress>({
      fullName: user?.name ?? "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "Nigeria",
    });

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("paystack");

  // Calculate order totals.
  const subtotal = items.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
    0,
  );

  const total = subtotal + SHIPPING_FEE;

  // Update shipping information.
  const handleAddressChange = (
    field: keyof ShippingAddress,
    value: string,
  ) => {
    setShippingAddress((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // Submit checkout.
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");

    if (items.length === 0) {
      setError(
        "Your cart is empty. Add products before checkout.",
      );
      return;
    }

    const requiredFields = [
      shippingAddress.fullName,
      shippingAddress.phone,
      shippingAddress.address,
      shippingAddress.city,
      shippingAddress.state,
    ];

    if (requiredFields.some((field) => !field.trim())) {
      setError("Please complete all delivery information.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the order using the backend.
      const order = await createCustomerOrder({
        shippingAddress,
        shippingFee: SHIPPING_FEE,
        paymentMethod,
      });

      // The backend has created the order and cleared its cart.
      // Keep the storefront cart state synchronized.
      onCartCleared();

      // Initialize Paystack for online payments.
      if (paymentMethod === "paystack") {
        const payment = await initializeCustomerPayment(
          order._id,
        );

        sessionStorage.setItem(
          "pendingPaymentOrderId",
          order._id,
        );

        sessionStorage.setItem(
          "pendingPaymentReference",
          payment.reference,
        );

        window.location.assign(payment.authorizationUrl);
        return;
      }

      // Bank transfer and cash on delivery.
      navigate(`/store/orders/${order._id}`, {
        state: { order },
      });
    } catch (err) {
      console.error("Checkout submission failed:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Unable to place your order. Please try again.";

      setError(message);
      setIsSubmitting(false);
    }
  };

  // Loading state.
  if (isLoading) {
    return (
      <div className="relative z-10 flex min-h-[350px] items-center justify-center">
        <div className="rounded-2xl border border-white/70 bg-white/75 px-8 py-10 text-center shadow-sm backdrop-blur-md">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-brand-mint border-t-brand-forest" />

          <p className="mt-4 text-sm font-medium text-brand-muted">
            Synchronizing your cart...
          </p>
        </div>
      </div>
    );
  }

  // Cart synchronization error.
  if (cartLoadError) {
    return (
      <section className="relative z-10 mx-auto max-w-2xl rounded-2xl border border-white/70 bg-white/80 px-5 py-16 text-center shadow-sm backdrop-blur-md sm:px-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <Package className="h-8 w-8 text-brand-warning" />
        </div>

        <h1 className="mt-5 text-xl font-bold text-brand-text">
          Cart synchronization failed
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-muted">
          {cartLoadError}
        </p>

        <Link
          to="/store/cart"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-sage"
        >
          Return to cart
        </Link>
      </section>
    );
  }

  // Empty cart state.
  if (items.length === 0) {
    return (
      <section className="relative z-10 mx-auto max-w-2xl rounded-2xl border border-white/70 bg-white/80 px-5 py-16 text-center shadow-sm backdrop-blur-md sm:px-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-mint">
          <Package className="h-8 w-8 text-brand-forest" />
        </div>

        <h1 className="mt-5 text-xl font-bold text-brand-text sm:text-2xl">
          Your cart is empty
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-muted">
          Add products to your cart before proceeding to checkout.
        </p>

        {error && (
          <p className="mt-4 text-sm text-brand-warning">
            {error}
          </p>
        )}

        <Link
          to="/store"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-sage"
        >
          Continue shopping
        </Link>
      </section>
    );
  }

  return (
    <div className="relative z-10 mx-auto w-full max-w-7xl">
      {/* Page heading */}
      <div className="mb-7">
        <Link
          to="/store/cart"
          className="mb-5 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-brand-forest transition hover:text-brand-sage"
        >
          <ArrowLeft size={17} />
          Back to cart
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-sage/20 bg-white/70 px-3 py-1.5 text-xs font-semibold text-brand-forest backdrop-blur-sm">
              <ShieldCheck size={14} />
              Secure checkout
            </div>

            <h1 className="text-2xl font-bold text-brand-text sm:text-3xl">
              Checkout
            </h1>

            <p className="mt-2 text-sm text-brand-muted">
              Complete your delivery information and place your order.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-brand-muted">
            <Package size={17} className="text-brand-forest" />
            {items.reduce((count, item) => count + item.quantity, 0)}{" "}
            items in your order
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-brand-warning">
          <Package size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8"
      >
        {/* Checkout information */}
        <div className="space-y-6 lg:col-span-2">
          {/* Delivery information */}
          <section className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur-md transition-shadow hover:shadow-md sm:p-7">
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-mint">
                <MapPin className="text-brand-forest" size={21} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-brand-text">
                  Delivery information
                </h2>

                <p className="mt-1 text-xs text-brand-muted">
                  Enter the address where you want your order delivered.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {(
                [
                  ["fullName", "Full name"],
                  ["phone", "Phone number"],
                  ["address", "Street address"],
                  ["city", "City"],
                  ["state", "State"],
                  ["country", "Country"],
                ] as const
              ).map(([field, label]) => (
                <div
                  key={field}
                  className={
                    field === "address"
                      ? "sm:col-span-2"
                      : ""
                  }
                >
                  <label
                    htmlFor={`shipping-${field}`}
                    className="mb-2 block text-sm font-semibold text-brand-text"
                  >
                    {label}
                    {field !== "country" && (
                      <span className="ml-1 text-brand-warning">
                        *
                      </span>
                    )}
                  </label>

                  <input
                    id={`shipping-${field}`}
                    type="text"
                    required={field !== "country"}
                    value={shippingAddress[field]}
                    onChange={(event) =>
                      handleAddressChange(
                        field,
                        event.target.value,
                      )
                    }
                    readOnly={field === "country"}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    className={`w-full rounded-xl border border-brand-border bg-white/80 px-4 py-3 text-sm text-brand-text outline-none transition placeholder:text-gray-400 focus:border-brand-forest focus:ring-4 focus:ring-brand-mint/70 ${
                      field === "country"
                        ? "cursor-not-allowed bg-gray-50/80"
                        : ""
                    }`}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Payment method */}
          <section className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur-md transition-shadow hover:shadow-md sm:p-7">
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-mint">
                <CreditCard className="text-brand-forest" size={21} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-brand-text">
                  Payment method
                </h2>

                <p className="mt-1 text-xs text-brand-muted">
                  Select how you want to pay for your order.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {(
                [
                  [
                    "paystack",
                    "Pay online with Paystack",
                    "Secure card and supported payment options.",
                  ],
                  [
                    "bank_transfer",
                    "Bank transfer",
                    "Place your order and follow the store's transfer instructions.",
                  ],
                  [
                    "cash_on_delivery",
                    "Cash on delivery",
                    "Pay when your order arrives.",
                  ],
                ] as const
              ).map(([value, label, description]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer gap-4 rounded-xl border p-4 transition ${
                    paymentMethod === value
                      ? "border-brand-forest bg-brand-mint/70 shadow-sm"
                      : "border-brand-border bg-white/60 hover:border-brand-sage hover:bg-white/90"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={value}
                    checked={paymentMethod === value}
                    onChange={() => setPaymentMethod(value)}
                    className="mt-1 h-4 w-4 accent-brand-forest"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-brand-text">
                      {label}
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-brand-muted">
                      {description}
                    </span>
                  </span>

                  {paymentMethod === value && (
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-forest text-white">
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </span>
                  )}
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Order summary */}
        <aside className="h-fit rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur-md sm:p-6 lg:sticky lg:top-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mint">
              <ShoppingBagIcon />
            </div>

            <div>
              <h2 className="text-lg font-bold text-brand-text">
                Order summary
              </h2>

              <p className="text-xs text-brand-muted">
                Review your items
              </p>
            </div>
          </div>

          <div className="mb-5 max-h-72 space-y-4 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-text">
                    {item.product.name}
                  </p>

                  <p className="mt-1 text-xs text-brand-muted">
                    Quantity: {item.quantity}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-bold text-brand-text">
                  {formatCurrency(
                    item.product.price * item.quantity,
                  )}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-brand-border pt-5 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-muted">Subtotal</span>

              <span className="font-semibold text-brand-text">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="flex items-center gap-2 text-brand-muted">
                <Truck size={15} />
                Shipping
              </span>

              <span className="font-semibold text-brand-text">
                {SHIPPING_FEE === 0
                  ? "Free"
                  : formatCurrency(SHIPPING_FEE)}
              </span>
            </div>

            <div className="flex justify-between border-t border-brand-border pt-4 text-base font-bold">
              <span className="text-brand-text">Total</span>

              <span className="text-lg text-brand-forest">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || items.length === 0}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-forest px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-brand-sage hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Processing..."
              : paymentMethod === "paystack"
                ? "Continue to payment"
                : "Place order"}
          </button>

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-brand-mint/60 p-3">
            <ShieldCheck
              size={17}
              className="mt-0.5 shrink-0 text-brand-forest"
            />

            <p className="text-xs leading-5 text-brand-muted">
              Your final order amount is calculated and validated securely by our server.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
};

const ShoppingBagIcon = () => (
  <Package size={20} className="text-brand-forest" />
);

export default Checkout;
