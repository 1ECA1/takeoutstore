
import api from "../api";

export interface StoreCategory {
  id: string;
  name: string;
  description?: string;
}

interface BackendCategory {
  _id: string;
  name: string;
  description?: string;
  status?: string;
}

interface CategoriesResponse {
  status: string;
  results: number;
  data: {
    categories: BackendCategory[];
  };
}

export const getStoreCategories = async (): Promise<StoreCategory[]> => {
  const response = await api.get<CategoriesResponse>("/categories", {
    params: { status: "active" },
  });

  return response.data.data.categories
    .filter(
      (category) => !category.status || category.status === "active",
    )
    .map((category) => ({
      id: category._id,
      name: category.name,
      description: category.description,
    }));
};
