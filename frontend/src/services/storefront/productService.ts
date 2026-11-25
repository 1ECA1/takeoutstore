
import api from "../api";

export interface StoreProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryId: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  imageUrls: string[];
  stockQuantity: number;
}

interface BackendProduct {
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

interface ProductsResponse {
  status: string;
  results: number;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalProducts: number;
    totalPages: number;
  };
  data: BackendProduct[];
}

interface SingleProductResponse {
  status: string;
  data: BackendProduct;
}

export interface ProductQuery {
  search?: string;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
}

const mapProduct = (product: BackendProduct): StoreProduct => ({
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

export const getStoreProducts = async (
  params: ProductQuery = {},
): Promise<{
  products: StoreProduct[];
  totalProducts: number;
  totalPages: number;
}> => {
  const response = await api.get<ProductsResponse>("/products", {
    params: {
      ...params,
      status: "active",
    },
  });

  const activeProducts = response.data.data.filter(
    (product) => product.status === "active",
  );

  return {
    products: activeProducts.map(mapProduct),
    totalProducts: response.data.pagination.totalProducts,
    totalPages: response.data.pagination.totalPages,
  };
};

export const getStoreProductById = async (
  productId: string,
): Promise<StoreProduct> => {
  const response = await api.get<SingleProductResponse>(
    `/products/${productId}`,
  );

  const product = response.data.data;

  if (product.status !== "active") {
    throw new Error("This product is currently unavailable.");
  }

  return mapProduct(product);
};
