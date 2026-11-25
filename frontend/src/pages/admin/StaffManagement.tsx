
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

interface Staff {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "suspended" | "disabled";
  permissions: string[];
  createdAt: string;
  updatedAt?: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalStaff: number;
}

const permissionGroups = [
  {
    title: "Orders Management",
    permissions: [
      { key: "orders.view", label: "View orders" },
      { key: "orders.update_status", label: "Update order status" },
    ],
  },
  {
    title: "Products Management",
    permissions: [
      { key: "products.view", label: "View products" },
      { key: "products.create", label: "Create products" },
      { key: "products.update", label: "Update products" },
      { key: "products.delete", label: "Delete products" },
      { key: "products.upload_images", label: "Upload product images" },
    ],
  },
  {
    title: "Inventory Management",
    permissions: [
      { key: "inventory.view", label: "View inventory" },
      { key: "inventory.adjust", label: "Adjust stock" },
      { key: "inventory.logs.view", label: "View inventory logs" },
      { key: "inventory.analytics.view", label: "View inventory analytics" },
    ],
  },
  {
    title: "Customers Management",
    permissions: [
      { key: "customers.view", label: "View customers" },
      { key: "customers.purchase_history.view", label: "View purchase history" },
      { key: "customers.insights.view", label: "View customer insights" },
      { key: "customers.activity.view", label: "View customer activity" },
      { key: "customers.segments.view", label: "View customer segments" },
    ],
  },
  {
    title: "Suppliers Management",
    permissions: [
      { key: "suppliers.view", label: "View suppliers" },
      { key: "suppliers.create", label: "Create suppliers" },
      { key: "suppliers.update", label: "Update suppliers" },
      { key: "suppliers.delete", label: "Delete suppliers" },
      { key: "suppliers.analytics.view", label: "View supplier analytics" },
    ],
  },
];

const permissionLabels = permissionGroups.flatMap((group) =>
  group.permissions.map((permission) => permission)
);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-amber-100 text-amber-800",
  disabled: "bg-red-100 text-red-800",
};

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalStaff: 0,
  });

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    permissions: [] as string[],
  });

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/staff", {
        params: { page, limit: 10 },
      });

      setStaff(response.data.data);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to load staff accounts."
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      permissions: [],
    });
    setEditingStaff(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (member: Staff) => {
    setEditingStaff(member);
    setForm({
      name: member.name,
      email: member.email,
      password: "",
      permissions: member.permissions || [],
    });
    setShowForm(true);
  };

  const togglePermission = (permission: string) => {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingStaff) {
        await api.patch(`/staff/${editingStaff._id}`, {
          name: form.name,
          email: form.email,
          permissions: form.permissions,
        });
        setSuccess("Staff account and permissions updated successfully.");
      } else {
        await api.post("/staff", {
          name: form.name,
          email: form.email,
          password: form.password,
          permissions: form.permissions,
        });
        setSuccess("Staff account created successfully.");
      }

      resetForm();
      await fetchStaff();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to save staff account."
      );
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (
    member: Staff,
    status: Staff["status"]
  ) => {
    if (
      !window.confirm(
        `Change ${member.name}'s account status to ${status}?`
      )
    ) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/staff/${member._id}/status`,
        { status }
      );

      setSuccess(response.data.message || "Staff status updated.");

      if (selectedStaff?._id === member._id) {
        setSelectedStaff(response.data.data);
      }

      await fetchStaff();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to update staff status."
      );
    }
  };

  const viewStaff = async (member: Staff) => {
    try {
      const response = await api.get(`/staff/${member._id}`);
      setSelectedStaff(response.data.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to retrieve staff details."
      );
    }
  };

  const getPermissionLabel = (permission: string) =>
    permissionLabels.find((item) => item.key === permission)?.label ||
    permission;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3C2B]">
            Staff Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create staff accounts and assign their responsibilities.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="rounded-lg bg-[#1B3C2B] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3D6A52]"
        >
          + Add Staff
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Staff Accounts</p>
          <p className="mt-2 text-3xl font-bold text-[#1B3C2B]">
            {pagination.totalStaff}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Staff on This Page</p>
          <p className="mt-2 text-3xl font-bold text-[#1B3C2B]">
            {staff.length}
          </p>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1B3C2B]">
              {editingStaff ? "Edit Staff Account" : "Create Staff Account"}
            </h2>
            <button
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Full Name
                </label>
                <input
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Enter full name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  maxLength={254}
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="staff@example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              {!editingStaff && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Temporary Password
                  </label>
                  <input
                    required
                    type="password"
                    minLength={8}
                    maxLength={72}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="At least 8 characters"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-[#1B3C2B]">
                    Assign Staff Responsibilities
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select the modules and actions this staff member can access.
                  </p>
                </div>

                <span className="rounded-full bg-[#E6F0EA] px-3 py-1 text-xs font-semibold text-[#1B3C2B]">
                  {form.permissions.length} permissions selected
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {permissionGroups.map((group) => (
                  <div
                    key={group.title}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <h4 className="mb-3 font-semibold text-[#1B3C2B]">
                      {group.title}
                    </h4>

                    <div className="space-y-3">
                      {group.permissions.map((permission) => (
                        <label
                          key={permission.key}
                          className="flex cursor-pointer items-center gap-3 text-sm text-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={form.permissions.includes(permission.key)}
                            onChange={() => togglePermission(permission.key)}
                            className="h-4 w-4 accent-[#1B3C2B]"
                          />
                          {permission.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#1B3C2B] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingStaff
                    ? "Save Changes"
                    : "Create Staff"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border px-5 py-2.5 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <p className="p-8 text-center text-gray-500">
            Loading staff accounts...
          </p>
        ) : staff.length === 0 ? (
          <p className="p-8 text-center text-gray-500">
            No staff accounts found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Staff Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Permissions</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {staff.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <p className="font-medium text-[#1B3C2B]">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.email}
                      </p>
                    </td>

                    <td className="px-4 py-4 capitalize">{member.role}</td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-[#E6F0EA] px-2 py-1 text-xs font-medium text-[#1B3C2B]">
                        {member.permissions?.length || 0} assigned
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[member.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {member.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-gray-500">
                      {formatDate(member.createdAt)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => viewStaff(member)}
                          className="font-medium text-[#3D6A52] hover:underline"
                        >
                          View
                        </button>

                        <button
                          onClick={() => openEditForm(member)}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          Edit
                        </button>

                        <select
                          aria-label={`Change status for ${member.name}`}
                          value={member.status}
                          onChange={(e) =>
                            changeStatus(
                              member,
                              e.target.value as Staff["status"]
                            )
                          }
                          className="rounded border border-gray-300 px-2 py-1 text-xs"
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Page {pagination.currentPage} of {Math.max(pagination.totalPages, 1)}
        </p>

        <div className="flex gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>

          <button
            disabled={page >= pagination.totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1B3C2B]">
                Staff Details
              </h2>
              <button
                onClick={() => setSelectedStaff(null)}
                className="text-sm text-gray-500"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Full Name</p>
                <p className="font-medium">{selectedStaff.name}</p>
              </div>

              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{selectedStaff.email}</p>
              </div>

              <div>
                <p className="text-gray-500">Role</p>
                <p className="font-medium capitalize">{selectedStaff.role}</p>
              </div>

              <div>
                <p className="text-gray-500">Account Status</p>
                <span
                  className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusStyles[selectedStaff.status]}`}
                >
                  {selectedStaff.status}
                </span>
              </div>

              <div>
                <p className="text-gray-500">Date Created</p>
                <p className="font-medium">
                  {formatDate(selectedStaff.createdAt)}
                </p>
              </div>

              {selectedStaff.updatedAt && (
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-medium">
                    {formatDate(selectedStaff.updatedAt)}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <p className="mb-3 font-semibold text-[#1B3C2B]">
                  Assigned Responsibilities
                </p>

                {selectedStaff.permissions?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedStaff.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="rounded-full bg-[#E6F0EA] px-3 py-1 text-xs font-medium text-[#1B3C2B]"
                      >
                        {getPermissionLabel(permission)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No responsibilities have been assigned.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
