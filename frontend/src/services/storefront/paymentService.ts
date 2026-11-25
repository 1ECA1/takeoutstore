
import api from "../api";
import type { CustomerOrder } from "./orderService";

interface InitializePaymentResponse {
  status: string;
  message: string;
  data: {
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  };
}

interface VerifyPaymentResponse {
  status: string;
  message: string;
  data: {
    order: CustomerOrder;
  };
}

export interface PaymentInitialization {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export const initializeCustomerPayment = async (
  orderId: string,
): Promise<PaymentInitialization> => {
  const response = await api.post<InitializePaymentResponse>(
    "/payments/initialize",
    { orderId },
  );

  return response.data.data;
};

export const verifyCustomerPayment = async (
  reference: string,
): Promise<CustomerOrder> => {
  const response = await api.get<VerifyPaymentResponse>(
    `/payments/verify/${encodeURIComponent(reference)}`,
  );

  return response.data.data.order;
};
