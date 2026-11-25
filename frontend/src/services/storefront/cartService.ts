
import api from "../api";
import type { StoreProduct } from "./productService";

interface BackendCartProduct {
  _id: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  category?: {
    _id: string;
    name: string;
  } | null;
  images?: {
    url: string;
    publicId?: string;
  }[];
  stockQuantity: number;
  status: "draft" | "active" | "archived";
}

interface BackendCartItem {
  product: BackendCartProduct;
  quantity: number;
  lineTotal?: number;
}

interface CartResponse {
  status: string;
  data: {
    cartId?: string;
    items: BackendCartItem[];
    subtotal: number;
    totalItems: number;
  };
}

export interface CustomerCartItem {
  product: StoreProduct;
  quantity: number;
}

const mapCartProduct = (
  product: BackendCartProduct,
): StoreProduct => ({
  id: product._id,
  name: product.name,
  description: product.description ?? "",
  category: product.category?.name ?? "Uncategorized",
  categoryId: product.category?._id ?? "",
  price: product.price,
  compareAtPrice: product.compareAtPrice,
  imageUrl: product.images?.[0]?.url,
  imageUrls: product.images?.map((image) => image.url) ?? [],
  stockQuantity: product.stockQuantity,
});

const mapCartItems = (
  items: BackendCartItem[],
): CustomerCartItem[] =>
  items
    .filter(
      (item) =>
        item.product &&
        item.product.status === "active",
    )
    .map((item) => ({
      product: mapCartProduct(item.product),
      quantity: item.quantity,
    }));

export const getCustomerCart = async (): Promise<CustomerCartItem[]> => {
  const response = await api.get<CartResponse>("/cart");
  return mapCartItems(response.data.data.items);
};

export const addCustomerCartItem = async (
  productId: string,
  quantity: number,
): Promise<CustomerCartItem[]> => {
  await api.post("/cart/items", { productId, quantity });
  return getCustomerCart();
};

export const updateCustomerCartItem = async (
  productId: string,
  quantity: number,
): Promise<CustomerCartItem[]> => {
  await api.patch("/cart/items", { productId, quantity });
  return getCustomerCart();
};

export const removeCustomerCartItem = async (
  productId: string,
): Promise<CustomerCartItem[]> => {
  await api.delete(`/cart/items/${productId}`);
  return getCustomerCart();
};

export const clearCustomerCart = async (): Promise<void> => {
  await api.delete("/cart");
};

export const mergeGuestCartItems = async (
  guestItems: CustomerCartItem[],
): Promise<CustomerCartItem[]> => {
  let currentItems = await getCustomerCart();

  for (const guestItem of guestItems) {
    const productId = guestItem.product.id;

    const existingItem = currentItems.find(
      (item) => item.product.id === productId,
    );

    const existingQuantity = existingItem?.quantity ?? 0;

    const availableQuantity =
      guestItem.product.stockQuantity - existingQuantity;

    const quantityToAdd = Math.min(
      guestItem.quantity,
      availableQuantity,
    );

    if (quantityToAdd <= 0) {
      continue;
    }

    currentItems = await addCustomerCartItem(
      productId,
      quantityToAdd,
    );
  }

  return currentItems;
};