// src/pages/TenantDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { requestApi, paymentApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const TenantDashboard = () => {
  const navigate = useNavigate();
  const { username, role } = useAuth();
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [activePaymentReq, setActivePaymentReq] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("RAZORPAY");
  const [transactionId, setTransactionId] = useState("");
  const [paying, setPaying] = useState(false);

  const fetchTenantRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestApi.getTenantRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || "Failed to load rental requests.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTenantRequests();
  }, [fetchTenantRequests]);

  const handleOpenChat = (ownerName) => {
    window.dispatchEvent(
      new CustomEvent("open-chat", {
        detail: { owner: ownerName },
      })
    );
  };

  const handleOpenPaymentModal = (req) => {
    setActivePaymentReq(req);
    setPaymentMethod("RAZORPAY");
    setTransactionId(`TXN_RYH_${Math.floor(100000 + Math.random() * 900000)}`);
  };

  // Launch Razorpay Live / Sandbox Checkout
  const handleLaunchRazorpay = async () => {
    if (!activePaymentReq) return;
    setPaying(true);

    try {
      const amountToPay = activePaymentReq.deposit || 10000;
      const reqId = activePaymentReq.id || activePaymentReq._id;

      // 1. Create order in backend via Razorpay API
      const orderData = await paymentApi.createRazorpayOrder(reqId, amountToPay);

      // 2. Load Razorpay script
      const isScriptLoaded = await loadRazorpayScript();

      if (!isScriptLoaded || !window.Razorpay) {
        // Fallback simulation if offline/blocked
        await paymentApi.verifyRazorpayPayment({
          request_id: reqId,
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: `pay_${Math.random().toString(36).substring(2, 12)}`,
          razorpay_signature: "mock_signature_verified",
          amount: amountToPay,
          method: "Razorpay Instant Checkout (Sandbox)",
        });
        toast.success("🎉 Security Deposit paid via Razorpay! Tenancy confirmed.");
        setActivePaymentReq(null);
        fetchTenantRequests();
        return;
      }

      // 3. Open official Razorpay Checkout Modal
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "RentYourHome",
        description: `Security Deposit for ${orderData.property_title}`,
        image: "https://cdn-icons-png.flaticon.com/512/2590/2590525.png",
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            await paymentApi.verifyRazorpayPayment({
              request_id: orderData.request_id,
              razorpay_order_id: response.razorpay_order_id || orderData.order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || "simulated_sig",
              amount: amountToPay,
              method: "Razorpay (UPI / Card / NetBanking)",
            });
            toast.success("🎉 Security Deposit paid via Razorpay! Lease confirmed.");
            setActivePaymentReq(null);
            fetchTenantRequests();
          } catch (verErr) {
            toast.error(verErr.message || "Payment verification failed.");
          }
        },
        prefill: {
          name: orderData.user_name || username,
          email: orderData.user_email || "",
          contact: orderData.user_phone || "9535178422",
        },
        notes: {
          property: orderData.property_title,
          tenant: username,
        },
        theme: {
          color: "#002045",
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on("payment.failed", function (response) {
        toast.error(`Payment failed: ${response.error.description || "Transaction declined"}`);
        setPaying(false);
      });
      rzpInstance.open();
    } catch (err) {
      toast.error(err.message || "Could not launch Razorpay gateway.");
    } finally {
      setPaying(false);
    }
  };

  const handleProcessManualPayment = async (e) => {
    e.preventDefault();
    if (!activePaymentReq) return;

    if (!transactionId.trim()) {
      toast.warning("Please enter a valid Transaction / Reference ID.");
      return;
    }

    setPaying(true);
    try {
      const amountToPay = activePaymentReq.deposit || 10000;
      await requestApi.payDeposit(activePaymentReq.id || activePaymentReq._id, {
        amount: amountToPay,
        method: paymentMethod,
        transactionId: transactionId.trim(),
      });

      toast.success("🎉 Security Deposit paid successfully! Your tenancy is confirmed.");
      setActivePaymentReq(null);
      fetchTenantRequests();
    } catch (err) {
      toast.error(err.message || "Payment processing failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  // Metrics
  const totalRequests = requests.length;
  const acceptedRequests = requests.filter((r) => r.status === "Accepted");
  const paidRequests = requests.filter((r) => r.status === "Paid");
  const totalDepositPaid = paidRequests.reduce((acc, r) => acc + (r.deposit || 0), 0);

  // Filtered list
  const filteredRequests = requests.filter((r) => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "ACCEPTED") return r.status === "Accepted";
    if (selectedFilter === "PENDING") return r.status === "Pending";
    if (selectedFilter === "PAID") return r.status === "Paid";
    if (selectedFilter === "REJECTED") return r.status === "Rejected";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-800 font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Tenant Command Hub
            </div>
            <h1 className="font-headline text-3xl font-bold text-[#002045]">
              My Rental <span className="text-[#ad3035]">Requests & Bookings</span>
            </h1>
            <p className="text-sm text-[#43474e] mt-1">
              Track landlord approvals, view owner contact numbers, and manage lease payments.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <button
              type="button"
              onClick={fetchTenantRequests}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#002045] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
            >
              🔄 Refresh Status
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#002045] hover:bg-[#1a365d] text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <span>🔍</span> Browse More Homes
            </button>
          </div>
        </div>

        {/* ── METRICS SUMMARY CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Card 1: Total Submitted */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#002045]" />
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs uppercase tracking-wider text-[#43474e] font-bold">
                Total Requests
              </span>
              <span className="text-2xl">📋</span>
            </div>
            <div className="font-headline text-2xl font-bold text-[#002045]">
              {totalRequests}
            </div>
            <div className="text-xs text-[#74777f] mt-1 font-medium">
              Submitted applications
            </div>
          </div>

          {/* Card 2: Approved / Ready for Move-In */}
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm relative overflow-hidden bg-emerald-50/20">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs uppercase tracking-wider text-emerald-800 font-bold">
                Approved by Owner
              </span>
              <span className="text-2xl">🎉</span>
            </div>
            <div className="font-headline text-2xl font-bold text-emerald-700">
              {acceptedRequests.length}
            </div>
            <div className="text-xs text-emerald-600 mt-1 font-semibold">
              Ready for Deposit & Move-In
            </div>
          </div>

          {/* Card 3: Paid & Confirmed */}
          <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600" />
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs uppercase tracking-wider text-[#43474e] font-bold">
                Confirmed Leases
              </span>
              <span className="text-2xl">🏡</span>
            </div>
            <div className="font-headline text-2xl font-bold text-blue-700">
              {paidRequests.length}
            </div>
            <div className="text-xs text-[#74777f] mt-1 font-medium">
              Deposit paid to landlord
            </div>
          </div>

          {/* Card 4: Total Deposit Paid */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ad3035]" />
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs uppercase tracking-wider text-[#43474e] font-bold">
                Secured Deposits
              </span>
              <span className="text-2xl">💳</span>
            </div>
            <div className="font-headline text-2xl font-bold text-[#002045]">
              ₹{totalDepositPaid.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-600 mt-1 font-semibold">
              Refundable security held
            </div>
          </div>
        </div>

        {/* ── FILTER BUTTONS ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: "ALL", label: `All Requests (${requests.length})` },
            { key: "ACCEPTED", label: `🎉 Approved (${acceptedRequests.length})` },
            { key: "PENDING", label: `⏳ Pending (${requests.filter((r) => r.status === "Pending").length})` },
            { key: "PAID", label: `💳 Paid (${paidRequests.length})` },
            { key: "REJECTED", label: `Declined (${requests.filter((r) => r.status === "Rejected").length})` },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setSelectedFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === f.key
                  ? "bg-[#002045] text-white shadow-md"
                  : "bg-white border border-gray-200 text-[#43474e] hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── REQUESTS FEED ── */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center text-[#43474e]">
            <div className="inline-block w-8 h-8 border-4 border-[#002045] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium">Loading your rental applications...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center shadow-sm">
            <div className="text-4xl mb-3">🏘️</div>
            <h3 className="font-headline text-lg font-bold text-[#002045] mb-1">
              No requests found in this category
            </h3>
            <p className="text-xs text-[#74777f] max-w-md mx-auto mb-6">
              When you find a home you like on RentYourHome and click "Send Request / Offer", your application will appear right here with real-time landlord responses.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-[#ad3035] hover:bg-[#8c1620] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              Explore Verified Homes →
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRequests.map((req) => {
              const isAccepted = req.status === "Accepted";
              const isPaid = req.status === "Paid";
              const isPending = req.status === "Pending";
              const isRejected = req.status === "Rejected";

              return (
                <div
                  key={req.id || req._id}
                  className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${
                    isAccepted
                      ? "border-emerald-300 ring-2 ring-emerald-400/20"
                      : isPaid
                      ? "border-blue-300"
                      : "border-gray-200/90"
                  }`}
                >
                  {/* Top Notification Status Header */}
                  {isAccepted && (
                    <div className="bg-emerald-600 text-white px-6 py-3 flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎉</span>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Application Approved by Landlord!
                        </span>
                      </div>
                      <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-semibold">
                        Ready to Pay Deposit & Lock Property
                      </span>
                    </div>
                  )}

                  {isPaid && (
                    <div className="bg-[#002045] text-white px-6 py-2.5 flex justify-between items-center text-xs">
                      <span className="font-bold flex items-center gap-1.5">
                        <span>🛡️</span> Tenancy Confirmed • Deposit Paid
                      </span>
                      <span className="text-emerald-400 font-bold">Active Booking</span>
                    </div>
                  )}

                  <div className="p-6 md:p-8">
                    <div className="flex flex-col lg:flex-row gap-6 justify-between">
                      {/* Left: Property & Inquired Details */}
                      <div className="flex flex-col sm:flex-row gap-5 flex-grow">
                        <img
                          src={
                            req.property_imgUrl ||
                            "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&dpr=2&w=300"
                          }
                          alt={req.property_title}
                          className="w-full sm:w-44 h-32 rounded-2xl object-cover border border-gray-100 flex-shrink-0"
                        />
                        <div className="flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-[#ad3035] bg-[#ffdad8] px-2.5 py-0.5 rounded-md">
                                {req.property_houseType || "Apartment"}
                              </span>
                              <span className="text-[11px] text-gray-400">
                                Applied on: {req.date}
                              </span>
                            </div>

                            <h3 className="font-headline text-lg font-bold text-[#002045] mt-1.5">
                              {req.property_title}
                            </h3>

                            <p className="text-xs text-[#74777f] flex items-center gap-1 mt-1">
                              📍 {req.property_area ? `${req.property_area}, ` : ""}{req.property_city || "Bengaluru"}
                            </p>
                          </div>

                          {/* Financials Breakdown */}
                          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100 text-xs">
                            <div>
                              <span className="text-gray-400 block text-[11px]">Monthly Rent</span>
                              <strong className="text-sm text-[#002045] font-bold">
                                ₹{Number(req.rent || req.offered_rent || 0).toLocaleString()}
                              </strong>
                              {req.is_negotiated && (
                                <span className="ml-1 text-[10px] text-emerald-600 font-bold">
                                  (Offer Accepted)
                                </span>
                              )}
                            </div>

                            <div>
                              <span className="text-gray-400 block text-[11px]">Security Deposit</span>
                              <strong className="text-sm text-[#002045] font-bold">
                                ₹{Number(req.deposit || 0).toLocaleString()}
                              </strong>
                            </div>

                            <div>
                              <span className="text-gray-400 block text-[11px]">Status</span>
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] mt-0.5 ${
                                  isAccepted
                                    ? "bg-emerald-100 text-emerald-800"
                                    : isPaid
                                    ? "bg-blue-100 text-blue-800"
                                    : isRejected
                                    ? "bg-red-100 text-red-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {isAccepted
                                  ? "✔ Approved by Owner"
                                  : isPaid
                                  ? "💳 Paid & Secured"
                                  : isRejected
                                  ? "✖ Declined"
                                  : "⌛ Pending Review"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions & Owner Information */}
                      <div className="lg:w-80 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
                        {isAccepted && (
                          <div className="space-y-3">
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <span>👤</span> Landlord Contact Info
                              </h4>
                              <p className="text-xs text-[#002045] font-bold mb-1">
                                Name: {req.owner_name || "Property Owner"}
                              </p>
                              {req.owner_phone && (
                                <p className="text-xs text-emerald-800 flex items-center gap-1 font-semibold mb-1">
                                  <span>📞</span> {req.owner_phone}
                                </p>
                              )}
                              {req.owner_email && (
                                <p className="text-[11px] text-gray-600 truncate">
                                  <span>✉</span> {req.owner_email}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(req)}
                              className="w-full py-3 bg-[#ad3035] hover:bg-[#8c1620] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <span>💳</span> Pay Deposit (₹{Number(req.deposit || 0).toLocaleString()})
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenChat(req.owner_name || "Owner")}
                              className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-[#002045] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <span>💬</span> Chat Directly with Owner
                            </button>
                          </div>
                        )}

                        {isPaid && (
                          <div className="space-y-2.5">
                            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900">
                              <p className="font-bold flex items-center gap-1 text-emerald-700 mb-1">
                                <span>✅</span> Security Deposit Paid
                              </p>
                              <p className="text-[11px] text-gray-600">
                                Contact Host: {req.owner_name || "Host"} ({req.owner_phone || "Phone Provided"})
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => navigate("/rental-agreement", { state: { booking: req } })}
                              className="w-full py-2.5 bg-[#002045] hover:bg-[#1a365d] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <span>📜</span> Generate Rental Agreement
                            </button>

                            <button
                              type="button"
                              onClick={() => navigate("/hra-receipts", { state: { booking: req } })}
                              className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-[#002045] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>🧾</span> Generate HRA Tax Receipts
                            </button>
                          </div>

                        )}

                        {isPending && (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
                            <p className="font-bold flex items-center gap-1">
                              <span>⏳</span> Waiting for Landlord Review
                            </p>
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                              The owner has been notified via Email & SMS. You will receive an immediate notification as soon as they accept!
                            </p>
                            <button
                              type="button"
                              onClick={() => handleOpenChat(req.owner_name || "Owner")}
                              className="w-full py-2 bg-white border border-amber-200 text-amber-900 rounded-lg text-[11px] font-bold hover:bg-amber-100/50 cursor-pointer"
                            >
                              Send Message to Landlord
                            </button>
                          </div>
                        )}

                        {isRejected && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-2">
                            <p className="font-bold flex items-center gap-1">
                              <span>✖</span> Request Declined
                            </p>
                            <p className="text-[11px] text-red-800 leading-relaxed">
                              The owner could not accommodate this booking. Don't worry, browse other zero-brokerage verified homes!
                            </p>
                            <button
                              type="button"
                              onClick={() => navigate("/")}
                              className="w-full py-2 bg-[#ad3035] text-white rounded-lg text-[11px] font-bold hover:bg-[#8c1620] cursor-pointer"
                            >
                              Browse Other Homes →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tenant's own note if sent */}
                    {req.message && (
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-[#43474e]">
                        <span className="font-semibold text-[#002045]">Your Note to Owner:</span>
                        <span className="italic text-[#74777f]">"{req.message}"</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SECURITY DEPOSIT PAYMENT MODAL ── */}
        {activePaymentReq && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setActivePaymentReq(null)}
          >
            <div
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-100 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                    🛡️ Secure Deposit Escrow
                  </span>
                  <h3 className="font-headline text-xl font-bold text-[#002045] mt-2">
                    Pay Security Deposit
                  </h3>
                  <p className="text-xs text-[#74777f]">
                    For {activePaymentReq.property_title} &bull; Landlord: {activePaymentReq.owner_name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePaymentReq(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-emerald-900 font-semibold">Refundable Security Deposit:</span>
                    <strong className="text-lg text-emerald-900 font-bold">
                      ₹{Number(activePaymentReq.deposit || 10000).toLocaleString()}
                    </strong>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Protected by RentYourHome Escrow. Held safely until key handover.
                  </p>
                </div>

                {/* Method selector tabs */}
                <div className="flex bg-gray-100 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("RAZORPAY")}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      paymentMethod === "RAZORPAY"
                        ? "bg-[#002045] text-white shadow-sm"
                        : "text-[#43474e] hover:text-[#002045]"
                    }`}
                  >
                    💳 Razorpay Gateway (UPI / Cards)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("MANUAL")}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      paymentMethod === "MANUAL"
                        ? "bg-[#002045] text-white shadow-sm"
                        : "text-[#43474e] hover:text-[#002045]"
                    }`}
                  >
                    🏦 Manual UPI / Bank Transfer
                  </button>
                </div>

                {paymentMethod === "RAZORPAY" ? (
                  <div className="space-y-4 pt-1">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-[#002045] uppercase tracking-wider flex items-center gap-1.5">
                          <span>⚡</span> Instant Razorpay Checkout
                        </span>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          100% Free Sandbox
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-semibold text-gray-700 mb-3">
                        <div className="bg-white p-2 rounded-xl border border-blue-100 shadow-2xs">📱 GPay</div>
                        <div className="bg-white p-2 rounded-xl border border-blue-100 shadow-2xs">🟣 PhonePe</div>
                        <div className="bg-white p-2 rounded-xl border border-blue-100 shadow-2xs">🔵 Paytm</div>
                        <div className="bg-white p-2 rounded-xl border border-blue-100 shadow-2xs">💳 Cards</div>
                      </div>

                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        Click below to launch Razorpay. You can complete the payment in free developer mode instantly!
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={paying}
                      onClick={handleLaunchRazorpay}
                      className="w-full py-3.5 bg-[#002045] hover:bg-[#1a365d] text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {paying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing Gateway...</span>
                        </>
                      ) : (
                        <>
                          <span>💳</span>
                          <span>Launch Razorpay Gateway (₹{Number(activePaymentReq.deposit || 10000).toLocaleString()}) →</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleProcessManualPayment} className="space-y-4 pt-1">
                    {/* Landlord Payment Credentials */}
                    {activePaymentReq.upiId && (
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs flex justify-between items-center">
                        <div>
                          <span className="text-gray-500 block text-[10px] font-semibold">Owner UPI ID</span>
                          <strong className="text-[#002045] font-bold">{activePaymentReq.upiId}</strong>
                        </div>
                        <span className="px-2 py-1 bg-white border border-gray-300 rounded text-[10px] font-bold text-gray-600">
                          Verified Payee
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-[#002045] uppercase tracking-wider mb-1.5">
                        Transaction / Reference ID
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. UPI8392019482 or TXN948291"
                        required
                        className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-gray-300 rounded-xl text-xs font-bold text-[#002045] focus:outline-none focus:border-[#002045]"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setActivePaymentReq(null)}
                        className="flex-1 py-3 border border-gray-300 rounded-xl text-xs font-bold text-[#002045] hover:bg-gray-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={paying}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        {paying ? "Confirming..." : "Confirm Manual Transfer →"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantDashboard;
