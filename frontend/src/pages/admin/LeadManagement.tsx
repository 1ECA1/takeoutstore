
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: LeadStatus;
  notes: string;
  createdAt: string;
}

const statuses: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
];

const LeadManagement = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "website",
    notes: "",
  });

  const loadLeads = async (searchTerm = "") => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/leads", {
        params: { search: searchTerm },
      });

      setLeads(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      await api.post("/leads", form);

      setForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        source: "website",
        notes: "",
      });

      setShowForm(false);
      await loadLeads(search);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to create lead.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: LeadStatus) => {
    try {
      await api.patch(`/leads/${id}`, { status });
      await loadLeads(search);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to update lead.");
    }
  };

  const deleteLead = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;

    try {
      await api.delete(`/leads/${id}`);
      await loadLeads(search);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to delete lead.");
    }
  };

  return (
    <main className="min-h-screen bg-brand-gray">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-brand-forest px-6 py-5 text-white">
        <div>
          <Link to="/admin" className="text-sm text-brand-mint hover:underline">
            ← Admin Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Lead Management</h1>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-white px-5 py-2.5 font-semibold text-brand-forest hover:bg-brand-mint"
        >
          {showForm ? "Close Form" : "+ Add Lead"}
        </button>
      </header>

      <section className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-brand-border bg-white p-5">
            <p className="text-sm text-brand-muted">Total Leads</p>
            <p className="mt-2 text-3xl font-bold">{leads.length}</p>
          </div>
          <div className="rounded-xl border border-brand-border bg-white p-5">
            <p className="text-sm text-brand-muted">New Leads</p>
            <p className="mt-2 text-3xl font-bold">
              {leads.filter((lead) => lead.status === "new").length}
            </p>
          </div>
          <div className="rounded-xl border border-brand-border bg-white p-5">
            <p className="text-sm text-brand-muted">Qualified Leads</p>
            <p className="mt-2 text-3xl font-bold">
              {leads.filter((lead) => lead.status === "qualified").length}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="space-y-4 rounded-xl border border-brand-border bg-white p-6"
          >
            <h2 className="text-lg font-bold">Create New Lead</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-lg border p-3"
              />

              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-lg border p-3"
              />

              <input
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="rounded-lg border p-3"
              />

              <input
                placeholder="Company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="rounded-lg border p-3"
              />

              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="rounded-lg border p-3"
              >
                <option value="website">Website</option>
                <option value="social_media">Social Media</option>
                <option value="referral">Referral</option>
                <option value="advertisement">Advertisement</option>
                <option value="email">Email</option>
                <option value="other">Other</option>
              </select>

              <textarea
                placeholder="Lead notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="rounded-lg border p-3"
              />
            </div>

            <button
              type="submit"
              disabled={saving || (!form.email.trim() && !form.phone.trim())}
              className="rounded-lg bg-brand-forest px-6 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create Lead"}
            </button>
          </form>
        )}

        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadLeads(search);
            }}
            placeholder="Search name, email, phone or company..."
            className="min-w-0 flex-1 rounded-lg border border-brand-border bg-white p-3"
          />

          <button
            onClick={() => loadLeads(search)}
            className="rounded-lg bg-brand-forest px-5 py-3 font-semibold text-white"
          >
            Search
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-brand-border bg-white">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-brand-mint text-brand-forest">
              <tr>
                <th className="p-4">Lead</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Source</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-brand-muted">
                    No leads found.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead._id} className="border-t border-brand-border">
                    <td className="p-4">
                      <p className="font-semibold">{lead.name}</p>
                      <p className="text-xs text-brand-muted">
                        {lead.company || "Individual"}
                      </p>
                    </td>

                    <td className="p-4">
                      <p>{lead.email || "No email"}</p>
                      <p className="text-xs text-brand-muted">
                        {lead.phone || "No phone"}
                      </p>
                    </td>

                    <td className="p-4">{lead.source.replace("_", " ")}</td>

                    <td className="p-4">
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          updateStatus(lead._id, e.target.value as LeadStatus)
                        }
                        className="rounded-lg border p-2 capitalize"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-4">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => deleteLead(lead._id)}
                        className="font-semibold text-brand-warning hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default LeadManagement;
