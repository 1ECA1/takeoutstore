
import api from "../api";

export type PaymentMethod =
  | "paystack"
  | "bank_transfer"
  | "cash_on_delivery";

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
}

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refund_pending"
  | "refunded";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface CustomerOrder {
  _id: string;
  orderNumber: string;
  customer: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentReference?: string | null;
  stockReserved?: boolean;
  stockReleasedAt?: string | null;
  reservationExpiresAt?: string | null;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

interface CreateOrderResponse {
  status: string;
  message: string;
  data: {
    order: CustomerOrder;
  };
}

interface OrdersResponse {
  status: string;
  results: number;
  data: {
    orders: CustomerOrder[];
  };
}

interface SingleOrderResponse {
  status: string;
  data: {
    order: CustomerOrder;
  };
}

export interface CreateOrderData {
  shippingAddress: ShippingAddress;
  shippingFee: number;
  paymentMethod: PaymentMethod;
}

export const createCustomerOrder = async (
  orderData: CreateOrderData,
): Promise<CustomerOrder> => {
  const response = await api.post<CreateOrderResponse>(
    "/orders",
    orderData,
  );

  return response.data.data.order;
};

export const getCustomerOrders = async (): Promise<CustomerOrder[]> => {
  const response = await api.get<OrdersResponse>("/orders/my-orders");

  return response.data.data.orders;
};

export const getCustomerOrderById = async (
  orderId: string,
): Promise<CustomerOrder> => {
  const response = await api.get<SingleOrderResponse>(
    `/orders/my-orders/${orderId}`,
  );

  return response.data.data.order;
};
