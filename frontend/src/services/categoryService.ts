
import api from "./api";

export interface Category {
  _id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryResponse {
  status: string;
  results?: number;
  data: {
    categories?: Category[];
    category?: Category;
  };
}

export interface CategoryInput {
  name: string;
  description: string;
}

export const getCategories = async (params?: {
  search?: string;
  status?: "active" | "inactive";
}) => {
  const response = await api.get<CategoryResponse>("/categories", {
    params,
  });

  return response.data;
};

export const createCategory = async (data: CategoryInput) => {
  const response = await api.post("/categories", data);
  return response.data;
};

export const updateCategory = async (
  id: string,
  data: Partial<CategoryInput> & { status?: "active" | "inactive" },
) => {
  const response = await api.patch(`/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id: string) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};
