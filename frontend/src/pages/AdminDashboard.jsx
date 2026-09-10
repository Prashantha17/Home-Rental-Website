// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "../context/ToastContext";
import { adminApi, propertyApi } from "../services/api";

const AdminDashboard = () => {
  const toast = useToast();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOwners: 0,
    totalProperties: 0,
    pendingRequests: 0,
  });

  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [processingUserId, setProcessingUserId] = useState(null);
  const [processingPropId, setProcessingPropId] = useState(null);

  // Fetch admin metrics
  const fetchStats = useCallback(async () => {
    try {
      const data = await adminApi.getStats();
      if (data) setStats(data);
    } catch (err) {
      console.warn("Fetch admin stats error:", err.message);
    }
  }, []);

  // Fetch all registered users
  const fetchUsers = useCallback(async () => {
    try {
      const data = await adminApi.getUsers();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      console.warn("Fetch admin users error:", err.message);
    }
  }, []);

  // Fetch all property listings
  const fetchProperties = useCallback(async () => {
    try {
      const data = await propertyApi.getAll();
      if (Array.isArray(data)) setProperties(data);
    } catch (err) {
      console.warn("Fetch all listings error:", err.message);
    }
  }, []);

  const loadAdminDashboard = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchUsers(), fetchProperties()]);
    setLoading(false);
  }, [fetchStats, fetchUsers, fetchProperties]);

  useEffect(() => {
    loadAdminDashboard();
  }, [loadAdminDashboard]);

  // Toggle user status (Block/Unblock)
  const handleToggleUserStatus = async (userId) => {
    setProcessingUserId(userId);
    try {
      const res = await adminApi.toggleUserStatus(userId);
      toast.success(res.message || "User status updated");
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.message || "Could not change user status");
    } finally {
      setProcessingUserId(null);
    }
  };

  // Approve listing
  const handleApproveListing = async (propId) => {
    setProcessingPropId(propId);
    try {
      await propertyApi.approve(propId);
      toast.success("Listing approved and is now active on the marketplace!");
      fetchProperties();
      fetchStats();
    } catch (err) {
      toast.error(err.message || "Could not approve listing");
    } finally {
      setProcessingPropId(null);
    }
  };

  // Reject listing
  const handleRejectListing = async (propId) => {
    setProcessingPropId(propId);
    try {
      await propertyApi.reject(propId);
      toast.info("Listing has been rejected.");
      fetchProperties();
      fetchStats();
    } catch (err) {
      toast.error(err.message || "Could not reject listing");
    } finally {
      setProcessingPropId(null);
    }
  };

  const filteredProperties =
    filterStatus === "All"
      ? properties
      : properties.filter((p) => p.status === filterStatus);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2c] pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#ffdad8] border border-[#ffb3af] rounded-full text-xs text-[#ad3035] font-bold uppercase tracking-wider mb-2">
              🛡️ Super Administrator Console
            </div>
            <h1 className="font-headline text-3xl font-bold text-[#002045]">
              Platform Administration
            </h1>
            <p className="text-sm text-[#43474e] mt-1">
              Monitor users, listings, platform health, and moderate pending requests.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAdminDashboard}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c4c6cf]/60 rounded-xl text-xs font-bold text-[#002045] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
          >
            🔄 Refresh System
          </button>
        </div>

        {loading ? (
          <div className="text-center py-24 text-[#43474e]">
            <div className="inline-block w-8 h-8 border-4 border-[#002045] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium">Loading system metrics...</p>
          </div>
        ) : (
          <>
            {/* ── STATS CARDS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <div className="bg-white border border-[#c4c6cf]/40 rounded-2xl p-6 shadow-sm">
                <span className="text-xs uppercase tracking-wider text-[#43474e] font-bold block mb-1">
                  Total Tenants
                </span>
                <div className="font-headline text-3xl font-bold text-[#002045]">
                  {stats.totalUsers}
                </div>
                <span className="text-xs text-[#74777f] mt-1 block">Registered renters</span>
              </div>

              <div className="bg-white border border-[#c4c6cf]/40 rounded-2xl p-6 shadow-sm">
                <span className="text-xs uppercase tracking-wider text-[#43474e] font-bold block mb-1">
                  Total Owners
                </span>
                <div className="font-headline text-3xl font-bold text-[#002045]">
                  {stats.totalOwners}
                </div>
                <span className="text-xs text-[#74777f] mt-1 block">Verified property hosts</span>
              </div>

              <div className="bg-white border border-[#c4c6cf]/40 rounded-2xl p-6 shadow-sm">
                <span className="text-xs uppercase tracking-wider text-[#43474e] font-bold block mb-1">
                  Active Listings
                </span>
                <div className="font-headline text-3xl font-bold text-emerald-600">
                  {stats.totalProperties}
                </div>
                <span className="text-xs text-[#74777f] mt-1 block">Approved & live</span>
              </div>

              <div className="bg-white border border-[#c4c6cf]/40 rounded-2xl p-6 shadow-sm">
                <span className="text-xs uppercase tracking-wider text-[#43474e] font-bold block mb-1">
                  Pending Approvals
                </span>
                <div
                  className={`font-headline text-3xl font-bold ${
                    stats.pendingRequests > 0 ? "text-amber-600" : "text-[#002045]"
                  }`}
                >
                  {stats.pendingRequests}
                </div>
                <span className="text-xs text-[#74777f] mt-1 block">Awaiting review</span>
              </div>
            </div>

            {/* ── TWO-COLUMN MANAGEMENT PANELS ── */}
            <div className="space-y-8">
              {/* PROPERTIES APPROVALS PANEL */}
              <div className="bg-white border border-[#c4c6cf]/40 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="font-headline text-lg font-bold text-[#002045]">
                      Property Moderation Queue ({filteredProperties.length})
                    </h3>
                    <p className="text-xs text-[#74777f] mt-0.5">
                      Review new homeowner listings before they appear on the public marketplace.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#43474e]">Filter:</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-lg text-xs font-semibold px-3 py-1.5 focus:outline-none"
                    >
                      <option value="All">All Listings</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-[#43474e] uppercase tracking-wider font-bold">
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4">Host / Owner</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Rent</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProperties.map((p) => (
                        <tr key={p.id || p._id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#002045]">{p.title}</td>
                          <td className="py-3.5 px-4 text-[#43474e]">{p.owner_name}</td>
                          <td className="py-3.5 px-4 text-[#74777f]">
                            {p.city}, {p.area}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#002045]">
                            ₹{Number(p.rent || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                p.status === "Approved"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : p.status === "Pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {p.status === "Pending" ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={processingPropId === (p.id || p._id)}
                                  onClick={() => handleApproveListing(p.id || p._id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={processingPropId === (p.id || p._id)}
                                  onClick={() => handleRejectListing(p.id || p._id)}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs cursor-pointer disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 font-semibold text-xs">Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* REGISTERED USERS MANAGEMENT PANEL */}
              <div className="bg-white border border-[#c4c6cf]/40 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="mb-6 pb-4 border-b border-gray-100">
                  <h3 className="font-headline text-lg font-bold text-[#002045]">
                    System User Accounts ({users.length})
                  </h3>
                  <p className="text-xs text-[#74777f] mt-0.5">
                    View active tenants, homeowners, and toggle access permissions.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-[#43474e] uppercase tracking-wider font-bold">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((u) => (
                        <tr key={u.id || u._id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#002045]">{u.username}</td>
                          <td className="py-3.5 px-4 text-[#43474e]">{u.email}</td>
                          <td className="py-3.5 px-4">
                            <span className="capitalize px-2 py-0.5 bg-gray-100 rounded font-semibold text-[#002045]">
                              {u.role === "user" ? "Tenant" : u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#74777f]">{u.phone}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                u.is_active !== false
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {u.is_active !== false ? "Active" : "Blocked"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {u.role !== "admin" ? (
                              <button
                                type="button"
                                disabled={processingUserId === (u.id || u._id)}
                                onClick={() => handleToggleUserStatus(u.id || u._id)}
                                className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors disabled:opacity-50 ${
                                  u.is_active !== false
                                    ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                }`}
                              >
                                {u.is_active !== false ? "Block User" : "Activate"}
                              </button>
                            ) : (
                              <span className="text-gray-400 font-semibold text-xs">
                                System Administrator
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
