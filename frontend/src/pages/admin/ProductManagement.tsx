
import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Package,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";

import api from "../../services/api";
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type AdminProduct,
  type ProductInput,
  type ProductImage,
} from "../../services/productService";

interface Category {
  _id: string;
  name: string;
  status: "active" | "inactive";
}

const initialForm: ProductInput = {
  name: "",
  description: "",
  price: 0,
  compareAtPrice: undefined,
  category: "",
  images: [],
  stockQuantity: 0,
  status: "draft",
};

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

const ProductManagement = () => {
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const permissions = user?.permissions || [];

  const canViewProducts =
    isAdmin || permissions.includes("products.view");

  const canCreateProduct =
    isAdmin || permissions.includes("products.create");

  const canUpdateProduct =
    isAdmin || permissions.includes("products.update");

  const canDeleteProduct =
    isAdmin || permissions.includes("products.delete");

  const canUploadImages =
    isAdmin || permissions.includes("products.upload_images");

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductInput>(initialForm);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);

  const canEditCurrentImages = editingProduct
    ? canUpdateProduct
    : canCreateProduct;

  const loadProducts = useCallback(async () => {
    if (!canViewProducts) {
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getAdminProducts({
        search,
        page,
        limit: 10,
        sort: "newest",
      });

      setProducts(response.data || []);
      setTotalProducts(response.pagination.totalProducts);
      setTotalPages(Math.max(response.pagination.totalPages, 1));
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  }, [search, page, canViewProducts]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await api.get("/categories", {
        params: { status: "active" },
      });

      setCategories(response.data.data.categories || []);
    } catch {
      setError("Unable to load product categories.");
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreateForm = () => {
    if (!canCreateProduct) return;

    setEditingProduct(null);
    setForm({
      ...initialForm,
      category: categories[0]?._id || "",
    });
    setImageUrl("");
    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (product: AdminProduct) => {
    if (!canUpdateProduct) return;

    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      category: product.category?._id || "",
      images: product.images || [],
      stockQuantity: product.stockQuantity,
      status: product.status,
    });
    setImageUrl("");
    setMessage("");
    setShowForm(true);
  };

  const updateField = (
    field: keyof ProductInput,
    value: string | number
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const addImage = () => {
    if (!canEditCurrentImages) return;

    const url = imageUrl.trim();

    if (!url) return;

    try {
      new URL(url);
    } catch {
      setMessage("Enter a valid image URL.");
      return;
    }

    if (form.images.length >= 10) {
      setMessage("A product can have a maximum of 10 images.");
      return;
    }

    const image: ProductImage = { url };

    setForm((previous) => ({
      ...previous,
      images: [...previous.images, image],
    }));

    setImageUrl("");
    setMessage("");
  };

  const uploadImages = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    if (!canUploadImages) {
      setMessage("You do not have permission to upload product images.");
      return;
    }

    if (!canEditCurrentImages) {
      setMessage("You do not have permission to modify this product.");
      return;
    }

    if (form.images.length + files.length > 10) {
      setMessage("A product can have a maximum of 10 images.");
      return;
    }

    const invalidFile = files.find(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024
    );

    if (invalidFile) {
      setMessage(
        "Only JPG, PNG or WEBP images up to 5 MB each are allowed."
      );
      return;
    }

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      setUploadingImages(true);
      setMessage("");

      const response = await api.post("/upload/products", formData);

      const uploadedImages: ProductImage[] =
        response.data.data.images;

      setForm((previous) => ({
        ...previous,
        images: [...previous.images, ...uploadedImages],
      }));

      setMessage("Images uploaded successfully.");
    } catch (err: any) {
      setMessage(
        err.response?.data?.message || "Image upload failed."
      );
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    if (!canEditCurrentImages) return;

    setForm((previous) => ({
      ...previous,
      images: previous.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (editingProduct ? !canUpdateProduct : !canCreateProduct) {
      setMessage("You do not have permission to perform this action.");
      return;
    }

    if (!form.category) {
      setMessage("Please select a product category.");
      return;
    }

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0 ||
      !Number.isFinite(Number(form.stockQuantity)) ||
      Number(form.stockQuantity) < 0
    ) {
      setMessage("Please provide valid product information.");
      return;
    }

    const payload: ProductInput = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      compareAtPrice:
        form.compareAtPrice === undefined ||
        Number(form.compareAtPrice) === 0
          ? undefined
          : Number(form.compareAtPrice),
      stockQuantity: Number(form.stockQuantity),
    };

    try {
      setSaving(true);

      if (editingProduct) {
        await updateProduct(editingProduct._id, payload);
        setMessage("Product updated successfully.");
      } else {
        await createProduct(payload);
        setMessage("Product created successfully.");
      }

      setShowForm(false);
      setEditingProduct(null);
      setForm(initialForm);
      await loadProducts();
    } catch (err: any) {
      setMessage(
        err.response?.data?.message || "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: AdminProduct) => {
    if (!canDeleteProduct) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      await deleteProduct(product._id);
      setMessage("Product deleted successfully.");
      await loadProducts();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Unable to delete product."
      );
    }
  };

  const statusStyle = (status: string) => {
    if (status === "active") {
      return "bg-green-100 text-green-800";
    }

    if (status === "archived") {
      return "bg-gray-200 text-gray-700";
    }

    return "bg-amber-100 text-amber-800";
  };

  return (
    <main className="min-h-screen bg-brand-gray">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-brand-forest px-6 py-5 text-white">
        <div>
          <h1 className="text-xl font-bold">Product Management</h1>
          <p className="text-sm text-brand-mint">
            Manage your product catalogue
          </p>
        </div>

        {canCreateProduct && (
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-brand-forest hover:bg-brand-mint"
          >
            <Plus size={18} />
            Add Product
          </button>
        )}
      </header>

      <section className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
        {canViewProducts && (
          <div className="rounded-xl border border-brand-border bg-white p-5">
            <div className="flex items-center gap-3">
              <Package className="text-brand-sage" size={28} />
              <div>
                <p className="text-sm text-brand-muted">Total Products</p>
                <h2 className="text-2xl font-bold text-brand-forest">
                  {totalProducts}
                </h2>
              </div>
            </div>
          </div>
        )}

        {message && !showForm && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!canViewProducts ? (
          <div className="rounded-xl border border-brand-border bg-white p-8">
            <Package
              size={40}
              className="mx-auto text-brand-muted"
            />
            <h2 className="mt-3 text-center font-semibold text-brand-forest">
              Product catalogue access not assigned
            </h2>
            <p className="mt-2 text-center text-sm text-brand-muted">
              You can perform only the product tasks assigned to you.
              Contact your administrator if you need permission to view
              the product catalogue.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-brand-forest">
                Product Catalogue
              </h2>

              <div className="relative w-full sm:max-w-sm">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted"
                />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search products..."
                  className="w-full rounded-lg border border-brand-border bg-white py-2.5 pl-10 pr-4 outline-none focus:border-brand-sage"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
              {loading ? (
                <p className="p-8 text-center text-brand-muted">
                  Loading products...
                </p>
              ) : products.length === 0 ? (
                <div className="p-12 text-center">
                  <Package
                    size={40}
                    className="mx-auto text-brand-muted"
                  />
                  <p className="mt-3 font-semibold text-brand-forest">
                    No products found
                  </p>
                  <p className="mt-1 text-sm text-brand-muted">
                    Add a product or adjust your search.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left">
                      <thead className="bg-brand-gray text-sm text-brand-muted">
                        <tr>
                          <th className="px-5 py-4">Product</th>
                          <th className="px-5 py-4">Category</th>
                          <th className="px-5 py-4">Price</th>
                          <th className="px-5 py-4">Stock</th>
                          <th className="px-5 py-4">Status</th>
                          {(canUpdateProduct || canDeleteProduct) && (
                            <th className="px-5 py-4 text-right">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-brand-border">
                        {products.map((product) => (
                          <tr
                            key={product._id}
                            className="hover:bg-brand-gray/50"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {product.images?.[0]?.url ? (
                                  <img
                                    src={product.images[0].url}
                                    alt={product.name}
                                    className="h-12 w-12 rounded-lg border border-brand-border object-cover"
                                  />
                                ) : (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-gray">
                                    <ImageIcon className="text-brand-muted" />
                                  </div>
                                )}

                                <div>
                                  <p className="font-semibold text-brand-forest">
                                    {product.name}
                                  </p>
                                  <p className="max-w-xs truncate text-xs text-brand-muted">
                                    {product.description}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-sm text-brand-muted">
                              {product.category?.name || "Uncategorized"}
                            </td>

                            <td className="px-5 py-4 font-semibold text-brand-forest">
                              {money(product.price)}
                            </td>

                            <td className="px-5 py-4 text-sm text-brand-muted">
                              {product.stockQuantity}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(product.status)}`}
                              >
                                {product.status}
                              </span>
                            </td>

                            {(canUpdateProduct || canDeleteProduct) && (
                              <td className="px-5 py-4">
                                <div className="flex justify-end gap-2">
                                  {canUpdateProduct && (
                                    <button
                                      onClick={() => openEditForm(product)}
                                      title="Edit product"
                                      className="rounded-lg p-2 text-brand-sage hover:bg-brand-mint"
                                    >
                                      <Pencil size={17} />
                                    </button>
                                  )}

                                  {canDeleteProduct && (
                                    <button
                                      onClick={() => handleDelete(product)}
                                      title="Delete product"
                                      className="rounded-lg p-2 text-brand-warning hover:bg-red-50"
                                    >
                                      <Trash2 size={17} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-border px-5 py-4">
                    <p className="text-sm text-brand-muted">
                      Page {page} of {totalPages}
                    </p>

                    <div className="flex gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage((current) => current - 1)}
                        className="rounded-lg border border-brand-border p-2 disabled:opacity-40"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((current) => current + 1)}
                        className="rounded-lg border border-brand-border p-2 disabled:opacity-40"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="mx-auto my-6 max-w-3xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-border p-5">
              <div>
                <h2 className="text-xl font-bold text-brand-forest">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-sm text-brand-muted">
                  Enter product information below.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 hover:bg-brand-gray"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {message && (
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  {message}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-semibold text-brand-forest">
                    Product Name
                  </label>
                  <input
                    required
                    maxLength={150}
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    className="w-full rounded-lg border border-brand-border px-3 py-2.5 outline-none focus:border-brand-sage"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-semibold text-brand-forest">
                    Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    className="w-full rounded-lg border border-brand-border px-3 py-2.5 outline-none focus:border-brand-sage"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-brand-forest">
                    Price (₦)
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      updateField("price", Number(event.target.value))
                    }
                    className="w-full rounded-lg border border-brand-border px-3 py-2.5 outline-none focus:border-brand-sage"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-brand-forest">
                    Compare-at Price (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.compareAtPrice ?? ""}
                    onChange={(event) =>
                      updateField(
                        "compareAtPrice",
                        event.target.value === ""
                          ? 0
                          : Number(event.target.value)
                      )
                    }
                    className="w-full rounded-lg border border-brand-border px-3 py-2.5 outline-none focus:border-brand-sage"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-brand-forest">
                    Category
                  </label>
                  <select
                    required
                    value={form.category}
                    onChange={(event) =>
                      updateField("category", event.target.value)
                    }
                    className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 outline-none focus:border-brand-sage"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-brand-forest">
                    Stock Quantity
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.stockQuantity}
                    onChange={(event) =>
                      updateField(
                        "stockQuantity",
                        Number(event.target.value)
                      )
                    }
                    className="w-full rounded-lg border border-brand-border px-3 py-2.5 outline-none focus:border-brand-sage"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-brand-forest">
                    Product Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target.value as ProductInput["status"]
                      )
                    }
                    className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 outline-none focus:border-brand-sage"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-brand-forest">
                    Product Images
                  </label>

                  {canUploadImages && canEditCurrentImages && (
                    <>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        disabled={
                          uploadingImages || form.images.length >= 10
                        }
                        onChange={uploadImages}
                        className="w-full rounded-lg border border-brand-border bg-white p-3 text-sm"
                      />

                      <p className="mt-2 text-xs text-brand-muted">
                        JPG, PNG or WEBP. Maximum 5 MB per image and
                        10 images per product.
                      </p>

                      {uploadingImages && (
                        <p className="mt-2 text-sm font-medium text-brand-sage">
                          Uploading images to Cloudinary...
                        </p>
                      )}
                    </>
                  )}

                  {!canUploadImages && (
                    <p className="mb-3 text-xs text-brand-muted">
                      Cloudinary image upload permission has not been assigned.
                    </p>
                  )}

                  {form.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {form.images.map((image, index) => (
                        <div
                          key={`${image.publicId || image.url}-${index}`}
                          className="relative"
                        >
                          <img
                            src={image.url}
                            alt={`Product ${index + 1}`}
                            className="h-24 w-full rounded-lg border border-brand-border object-cover"
                          />

                          {canEditCurrentImages && (
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute right-1 top-1 rounded-full bg-white p-1 text-red-600 shadow"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {canEditCurrentImages && (
                    <>
                      <div className="mt-4 flex gap-2">
                        <input
                          value={imageUrl}
                          onChange={(event) =>
                            setImageUrl(event.target.value)
                          }
                          placeholder="Paste an image URL"
                          className="min-w-0 flex-1 rounded-lg border border-brand-border px-3 py-2.5 outline-none focus:border-brand-sage"
                        />
                        <button
                          type="button"
                          onClick={addImage}
                          disabled={form.images.length >= 10}
                          className="rounded-lg bg-brand-mint px-4 font-semibold text-brand-forest disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>

                      <p className="mt-1 text-xs text-brand-muted">
                        You can also add image URLs. Maximum 10 images per product.
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-brand-border pt-5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-brand-border px-5 py-2.5 font-semibold text-brand-muted"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || uploadingImages}
                  className="rounded-lg bg-brand-forest px-5 py-2.5 font-semibold text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                      ? "Update Product"
                      : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProductManagement;
