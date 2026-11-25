
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

interface Product {
  _id: string;
  name: string;
  price: number;
  stockQuantity: number;
  status: string;
  category?: { name: string };
}

interface InventoryLog {
  _id: string;
  product?: { name: string };
  action: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy?: { name: string };
  createdAt: string;
}

interface Analytics {
  totalProducts: number;
  totalUnitsInStock: number;
  totalInventoryValue: number;
  outOfStockProducts: number;
  lowStockProducts: number;
}

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

const InventoryManagement = () => {
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const permissions = user?.permissions || [];

  const canViewInventory =
    isAdmin || permissions.includes("inventory.view");

  const canAdjustInventory =
    isAdmin || permissions.includes("inventory.adjust");

  const canViewAnalytics =
    isAdmin || permissions.includes("inventory.analytics.view");

  const canViewLogs =
    isAdmin || permissions.includes("inventory.logs.view");

  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [action, setAction] = useState<"stock_added" | "stock_removed">(
    "stock_added"
  );
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadInventory = useCallback(async () => {
    const shouldLoadProducts = canViewInventory || canAdjustInventory;

    if (!shouldLoadProducts && !canViewAnalytics && !canViewLogs) {
      setProducts([]);
      setLogs([]);
      setAnalytics(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const requests: Promise<any>[] = [];
      const requestKeys: string[] = [];

      if (shouldLoadProducts) {
        requests.push(api.get("/inventory"));
        requestKeys.push("products");
      }

      if (canViewAnalytics) {
        requests.push(api.get("/inventory/analytics"));
        requestKeys.push("analytics");
      }

      if (canViewLogs) {
        requests.push(
          api.get("/inventory/logs", {
            params: { page, limit: 10 },
          })
        );
        requestKeys.push("logs");
      }

      const responses = await Promise.all(requests);

      const result: Record<string, any> = {};

      requestKeys.forEach((key, index) => {
        result[key] = responses[index];
      });

      if (result.products) {
        setProducts(result.products.data.data.products || []);
      } else {
        setProducts([]);
      }

      if (result.analytics) {
        setAnalytics(result.analytics.data.data);
      } else {
        setAnalytics(null);
      }

      if (result.logs) {
        setLogs(result.logs.data.data.logs || []);
        setTotalPages(
          Math.max(result.logs.data.pagination.totalPages || 1, 1)
        );
      } else {
        setLogs([]);
        setTotalPages(1);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Unable to load inventory data."
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    canViewInventory,
    canAdjustInventory,
    canViewAnalytics,
    canViewLogs,
  ]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleAdjustment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!canAdjustInventory) {
      setMessage("You do not have permission to adjust inventory.");
      return;
    }

    if (
      !selectedProduct ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1
    ) {
      setMessage(
        "Select a product and enter a valid whole-number quantity."
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await api.patch("/inventory/adjust", {
        productId: selectedProduct,
        action,
        quantity: Number(quantity),
        reason,
      });

      setMessage(
        response.data.message || "Inventory updated successfully."
      );

      setQuantity("1");
      setReason("");
      setSelectedProduct("");

      await loadInventory();
    } catch (err: any) {
      setMessage(
        err.response?.data?.message || "Failed to update inventory."
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "low" &&
        product.stockQuantity > 0 &&
        product.stockQuantity <= 5) ||
      (filter === "out" && product.stockQuantity === 0);

    return matchesSearch && matchesFilter;
  });

  const stockLabel = (stock: number) => {
    if (stock === 0) return "Out of stock";
    if (stock <= 5) return "Low stock";
    return "In stock";
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading inventory...
      </div>
    );
  }

  if (
    error &&
    !products.length &&
    !analytics &&
    !logs.length
  ) {
    return (
      <div className="p-6">
        <p className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </p>
        <button onClick={loadInventory} className="mt-3 underline">
          Retry
        </button>
      </div>
    );
  }

  const hasAnyPermission =
    canViewInventory ||
    canAdjustInventory ||
    canViewAnalytics ||
    canViewLogs;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-wider text-[#3D6A52]">
            STOCK CONTROL
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#1A1D1C]">
            Inventory Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your assigned inventory responsibilities.
          </p>
        </div>

        {hasAnyPermission && (
          <button
            onClick={loadInventory}
            className="rounded-lg border px-4 py-2 text-sm font-semibold text-[#1B3C2B] hover:bg-[#E6F0EA]"
          >
            Refresh Inventory
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!hasAnyPermission && (
        <div className="rounded-xl border border-[#E4E6E5] bg-white p-8 text-center">
          <h2 className="font-bold text-[#1B3C2B]">
            No inventory responsibilities assigned
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Contact your administrator to request inventory permissions.
          </p>
        </div>
      )}

      {canViewAnalytics && analytics && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Total Products", analytics.totalProducts],
            ["Units in Stock", analytics.totalUnitsInStock],
            ["Inventory Value", money(analytics.totalInventoryValue)],
            ["Low Stock", analytics.lowStockProducts],
            ["Out of Stock", analytics.outOfStockProducts],
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

      {canAdjustInventory && (
        <section className="rounded-xl border border-[#E4E6E5] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[#1A1D1C]">
            Adjust Product Stock
          </h2>
          <p className="mb-5 mt-1 text-sm text-gray-500">
            Record stock received or stock removed from inventory.
          </p>

          {!canViewInventory && (
            <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              You can adjust stock, but you do not have permission to
              view the full inventory catalogue.
            </p>
          )}

          <form
            onSubmit={handleAdjustment}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">
                Product
              </label>
              <select
                required
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-3"
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} — Current stock: {product.stockQuantity}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Adjustment Type
              </label>
              <select
                value={action}
                onChange={(e) =>
                  setAction(
                    e.target.value as "stock_added" | "stock_removed"
                  )
                }
                className="w-full rounded-lg border border-gray-200 p-3"
              >
                <option value="stock_added">Add Stock</option>
                <option value="stock_removed">Remove Stock</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-3"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Reason
              </label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. New supplier delivery"
                className="w-full rounded-lg border border-gray-200 p-3"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving || !products.length}
                className="rounded-lg bg-[#1B3C2B] px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Updating..." : "Update Inventory"}
              </button>
            </div>
          </form>

          {message && (
            <p className="mt-4 rounded-lg bg-[#E6F0EA] p-3 text-sm text-[#1B3C2B]">
              {message}
            </p>
          )}
        </section>
      )}

      {canViewInventory && (
        <section className="overflow-hidden rounded-xl border border-[#E4E6E5] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <h2 className="font-bold text-[#1A1D1C]">
                Product Stock Levels
              </h2>
              <p className="text-xs text-gray-500">
                Current inventory by product
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="rounded-lg border p-2 text-sm"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border p-2 text-sm"
              >
                <option value="all">All Products</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-[#F6F7F6] text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Unit Price</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Stock Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product._id}>
                    <td className="px-5 py-4 font-semibold">
                      {product.name}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {product.category?.name || "Uncategorized"}
                    </td>
                    <td className="px-5 py-4">
                      {money(product.price)}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {product.stockQuantity}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.stockQuantity === 0
                            ? "bg-red-50 text-red-700"
                            : product.stockQuantity <= 5
                              ? "bg-amber-50 text-amber-700"
                              : "bg-green-50 text-green-700"
                        }`}
                      >
                        {stockLabel(product.stockQuantity)}
                      </span>
                    </td>
                  </tr>
                ))}

                {!filteredProducts.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-gray-400"
                    >
                      No matching products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {canViewLogs && (
        <section className="overflow-hidden rounded-xl border border-[#E4E6E5] bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <h2 className="font-bold text-[#1A1D1C]">
              Inventory Movement History
            </h2>
            <p className="text-xs text-gray-500">
              Recorded stock additions, removals and order movements
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-[#F6F7F6] text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Previous</th>
                  <th className="px-5 py-3">New Stock</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="px-5 py-4 font-medium">
                      {log.product?.name || "Product unavailable"}
                    </td>
                    <td className="px-5 py-4 capitalize">
                      {log.action.replaceAll("_", " ")}
                    </td>
                    <td className="px-5 py-4">{log.quantity}</td>
                    <td className="px-5 py-4">{log.previousStock}</td>
                    <td className="px-5 py-4 font-semibold">
                      {log.newStock}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {log.reason || "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {new Date(log.createdAt).toLocaleDateString("en-NG")}
                    </td>
                  </tr>
                ))}

                {!logs.length && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-8 text-center text-gray-400"
                    >
                      No inventory movements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t p-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default InventoryManagement;
