// src/pages/HraReceipts.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { receiptApi, requestApi } from "../services/api";

const HraReceipts = () => {
  const { user, username, role } = useAuth();
  const location = useLocation();
  const toast = useToast();

  const [generating, setGenerating] = useState(false);
  const [receiptBundle, setReceiptBundle] = useState(null);
  const [savedBundles, setSavedBundles] = useState([]);
  const [availableBookings, setAvailableBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [activeTab, setActiveTab] = useState("generate"); // "generate" | "preview"

  const [form, setForm] = useState({
    tenant_name: username || "Tenant",
    landlord_name: "",
    landlord_pan: "ABCDE1234F",
    property_address: "",
    city: "Bengaluru",
    monthly_rent: 20000,
    start_month: "2025-04",
    end_month: "2026-03",
    payment_mode: "UPI / Online Bank Transfer"
  });

  // Helper to apply booking details to HRA receipts form
  const applyBookingToForm = useCallback((b, showToast = true) => {
    if (!b) return;
    setForm((prev) => ({
      ...prev,
      tenant_name: b.tenant_name || username || prev.tenant_name,
      landlord_name: b.owner_name || prev.landlord_name || "Landlord",
      property_address:
        b.property_address ||
        (b.property_area ? `${b.property_area}, ${b.property_city || "Bengaluru"}` : prev.property_address),
      city: b.property_city || b.city || prev.city || "Bengaluru",
      monthly_rent: Number(b.rent || b.offered_rent || b.listed_rent || prev.monthly_rent || 20000),
    }));
    setSelectedBookingId(b.id || b._id || "");
    if (showToast) {
      toast.success(`⚡ HRA details auto-filled for "${b.property_title || b.title}"!`);
    }
  }, [username, toast]);

  // Load Bookings for Auto-Fill
  useEffect(() => {
    const loadBookings = async () => {
      // 1. If routed with state booking directly
      if (location.state?.booking) {
        applyBookingToForm(location.state.booking, false);
        return;
      }

      // 2. Otherwise fetch from API
      try {
        const fetchMethod = role === "owner" ? requestApi.getOwnerRequests : requestApi.getTenantRequests;
        const bookings = await fetchMethod();
        if (Array.isArray(bookings) && bookings.length > 0) {
          setAvailableBookings(bookings);
          const preferred = bookings.find((b) => b.status === "Accepted" || b.status === "Paid") || bookings[0];
          if (preferred) {
            applyBookingToForm(preferred, false);
          }
        }
      } catch (err) {
        console.warn("Could not fetch user bookings for HRA auto-fill:", err.message);
      }
    };

    loadBookings();
  }, [role, location.state, applyBookingToForm]);

  const fetchSavedReceipts = async () => {
    try {
      const data = await receiptApi.getUserReceipts();
      if (Array.isArray(data) && data.length > 0) {
        setSavedBundles(data);
        if (!receiptBundle) setReceiptBundle(data[0]);
      }
    } catch (err) {
      console.warn("Fetch receipts error:", err.message);
    }
  };

  useEffect(() => {
    fetchSavedReceipts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "monthly_rent" ? parseFloat(value) || 0 : value
    }));
  };

  const handleGenerateReceipts = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await receiptApi.generate(form);
      toast.success("12-Month HRA Rent Receipts Generated Successfully!");
      setReceiptBundle(res.receipt_bundle);
      setActiveTab("preview");
      fetchSavedReceipts();
    } catch (err) {
      toast.error(err.message || "Failed to generate HRA receipts");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const bundle = receiptBundle || {
    tenant_name: form.tenant_name,
    landlord_name: form.landlord_name,
    landlord_pan: form.landlord_pan,
    property_address: form.property_address,
    city: form.city,
    monthly_rent: form.monthly_rent,
    total_rent_paid: form.monthly_rent * 12,
    pan_required: form.monthly_rent * 12 > 100000,
    start_month: form.start_month,
    end_month: form.end_month,
    receipts: [
      {
        receipt_number: "HRA-202504-001",
        month_name: "April 2025",
        period: "01-Apr-2025 to 30-Apr-2025",
        payment_date: "2025-04-05",
        rent_amount: form.monthly_rent,
        payment_mode: form.payment_mode,
        transaction_ref: "TXN20250488219"
      }
    ]
  };

  const isPanMandatory = (bundle.monthly_rent || form.monthly_rent) * 12 > 100000;

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2c] pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-[1000px] mx-auto">
        {/* Top Header */}
        <div className="print:hidden mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-100 border border-blue-300 rounded-full text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">
            🧾 Income Tax Section 10(13A) Compliance
          </div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-[#002045]">
            HRA Rent Receipts Generator
          </h1>
          <p className="text-sm text-[#43474e] mt-1 max-w-2xl">
            Generate monthly or annual House Rent Allowance (HRA) receipts with ₹1 simulated Revenue Stamp verification, instant PDF export, and statutory PAN validation.
          </p>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-6 border-b border-gray-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("generate")}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                activeTab === "generate"
                  ? "bg-[#002045] text-white shadow-md"
                  : "bg-white text-[#43474e] hover:bg-gray-100 border border-gray-200"
              }`}
            >
              📝 1. Rent Details & Config
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                activeTab === "preview"
                  ? "bg-[#002045] text-white shadow-md"
                  : "bg-white text-[#43474e] hover:bg-gray-100 border border-gray-200"
              }`}
            >
              🧾 2. Printable HRA Vouchers ({bundle.receipts ? bundle.receipts.length : 12})
            </button>
          </div>
        </div>

        {/* ── TAB 1: FORM CONFIGURATION ── */}
        {activeTab === "generate" && (
          <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-[#c4c6cf]/40">
            {/* ⚡ Auto-Fill Notification Banner */}
            <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 via-[#f0f4ff] to-emerald-50 border border-blue-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <strong className="text-sm font-bold text-[#002045] block">
                    Auto-Filled from Verified Booking
                  </strong>
                  <span className="text-xs text-[#43474e]">
                    {availableBookings.length > 0
                      ? `Found ${availableBookings.length} booking(s). Select a tenancy below to auto-fill monthly rent & landlord info.`
                      : `Synced with active login: ${username}.`}
                  </span>
                </div>
              </div>

              {availableBookings.length > 0 && (
                <div className="w-full md:w-auto">
                  <select
                    value={selectedBookingId}
                    onChange={(e) => {
                      const selected = availableBookings.find((b) => (b.id || b._id) === e.target.value);
                      if (selected) applyBookingToForm(selected, true);
                    }}
                    className="w-full md:w-64 px-3.5 py-2 bg-white border border-[#002045]/40 rounded-xl text-xs font-bold text-[#002045] shadow-sm focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Switch Auto-Fill Tenancy --</option>
                    {availableBookings.map((b) => (
                      <option key={b.id || b._id} value={b.id || b._id}>
                        {b.property_title} (₹{Number(b.rent || b.offered_rent || 0).toLocaleString()}/mo)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <form onSubmit={handleGenerateReceipts} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                    Tenant Full Legal Name
                  </label>
                  <input
                    name="tenant_name"
                    value={form.tenant_name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Rahul Verma"
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-semibold text-[#002045]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                    Landlord / Property Owner Name
                  </label>
                  <input
                    name="landlord_name"
                    value={form.landlord_name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Amit Sharma"
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-semibold text-[#002045]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                    Landlord PAN Number (Mandatory if rent &gt; ₹1 Lakh/yr)
                  </label>
                  <input
                    name="landlord_pan"
                    value={form.landlord_pan}
                    onChange={handleChange}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                    Monthly Rent (₹)
                  </label>
                  <input
                    type="number"
                    name="monthly_rent"
                    value={form.monthly_rent}
                    onChange={handleChange}
                    required
                    min={1000}
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-bold text-[#002045]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                    Rented Property Complete Address
                  </label>
                  <input
                    name="property_address"
                    value={form.property_address}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Flat 402, Green Valley Enclave, Outer Ring Road"
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-semibold text-[#002045]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                    City / Location
                  </label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Bengaluru"
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-semibold text-[#002045]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                    Payment Mode
                  </label>
                  <select
                    name="payment_mode"
                    value={form.payment_mode}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-semibold text-[#002045]"
                  >
                    <option value="UPI / Online Bank Transfer">UPI / Online Bank Transfer</option>
                    <option value="Cheque / DD">Cheque / Demand Draft</option>
                    <option value="NetBanking (NEFT/RTGS)">NetBanking (NEFT/RTGS)</option>
                    <option value="Cash">Cash with Physical Receipt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                    Financial Year Start Month
                  </label>
                  <input
                    type="month"
                    name="start_month"
                    value={form.start_month}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-semibold text-[#002045]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                    Financial Year End Month
                  </label>
                  <input
                    type="month"
                    name="end_month"
                    value={form.end_month}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-semibold text-[#002045]"
                  />
                </div>
              </div>

              {/* Statutory PAN Advisory Alert */}
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  form.monthly_rent * 12 > 100000
                    ? "bg-amber-50 border-amber-300 text-amber-900"
                    : "bg-blue-50 border-blue-200 text-blue-900"
                }`}
              >
                <div className="font-bold flex items-center gap-1 mb-1">
                  <span>ℹ️</span> Annual Rent Estimate: ₹{(form.monthly_rent * 12).toLocaleString()}
                </div>
                {form.monthly_rent * 12 > 100000 ? (
                  <p>
                    <strong>Statutory Requirement (IT Act 1961):</strong> Since your total annual rent exceeds ₹1,00,000, your employer requires the <strong>Landlord's PAN Number</strong> to grant HRA tax exemption benefits under Section 10(13A).
                  </p>
                ) : (
                  <p>
                    Since your annual rent is under ₹1,00,000, Landlord PAN declaration is optional under Central Board of Direct Taxes (CBDT) rules.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={generating}
                  className="px-8 py-3.5 bg-[#002045] hover:bg-[#1a365d] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {generating ? "Generating 12 Vouchers..." : "Generate 12-Month HRA Receipts Bundle →"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB 2: PRINTABLE RECEIPTS ── */}
        {activeTab === "preview" && (
          <div className="space-y-8">
            {/* Top Toolbar */}
            <div className="print:hidden bg-white p-4 rounded-2xl border border-[#c4c6cf]/40 flex flex-wrap justify-between items-center gap-4 shadow-sm">
              <div>
                <strong className="text-sm font-bold text-[#002045] block">
                  HRA Rent Receipt Vouchers ({bundle.receipts ? bundle.receipts.length : 12} Months)
                </strong>
                <span className="text-xs text-[#74777f]">
                  Total Rent Claimed: ₹{Number(bundle.total_rent_paid || 0).toLocaleString()} &bull; {bundle.start_month} to {bundle.end_month}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-[#002045] text-white rounded-xl text-xs font-bold hover:bg-[#1a365d] shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  🖨️ Print / Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("generate")}
                  className="px-4 py-2.5 bg-white border border-[#c4c6cf] text-[#002045] rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  ✏️ Edit Form
                </button>
              </div>
            </div>

            {/* Printable Vouchers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:p-0">
              {bundle.receipts &&
                bundle.receipts.map((rc, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-2xl border border-gray-300 shadow-sm relative overflow-hidden flex flex-col justify-between h-80 print:shadow-none print:border print:h-72 print:break-inside-avoid"
                  >
                    {/* Header */}
                    <div>
                      <div className="flex justify-between items-start border-b border-gray-200 pb-2 mb-3">
                        <div>
                          <span className="text-[10px] uppercase tracking-widest font-bold text-[#ad3035]">
                            RENT RECEIPT VOUCHER
                          </span>
                          <h4 className="font-serif font-bold text-sm text-[#002045]">
                            {rc.month_name}
                          </h4>
                        </div>
                        <span className="font-mono text-[11px] text-gray-500 font-bold">
                          {rc.receipt_number}
                        </span>
                      </div>

                      {/* Receipt Body */}
                      <p className="text-xs leading-relaxed text-[#1e293b] font-serif">
                        Received a sum of <strong>₹{Number(rc.rent_amount || bundle.monthly_rent || 0).toLocaleString()}</strong> (INR) from{" "}
                        <strong>{bundle.tenant_name}</strong> towards the residential rent for the period{" "}
                        <strong>{rc.period}</strong> for premises at{" "}
                        <strong>{bundle.property_address}, {bundle.city}</strong>.
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-[#43474e] border-t border-gray-100 pt-2 font-sans">
                        <div>
                          <strong>Payment Date:</strong> {rc.payment_date}
                        </div>
                        <div>
                          <strong>Mode:</strong> {rc.payment_mode || "Online"}
                        </div>
                        <div>
                          <strong>Txn Ref:</strong> {rc.transaction_ref}
                        </div>
                        <div>
                          <strong>Landlord PAN:</strong>{" "}
                          <span className="font-mono font-bold text-[#002045]">
                            {bundle.landlord_pan || "NOT_APPLICABLE"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Signature & Revenue Stamp */}
                    <div className="flex justify-between items-end pt-3 border-t border-gray-200 mt-2 font-sans">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Landlord / Owner:</span>
                        <strong className="text-xs text-[#002045]">{bundle.landlord_name}</strong>
                      </div>

                      {/* Simulated ₹1 Revenue Stamp */}
                      <div className="relative w-20 h-16 border-2 border-dashed border-red-700 bg-red-50/60 rounded flex flex-col items-center justify-center text-center p-1 overflow-hidden select-none">
                        <span className="text-[8px] font-bold text-red-800 uppercase tracking-tighter">
                          REVENUE
                        </span>
                        <span className="text-xs font-black text-red-700">₹1.00</span>
                        <span className="text-[7px] text-red-900 font-serif">INDIA</span>
                        {/* Simulated Signature Stroke */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none transform -rotate-12">
                          <span className="font-serif italic text-xs font-bold text-blue-900 tracking-wider">
                            {bundle.landlord_name.split(" ")[0] || "Signed"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HraReceipts;
