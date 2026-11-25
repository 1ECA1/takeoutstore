
import api from "./api";

export interface ProductImage {
  url: string;
  publicId?: string;
}

export interface AdminProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: {
    _id: string;
    name: string;
    description?: string;
  };
  images: ProductImage[];
  stockQuantity: number;
  status: "draft" | "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  images: ProductImage[];
  stockQuantity: number;
  status: "draft" | "active" | "archived";
}

export interface ProductListResponse {
  status: string;
  results: number;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalProducts: number;
    totalPages: number;
  };
  data: AdminProduct[];
}

export const getAdminProducts = async (params: {
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}) => {
  const response = await api.get<ProductListResponse>("/products", {
    params,
  });

  return response.data;
};

export const createProduct = async (data: ProductInput) => {
  const response = await api.post("/products", data);
  return response.data;
};

export const updateProduct = async (
  id: string,
  data: Partial<ProductInput>,
) => {
  const response = await api.patch(`/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: string) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};
