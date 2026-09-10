// src/pages/OwnerDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { propertyApi, requestApi } from "../services/api";


const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { username } = useAuth();
  const toast = useToast();

  const [properties, setProperties] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Fetch properties listed by this owner
  const fetchMyProperties = useCallback(async () => {
    try {
      const data = await propertyApi.getAll();
      if (Array.isArray(data)) {
        const myProps = data.filter(
          (p) => p.owner_name?.toLowerCase() === username?.toLowerCase()
        );
        setProperties(myProps);
      }
    } catch (err) {
      console.warn("Fetch my properties error:", err.message);
    }
  }, [username]);

  // Fetch rental requests sent by tenants for owner's properties
  const fetchMyRequests = useCallback(async () => {
    try {
      const data = await requestApi.getOwnerRequests();
      if (Array.isArray(data)) {
        setRequests(data);
      }
    } catch (err) {
      console.warn("Fetch rental requests error:", err.message);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchMyProperties(), fetchMyRequests()]);
    setLoading(false);
  }, [fetchMyProperties, fetchMyRequests]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Accept request
  const handleAcceptRequest = async (reqId) => {
    setProcessingId(reqId);
    try {
      await requestApi.accept(reqId);
      toast.success("Rental request accepted successfully! Tenant notified.");
      fetchMyRequests();
    } catch (err) {
      toast.error(err.message || "Could not accept request");
    } finally {
      setProcessingId(null);
    }
  };

  // Reject request
  const handleRejectRequest = async (reqId) => {
    setProcessingId(reqId);
    try {
      await requestApi.reject(reqId);
      toast.info("Rental request declined.");
      fetchMyRequests();
    } catch (err) {
      toast.error(err.message || "Could not reject request");
    } finally {
      setProcessingId(null);
    }
  };

  // Computed metrics
  const totalRevenue = requests
    .filter((r) => r.status === "Paid")
    .reduce((sum, r) => sum + (parseFloat(r.rent) || 0), 0);

  const activeListingsCount = properties.length;
  const pendingRequestsCount = requests.filter((r) => r.status === "Pending").length;
  const bookedCount = requests.filter(
    (r) => r.status === "Paid" || r.status === "Accepted"
  ).length;
  const occupancyRate =
    properties.length > 0
      ? Math.min(100, Math.round((bookedCount / properties.length) * 100))
      : 0;

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2c] pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-[1280px] mx-auto">
        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#e7eeff] border border-[#adc7f7] rounded-full text-xs text-[#002045] font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-[#002045]" />
              Owner Command Center
            </div>
            <h1 className="font-headline text-3xl font-bold text-[#002045]">
              Welcome, <span className="text-[#ad3035]">{username || "Host"}</span>
            </h1>
            <p className="text-sm text-[#43474e] mt-1">
              Real-time analytics and management for your rental properties.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <button
              type="button"
              onClick={loadDashboardData}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c4c6cf]/60 rounded-xl text-xs font-bold text-[#002045] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
            >
              🔄 Refresh
            </button>
            <button
              type="button"
              onClick={() => navigate("/owner/add-property")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ad3035] hover:bg-[#8c1620] text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <span>+</span> List New Property
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-[#43474e]">
            <div className="inline-block w-8 h-8 border-4 border-[#002045] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium">Syncing your portfolio metrics...</p>
          </div>
        ) : (
          <>
            {/* ── TOP STATS CARDS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {/* Stat 1: Revenue */}
              <div className="bg-white border border-[#c4c6cf]/40 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#002045]" />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs uppercase tracking-wider text-[#43474e] font-bold">
                    Collected Revenue
                  </span>
                  <span className="text-2xl">💰</span>
                </div>
                <div className="font-headline text-2xl font-bold text-[#002045]">
                  ₹{totalRevenue.toLocaleString()}
                </div>
                <div className="text-xs text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                  <span>↗ Verified Direct Payments</span>
                </div>
              </div>

              {/* Stat 2: Active Listings */}
              <div className="bg-white border border-[#c4c6cf]/40 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600" />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs uppercase tracking-wider text-[#43474e] font-bold">
                    Active Listings
                  </span>
                  <span className="text-2xl">🏡</span>
                </div>
                <div className="font-headline text-2xl font-bold text-[#002045]">
                  {activeListingsCount}
                </div>
                <div className="text-xs text-[#74777f] mt-1 font-medium">
                  Listed across your profile
                </div>
              </div>

              {/* Stat 3: Occupancy Rate */}
              <div className="bg-white border border-[#c4c6cf]/40 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs uppercase tracking-wider text-[#43474e] font-bold">
                    Occupancy Rate
                  </span>
                  <span className="text-2xl">📊</span>
                </div>
                <div className="font-headline text-2xl font-bold text-emerald-600">
                  {occupancyRate}%
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
              </div>

              {/* Stat 4: Pending Inquiries */}
              <div className="bg-white border border-[#c4c6cf]/40 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs uppercase tracking-wider text-[#43474e] font-bold">
                    Pending Inquiries
                  </span>
                  <span className="text-2xl">⏳</span>
                </div>
                <div
                  className={`font-headline text-2xl font-bold ${
                    pendingRequestsCount > 0 ? "text-amber-600" : "text-[#002045]"
                  }`}
                >
                  {pendingRequestsCount}
                </div>
                <div className="text-xs text-[#74777f] mt-1 font-medium">
                  {pendingRequestsCount > 0 ? "Requires review below" : "All requests resolved"}
                </div>
              </div>
            </div>

            {/* ── MIDDLE SECTION: PROPERTY PORTFOLIO TABLE ── */}
            <div className="bg-white border border-[#c4c6cf]/40 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h3 className="font-headline text-lg font-bold text-[#002045] flex items-center gap-2">
                  <span>🏠</span> Your Listed Properties ({properties.length})
                </h3>
                <button
                  type="button"
                  onClick={() => navigate("/owner/add-property")}
                  className="text-xs font-bold text-[#ad3035] hover:underline cursor-pointer"
                >
                  + Add Another Property →
                </button>
              </div>

              {properties.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">🏢</div>
                  <h4 className="font-headline text-base font-bold text-[#002045] mb-1">
                    No properties listed yet
                  </h4>
                  <p className="text-xs text-[#74777f] mb-4">
                    List your rental home to start connecting directly with verified tenants.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/owner/add-property")}
                    className="px-5 py-2.5 bg-[#002045] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    List Your First Property
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-[#43474e] uppercase tracking-wider font-bold">
                        <th className="py-3 px-4">Property</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Type & Rooms</th>
                        <th className="py-3 px-4">Monthly Rent</th>
                        <th className="py-3 px-4">Deposit</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {properties.map((p) => (
                        <tr key={p.id || p._id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  p.imgUrl ||
                                  "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&dpr=2&w=100"
                                }
                                alt={p.title}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              />
                              <div>
                                <strong className="font-bold text-[#002045] block text-sm">
                                  {p.title}
                                </strong>
                                <span className="text-[11px] text-gray-400">
                                  ID: {String(p.id || p._id).substring(0, 8)}...
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#43474e]">
                            📍 {p.city}, {p.area}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-1 bg-gray-100 rounded text-[#002045] font-semibold">
                              {p.houseType} • {p.rooms} Rooms
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <strong className="text-[#002045] text-sm">
                              ₹{Number(p.rent || 0).toLocaleString()}
                            </strong>
                            <span className="text-gray-400"> /mo</span>
                          </td>
                          <td className="py-3.5 px-4 text-[#43474e]">
                            ₹{Number(p.deposit || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                p.status === "Approved"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : p.status === "Rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {p.status || "Approved"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── BOTTOM SECTION: TENANT APPROVAL QUEUE ── */}
            <div className="bg-white border border-[#c4c6cf]/40 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="mb-6 pb-4 border-b border-gray-100">
                <h3 className="font-headline text-lg font-bold text-[#002045] flex items-center gap-2">
                  <span>📋</span> Tenant Booking Inquiries ({requests.length})
                </h3>
                <p className="text-xs text-[#74777f] mt-1">
                  Review and accept incoming rental requests from verified tenants.
                </p>
              </div>

              {requests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-2">📭</div>
                  <p className="text-xs text-[#74777f]">
                    No tenant booking requests received yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-[#43474e] uppercase tracking-wider font-bold">
                        <th className="py-3 px-4">Tenant Profile</th>
                        <th className="py-3 px-4">Requested Property</th>
                        <th className="py-3 px-4">Rent Offer & Note</th>
                        <th className="py-3 px-4">Contact Phone</th>
                        <th className="py-3 px-4">Request Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {requests.map((r) => {
                        const isNegotiated = r.is_negotiated || (r.offered_rent && r.listed_rent && r.offered_rent !== r.listed_rent);
                        const offerRentVal = r.offered_rent || r.rent || r.listed_rent || 0;
                        const listRentVal = r.listed_rent || r.rent || 0;

                        return (
                          <tr key={r.id || r._id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#002045] text-white flex items-center justify-center font-bold">
                                  {r.tenant_name ? r.tenant_name[0].toUpperCase() : "T"}
                                </div>
                                <div>
                                  <strong className="text-[#002045] block">{r.tenant_name}</strong>
                                  <span className="text-[10px] text-gray-400">
                                    {r.tenant_email || "Verified Tenant"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-[#002045]">
                              {r.property_title}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <strong className="text-sm font-bold text-[#002045]">
                                  ₹{Number(offerRentVal).toLocaleString()}
                                </strong>
                                <span className="text-gray-400">/mo</span>
                                {isNegotiated && (
                                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                                    💡 Offer (Listed: ₹{Number(listRentVal).toLocaleString()})
                                  </span>
                                )}
                              </div>
                              {r.message && (
                                <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 italic max-w-xs">
                                  "{r.message}"
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-[#43474e]">📞 {r.tenant_phone || "N/A"}</td>

                            <td className="py-3.5 px-4 text-[#74777f]">📅 {r.date}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  r.status === "Paid"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : r.status === "Accepted"
                                    ? "bg-blue-100 text-blue-700"
                                    : r.status === "Rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {r.status === "Paid"
                                  ? "💳 Paid & Confirmed"
                                  : r.status === "Accepted"
                                  ? "Approved (Awaiting Pay)"
                                  : r.status === "Rejected"
                                  ? "Declined"
                                  : "⌛ Pending Review"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {r.status === "Pending" ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={processingId === (r.id || r._id)}
                                    onClick={() => handleAcceptRequest(r.id || r._id)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-sm"
                                  >
                                    ✔ Accept Offer
                                  </button>
                                  <button
                                    type="button"
                                    disabled={processingId === (r.id || r._id)}
                                    onClick={() => handleRejectRequest(r.id || r._id)}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs cursor-pointer disabled:opacity-50 shadow-sm"
                                  >
                                    ✖ Decline
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-400 font-semibold text-xs">
                                  {r.status === "Paid" ? "🎉 Completed" : "Resolved"}
                                </span>
                              )}
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
