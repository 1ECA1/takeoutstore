
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";

import { verifyCustomerPayment } from "../../services/storefront/paymentService";
import type { CustomerOrder } from "../../services/storefront/orderService";

type VerificationState = "verifying" | "success" | "error";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const reference =
    searchParams.get("reference") || searchParams.get("trxref");

  const [status, setStatus] = useState<VerificationState>("verifying");
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const verificationStarted = useRef(false);

  useEffect(() => {
    if (verificationStarted.current) return;

    verificationStarted.current = true;

    const verifyPayment = async () => {
      if (!reference) {
        setStatus("error");
        setErrorMessage(
          "The payment reference is missing. We cannot verify this transaction.",
        );
        return;
      }

      try {
        const verifiedOrder = await verifyCustomerPayment(reference);

        setOrder(verifiedOrder);
        setStatus("success");

        const pendingReference = sessionStorage.getItem(
          "pendingPaymentReference",
        );

        if (pendingReference === reference) {
          sessionStorage.removeItem("pendingPaymentReference");
          sessionStorage.removeItem("pendingPaymentOrderId");
        }
      } catch (error: unknown) {
        let message =
          "We could not verify this payment. Please try again or contact support.";

        if (axios.isAxiosError(error)) {
          message =
            error.response?.data?.message ||
            error.response?.data?.error ||
            message;
        } else if (error instanceof Error) {
          message = error.message;
        }

        setErrorMessage(message);
        setStatus("error");
      }
    };

    void verifyPayment();
  }, [reference]);

  const handleRetry = () => {
    verificationStarted.current = false;
    setStatus("verifying");
    setErrorMessage("");

    // Re-run verification without changing the payment reference.
    void (async () => {
      if (!reference) {
        setStatus("error");
        setErrorMessage("The payment reference is missing.");
        return;
      }

      verificationStarted.current = true;

      try {
        const verifiedOrder = await verifyCustomerPayment(reference);
        setOrder(verifiedOrder);
        setStatus("success");

        const pendingReference = sessionStorage.getItem(
          "pendingPaymentReference",
        );

        if (pendingReference === reference) {
          sessionStorage.removeItem("pendingPaymentReference");
          sessionStorage.removeItem("pendingPaymentOrderId");
        }
      } catch (error: unknown) {
        let message =
          "We could not verify this payment. Please try again or contact support.";

        if (axios.isAxiosError(error)) {
          message =
            error.response?.data?.message ||
            error.response?.data?.error ||
            message;
        } else if (error instanceof Error) {
          message = error.message;
        }

        setErrorMessage(message);
        setStatus("error");
      }
    })();
  };

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-brand-border bg-white px-5 py-12 text-center shadow-sm sm:px-8">
      {status === "verifying" ? (
        <>
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-brand-mint border-t-brand-forest" />
          <h1 className="text-2xl font-bold text-brand-text">
            Verifying your payment
          </h1>
          <p className="mt-3 text-sm text-brand-muted">
            Please wait while we confirm your transaction. Do not close this
            page.
          </p>
        </>
      ) : status === "success" && order ? (
        <>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-mint text-2xl text-brand-forest">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-brand-text">
            Payment successful
          </h1>
          <p className="mt-3 text-sm text-brand-muted">
            Your payment has been verified and your order is confirmed.
          </p>

          <p className="mt-5 text-sm text-brand-muted">
            Order reference:{" "}
            <span className="font-semibold text-brand-text">
              {order._id}
            </span>
          </p>

          <Link
            to={`/store/orders/${order._id}`}
            className="mt-7 inline-flex rounded-lg bg-brand-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-sage"
          >
            View your order
          </Link>
        </>
      ) : (
        <>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-warning-bg text-2xl text-brand-warning">
            !
          </div>
          <h1 className="text-2xl font-bold text-brand-text">
            Payment verification unsuccessful
          </h1>
          <p className="mt-3 text-sm text-brand-muted">{errorMessage}</p>

          {reference && (
            <p className="mt-4 break-all text-xs text-brand-muted">
              Payment reference: {reference}
            </p>
          )}

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-lg bg-brand-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-sage"
            >
              Retry verification
            </button>

            <Link
              to="/store/orders"
              className="rounded-lg border border-brand-border px-6 py-3 text-sm font-semibold text-brand-text transition hover:bg-brand-surface"
            >
              View my orders
            </Link>
          </div>
        </>
      )}
    </section>
  );
};

export default PaymentCallback;
