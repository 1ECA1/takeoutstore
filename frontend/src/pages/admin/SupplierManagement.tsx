
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

interface Product {
  _id: string;
  name: string;
  price: number;
  stockQuantity: number;
  status?: string;
}

interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  status: "active" | "inactive";
  products: Product[];
  createdAt: string;
}

interface SupplierAnalytics {
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  totalProductsSupplied: number;
}

const emptyForm = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
  products: [] as string[],
};

const SupplierManagement = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === "admin";
  const permissions = user?.permissions || [];

  const canView = isAdmin || permissions.includes("suppliers.view");
  const canCreate = isAdmin || permissions.includes("suppliers.create");
  const canUpdate = isAdmin || permissions.includes("suppliers.update");
  const canDelete = isAdmin || permissions.includes("suppliers.delete");
  const canViewAnalytics =
    isAdmin || permissions.includes("suppliers.analytics.view");

  const isStaffPage = location.pathname.startsWith("/staff");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<SupplierAnalytics | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const requests: Promise<any>[] = [];
      const requestTypes: string[] = [];

      if (canView) {
        requests.push(
          api.get("/suppliers", {
            params: {
              page,
              limit: 10,
              search: search || undefined,
              status:
                statusFilter === "all" ? undefined : statusFilter,
            },
          })
        );
        requestTypes.push("suppliers");
      }

      if (canViewAnalytics) {
        requests.push(api.get("/suppliers/analytics"));
        requestTypes.push("analytics");
      }

      if (canCreate || canUpdate) {
        requests.push(api.get("/products"));
        requestTypes.push("products");
      }

      const responses = await Promise.all(requests);

      responses.forEach((response, index) => {
        switch (requestTypes[index]) {
          case "suppliers":
            setSuppliers(response.data.data.suppliers || []);
            setTotalPages(
              response.data.pagination?.totalPages || 1
            );
            break;

          case "analytics":
            setAnalytics(response.data.data);
            break;

          case "products":
            setProducts(response.data.data.products || []);
            break;
        }
      });

      if (!canView) {
        setSuppliers([]);
        setTotalPages(1);
      }

      if (!canViewAnalytics) {
        setAnalytics(null);
      }

      if (!canCreate && !canUpdate) {
        setProducts([]);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to load supplier information."
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    statusFilter,
    canView,
    canCreate,
    canUpdate,
    canViewAnalytics,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateForm = () => {
    if (!canCreate) return;

    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setShowForm(true);
  };

  const openEditForm = async (supplier: Supplier) => {
    if (!canView || !canUpdate) return;

    try {
      setError("");
      setMessage("");

      const response = await api.get(`/suppliers/${supplier._id}`);
      const current = response.data.data.supplier;

      setEditingId(current._id);
      setForm({
        name: current.name || "",
        contactPerson: current.contactPerson || "",
        email: current.email || "",
        phone: current.phone || "",
        address: current.address || "",
        notes: current.notes || "",
        products: (current.products || []).map(
          (product: Product | string) =>
            typeof product === "string" ? product : product._id
        ),
      });

      setShowForm(true);
    } catch (err: any) {
      setMessage(
        err.response?.data?.message ||
          "Unable to load supplier details."
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId && !canUpdate) return;
    if (!editingId && !canCreate) return;

    try {
      setSaving(true);
      setMessage("");

      if (editingId) {
        await api.patch(`/suppliers/${editingId}`, form);
        setMessage("Supplier updated successfully.");
      } else {
        await api.post("/suppliers", form);
        setMessage("Supplier created successfully.");
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);

      await loadData();
    } catch (err: any) {
      setMessage(
        err.response?.data?.message || "Unable to save supplier."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setForm((current) => ({
      ...current,
      products: current.products.includes(productId)
        ? current.products.filter((id) => id !== productId)
        : [...current.products, productId],
    }));
  };

  const toggleStatus = async (supplier: Supplier) => {
    if (!canUpdate) return;

    const nextStatus =
      supplier.status === "active" ? "inactive" : "active";

    try {
      await api.patch(`/suppliers/${supplier._id}`, {
        status: nextStatus,
      });

      setMessage(`Supplier marked ${nextStatus}.`);
      await loadData();
    } catch (err: any) {
      setMessage(
        err.response?.data?.message ||
          "Unable to update supplier status."
      );
    }
  };

  const deleteSupplier = async (supplier: Supplier) => {
    if (!canDelete) return;

    if (!window.confirm(`Delete supplier "${supplier.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/suppliers/${supplier._id}`);
      setMessage("Supplier deleted successfully.");
      await loadData();
    } catch (err: any) {
      setMessage(
        err.response?.data?.message ||
          "Unable to delete supplier."
      );
    }
  };

  const hasAnyPermission =
    canView ||
    canCreate ||
    canUpdate ||
    canDelete ||
    canViewAnalytics;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-wider text-[#3D6A52]">
            PROCUREMENT MANAGEMENT
          </p>

          <h1 className="mt-1 text-2xl font-bold text-[#1A1D1C]">
            Supplier Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage supplier records, contacts and supplied products.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={openCreateForm}
            className="rounded-lg bg-[#1B3C2B] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3D6A52]"
          >
            + Add Supplier
          </button>
        )}
      </div>

      {message && (
        <div className="rounded-lg bg-[#E6F0EA] p-3 text-sm text-[#1B3C2B]">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}

          <button
            onClick={loadData}
            className="ml-3 underline"
          >
            Retry
          </button>
        </div>
      )}

      {!hasAnyPermission ? (
        <div className="rounded-xl border border-[#E4E6E5] bg-white p-8 text-center">
          <h2 className="text-xl font-bold text-[#1B3C2B]">
            Supplier Access Required
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            You have not been assigned any supplier management
            responsibilities. Contact your administrator.
          </p>
        </div>
      ) : (
        <>
          {canViewAnalytics && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Total Suppliers", analytics?.totalSuppliers ?? 0],
                ["Active Suppliers", analytics?.activeSuppliers ?? 0],
                ["Inactive Suppliers", analytics?.inactiveSuppliers ?? 0],
                [
                  "Products Supplied",
                  analytics?.totalProductsSupplied ?? 0,
                ],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-[#E4E6E5] bg-white p-5 shadow-sm"
                >
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-[#1B3C2B]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {showForm && (
            <section className="rounded-xl border border-[#E4E6E5] bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="font-bold text-[#1B3C2B]">
                  {editingId
                    ? "Edit Supplier"
                    : "Register New Supplier"}
                </h2>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm text-gray-500 hover:text-red-600"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    ["name", "Supplier Name", true],
                    ["contactPerson", "Contact Person", false],
                    ["email", "Email Address", false],
                    ["phone", "Phone Number", false],
                    ["address", "Business Address", false],
                  ].map(([field, label, required]) => (
                    <div key={String(field)}>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        {label}
                      </label>

                      <input
                        required={Boolean(required)}
                        type={
                          field === "email" ? "email" : "text"
                        }
                        value={
                          form[field as keyof typeof form] as string
                        }
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            [field]: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-200 p-3 outline-none focus:border-[#3D6A52]"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Notes
                  </label>

                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 p-3"
                    placeholder="Additional supplier information..."
                  />
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">
                    Assign Products
                  </h3>

                  <div className="grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-gray-200 p-3 sm:grid-cols-2">
                    {products.map((product) => (
                      <label
                        key={product._id}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={form.products.includes(product._id)}
                          onChange={() => toggleProduct(product._id)}
                          className="accent-[#1B3C2B]"
                        />
                        <span>{product.name}</span>
                      </label>
                    ))}

                    {!products.length && (
                      <p className="text-sm text-gray-400">
                        No products available.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-[#1B3C2B] px-6 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Save Changes"
                      : "Create Supplier"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg border px-6 py-3 font-semibold text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {canView ? (
            <section className="overflow-hidden rounded-xl border border-[#E4E6E5] bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <h2 className="font-bold text-[#1A1D1C]">
                  Supplier Directory
                </h2>

                <div className="flex flex-wrap gap-2">
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search suppliers..."
                    className="rounded-lg border p-2 text-sm"
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-lg border p-2 text-sm"
                  >
                    <option value="all">All Suppliers</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <p className="p-8 text-center text-gray-500">
                  Loading suppliers...
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="bg-[#F6F7F6] text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-5 py-3">Supplier</th>
                        <th className="px-5 py-3">Contact Person</th>
                        <th className="px-5 py-3">Contact Details</th>
                        <th className="px-5 py-3">Products</th>
                        <th className="px-5 py-3">Status</th>
                        {(canUpdate || canDelete) && (
                          <th className="px-5 py-3">Actions</th>
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {suppliers.map((supplier) => (
                        <tr key={supplier._id}>
                          <td className="px-5 py-4 font-semibold text-[#1B3C2B]">
                            {supplier.name}
                            <p className="mt-1 text-xs font-normal text-gray-400">
                              Added{" "}
                              {new Date(
                                supplier.createdAt
                              ).toLocaleDateString("en-NG")}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            {supplier.contactPerson || "—"}
                          </td>

                          <td className="px-5 py-4 text-gray-500">
                            <p>{supplier.email || "—"}</p>
                            <p>{supplier.phone || "—"}</p>
                          </td>

                          <td className="px-5 py-4">
                            {supplier.products?.length || 0} products
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                supplier.status === "active"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {supplier.status}
                            </span>
                          </td>

                          {(canUpdate || canDelete) && (
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-2">
                                {canUpdate && (
                                  <>
                                    <button
                                      onClick={() =>
                                        openEditForm(supplier)
                                      }
                                      className="font-semibold text-[#3D6A52] hover:underline"
                                    >
                                      Edit
                                    </button>

                                    <button
                                      onClick={() =>
                                        toggleStatus(supplier)
                                      }
                                      className="font-semibold text-amber-700 hover:underline"
                                    >
                                      {supplier.status === "active"
                                        ? "Deactivate"
                                        : "Activate"}
                                    </button>
                                  </>
                                )}

                                {canDelete && (
                                  <button
                                    onClick={() =>
                                      deleteSupplier(supplier)
                                    }
                                    className="font-semibold text-red-600 hover:underline"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}

                      {!suppliers.length && (
                        <tr>
                          <td
                            colSpan={
                              canUpdate || canDelete ? 6 : 5
                            }
                            className="px-5 py-8 text-center text-gray-400"
                          >
                            No suppliers found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between border-t p-4">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() =>
                    setPage((current) => current - 1)
                  }
                  className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>

                <button
                  disabled={page >= totalPages || loading}
                  onClick={() =>
                    setPage((current) => current + 1)
                  }
                  className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </section>
          ) : (
            <div className="rounded-xl border border-[#E4E6E5] bg-white p-6 text-sm text-gray-600">
              You can perform your assigned supplier operations, but
              you do not have permission to view the supplier directory.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SupplierManagement;
