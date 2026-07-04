"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Shield,
  ShieldOff,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (query) params.set("q", query);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleRole = async (user) => {
    setActionLoading(user.id);
    const newRole = user.role === "admin" ? "user" : "admin";
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) fetchUsers();
    setActionLoading(null);
  };

  const deleteUser = async (user) => {
    if (!confirm(`Delete user "${user.email}"? This cannot be undone.`)) return;
    setActionLoading(user.id);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
    });
    if (res.ok) fetchUsers();
    setActionLoading(null);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Users</h1>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          className="w-full max-w-sm rounded-lg border border-border bg-white py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-secondary">
              <th className="px-4 py-3 text-left font-semibold text-text-secondary">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-text-secondary">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-text-secondary">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-text-secondary">Subscription</th>
              <th className="px-4 py-3 text-left font-semibold text-text-secondary">Plan</th>
              <th className="px-4 py-3 text-left font-semibold text-text-secondary">Usage</th>
              <th className="px-4 py-3 text-left font-semibold text-text-secondary">Joined</th>
              <th className="px-4 py-3 text-right font-semibold text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-text-muted" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-text-secondary">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-border-light hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">{user.name || "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        user.role === "admin"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {user.role === "admin" ? <Shield className="h-3 w-3" /> : null}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        user.subscription?.status === "active"
                          ? "bg-green-50 text-green-700"
                          : user.subscription?.status
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {user.subscription?.status || "none"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {user.subscription?.plan || "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {user.subscription ? `${user.subscription.monthly_usage || 0}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleRole(user)}
                        disabled={actionLoading === user.id}
                        className="rounded-lg p-2 text-text-secondary hover:bg-surface-secondary hover:text-brand-600 transition-colors disabled:opacity-50"
                        title={`Toggle role (currently ${user.role})`}
                      >
                        {user.role === "admin" ? (
                          <ShieldOff className="h-4 w-4" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteUser(user)}
                        disabled={actionLoading === user.id}
                        className="rounded-lg p-2 text-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-text-secondary">
          <span>
            Page {page} of {totalPages} ({total} users)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border p-2 hover:bg-surface-secondary disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-border p-2 hover:bg-surface-secondary disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
