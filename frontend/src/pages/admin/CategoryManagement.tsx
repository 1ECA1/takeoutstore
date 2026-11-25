
import { useCallback, useEffect, useState } from "react";
import { Edit, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import type { Category, CategoryInput } from "../../services/categoryService";

import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../../services/categoryService";

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryInput>({
    name: "",
    description: "",
  });

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getCategories();
      setCategories(response.data.categories || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to load categories.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm({ name: "", description: "" });
    setMessage("");
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description || "",
    });
    setMessage("");
    setShowModal(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setMessage("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      if (editingCategory) {
        await updateCategory(editingCategory._id, {
          name: form.name.trim(),
          description: form.description.trim(),
        });
      } else {
        await createCategory({
          name: form.name.trim(),
          description: form.description.trim(),
        });
      }

      setShowModal(false);
      await loadCategories();
    } catch (err: any) {
      setMessage(
        err.response?.data?.message || "Failed to save category.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (category: Category) => {
    try {
      setError("");
      await updateCategory(category._id, {
        status: category.status === "active" ? "inactive" : "active",
      });
      await loadCategories();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to update category status.",
      );
    }
  };

  const handleDelete = async (category: Category) => {
    const confirmed = window.confirm(
      `Delete "${category.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await deleteCategory(category._id);
      setMessage("Category deleted successfully.");
      await loadCategories();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to delete category.",
      );
    }
  };

  const filteredCategories = categories.filter((category) =>
    `${category.name} ${category.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const activeCount = categories.filter(
    (category) => category.status === "active",
  ).length;

  const inactiveCount = categories.length - activeCount;

  return (
    <main className="min-h-screen bg-brand-gray p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand-sage">
              ADMINISTRATION
            </p>
            <h1 className="mt-1 text-3xl font-bold text-brand-forest">
              Category Management
            </h1>
            <p className="mt-2 text-sm text-brand-muted">
              Organize and manage your product categories.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-brand-forest px-5 py-3 font-semibold text-white hover:bg-brand-sage"
          >
            <Plus size={18} />
            Add Category
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-brand-border bg-white p-5">
            <p className="text-sm text-brand-muted">Total Categories</p>
            <p className="mt-2 text-3xl font-bold text-brand-forest">
              {categories.length}
            </p>
          </div>

          <div className="rounded-xl border border-brand-border bg-white p-5">
            <p className="text-sm text-brand-muted">Active Categories</p>
            <p className="mt-2 text-3xl font-bold text-brand-sage">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-brand-border bg-white p-5">
            <p className="text-sm text-brand-muted">Inactive Categories</p>
            <p className="mt-2 text-3xl font-bold text-brand-warning">
              {inactiveCount}
            </p>
          </div>
        </section>

        {message && (
          <div className="rounded-lg bg-brand-mint p-3 text-sm text-brand-forest">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-brand-warning/10 p-3 text-sm text-brand-warning">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-brand-border bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border p-5">
            <h2 className="font-bold text-brand-forest">
              All Categories
            </h2>

            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search categories..."
                  className="w-full rounded-lg border border-brand-border py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-sage sm:w-64"
                />
              </div>

              <button
                onClick={loadCategories}
                disabled={loading}
                className="rounded-lg border border-brand-border p-2 text-brand-forest hover:bg-brand-gray"
                title="Refresh categories"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <p className="p-10 text-center text-brand-muted">
              Loading categories...
            </p>
          ) : filteredCategories.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-brand-forest">
                No categories found
              </p>
              <p className="mt-2 text-sm text-brand-muted">
                Create a category or adjust your search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-brand-gray text-brand-muted">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Category</th>
                    <th className="px-5 py-4 font-semibold">Description</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCategories.map((category) => (
                    <tr
                      key={category._id}
                      className="border-t border-brand-border"
                    >
                      <td className="px-5 py-4 font-semibold text-brand-forest">
                        {category.name}
                      </td>

                      <td className="max-w-sm px-5 py-4 text-brand-muted">
                        {category.description || "No description"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            category.status === "active"
                              ? "bg-brand-mint text-brand-sage"
                              : "bg-brand-warning/10 text-brand-warning"
                          }`}
                        >
                          {category.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(category)}
                            title="Edit category"
                            className="rounded-lg border border-brand-border p-2 text-brand-sage hover:bg-brand-mint"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() => handleStatusChange(category)}
                            title={
                              category.status === "active"
                                ? "Deactivate category"
                                : "Activate category"
                            }
                            className="rounded-lg border border-brand-border px-3 py-2 text-xs font-semibold text-brand-forest hover:bg-brand-gray"
                          >
                            {category.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                          <button
                            onClick={() => handleDelete(category)}
                            title="Delete category"
                            className="rounded-lg border border-brand-border p-2 text-brand-warning hover:bg-brand-warning/10"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-border p-5">
              <h2 className="text-xl font-bold text-brand-forest">
                {editingCategory ? "Edit Category" : "Create Category"}
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-brand-muted hover:bg-brand-gray"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {message && (
                <p className="rounded-lg bg-brand-warning/10 p-3 text-sm text-brand-warning">
                  {message}
                </p>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-forest">
                  Category Name
                </label>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  required
                  maxLength={100}
                  placeholder="e.g. Electronics"
                  className="w-full rounded-lg border border-brand-border p-3 outline-none focus:border-brand-sage"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-forest">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  rows={4}
                  placeholder="Describe this product category..."
                  className="w-full resize-none rounded-lg border border-brand-border p-3 outline-none focus:border-brand-sage"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-brand-border px-5 py-2.5 font-semibold text-brand-forest"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-brand-forest px-5 py-2.5 font-semibold text-white hover:bg-brand-sage disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingCategory
                      ? "Save Changes"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default CategoryManagement;
