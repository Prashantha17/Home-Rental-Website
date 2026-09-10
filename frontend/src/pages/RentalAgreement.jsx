// src/pages/RentalAgreement.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { agreementApi, requestApi } from "../services/api";

const RentalAgreement = () => {
  const { user, username, role } = useAuth();
  const location = useLocation();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("create"); // "create" | "preview" | "vault"
  const [agreementsList, setAgreementsList] = useState([]);
  const [availableBookings, setAvailableBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);

  // Active Agreement Data
  const [currentAgreement, setCurrentAgreement] = useState(null);

  // Form State initialized dynamically from authenticated user
  const [form, setForm] = useState({
    property_title: "Residential Property",
    property_address: "Flat / House Address",
    city: "Bengaluru",
    landlord_name: role === "owner" ? username || "Landlord" : "",
    landlord_phone: role === "owner" ? user?.phone || "+919876543210" : "",
    landlord_pan: "ABCDE1234F",
    tenant_name: role === "user" ? username || "Tenant" : "",
    tenant_phone: role === "user" ? user?.phone || "+919123456789" : "",
    tenant_pan: "XYZPQ9876K",
    monthly_rent: 20000,
    security_deposit: 60000,
    maintenance_charges: 2000,
    tenancy_start_date: new Date().toISOString().split("T")[0],
    tenancy_duration_months: 11,
    lock_in_months: 6,
    notice_period_days: 30,
    custom_clauses: [
      "The premises shall strictly be used for residential dwelling purposes only.",
      "The tenant shall pay the monthly rent on or before the 5th day of every calendar month.",
      "Electricity and water consumption bills shall be paid directly by the tenant.",
      "The tenant shall not make any permanent structural alterations without prior written consent."
    ]
  });

  // Digital Signature Canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedSignature, setTypedSignature] = useState(username || "");
  const [signatureMode, setSignatureMode] = useState("draw"); // "draw" | "type"
  const [signeeRole, setSigneeRole] = useState(role === "owner" ? "landlord" : "tenant");

  // Helper to apply booking data directly into agreement form
  const applyBookingToForm = useCallback((b, showToast = true) => {
    if (!b) return;
    setForm((prev) => ({
      ...prev,
      property_title: b.property_title || b.title || prev.property_title,
      property_address:
        b.property_address ||
        (b.property_area ? `${b.property_area}, ${b.property_city || "Bengaluru"}` : prev.property_address),
      city: b.property_city || b.city || prev.city || "Bengaluru",
      landlord_name: b.owner_name || (role === "owner" ? username : prev.landlord_name || "Amit Sharma"),
      landlord_phone: b.owner_phone || (role === "owner" ? user?.phone || "" : prev.landlord_phone || "+919876543210"),
      tenant_name: b.tenant_name || (role === "user" ? username : prev.tenant_name || "Rahul Verma"),
      tenant_phone: b.tenant_phone || (role === "user" ? user?.phone || "" : prev.tenant_phone || "+919123456789"),
      monthly_rent: Number(b.rent || b.offered_rent || b.listed_rent || prev.monthly_rent || 20000),
      security_deposit: Number(b.deposit || (b.rent ? b.rent * 3 : prev.security_deposit) || 60000),
      maintenance_charges: prev.maintenance_charges || 2000,
    }));
    setSelectedBookingId(b.id || b._id || "");
    if (showToast) {
      toast.success(`⚡ Agreement auto-filled for "${b.property_title || b.title}"!`);
    }
  }, [role, username, user, toast]);

  // Load User's Bookings and Vault
  useEffect(() => {
    const loadUserBookingsAndProfile = async () => {
      // 1. If routed with state booking directly, apply immediately
      if (location.state?.booking) {
        applyBookingToForm(location.state.booking, false);
        return;
      }

      // 2. Otherwise fetch user's active bookings from API
      try {
        const fetchMethod = role === "owner" ? requestApi.getOwnerRequests : requestApi.getTenantRequests;
        const bookings = await fetchMethod();
        if (Array.isArray(bookings) && bookings.length > 0) {
          setAvailableBookings(bookings);
          // Auto-select the first accepted/paid or latest booking
          const preferred = bookings.find((b) => b.status === "Accepted" || b.status === "Paid") || bookings[0];
          if (preferred) {
            applyBookingToForm(preferred, false);
          }
        }
      } catch (err) {
        console.warn("Could not fetch user bookings for auto-fill:", err.message);
      }
    };

    loadUserBookingsAndProfile();
  }, [role, location.state, applyBookingToForm]);

  // Fetch all agreements for user
  const fetchAgreements = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await agreementApi.getUserAgreements();
      if (Array.isArray(data)) {
        setAgreementsList(data);
        if (data.length > 0 && !currentAgreement) {
          setCurrentAgreement(data[0]);
        }
      }
    } catch (err) {
      console.warn("Fetch agreements error:", err.message);
    } finally {
      setLoadingList(false);
    }
  }, [currentAgreement]);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name.includes("rent") || name.includes("deposit") || name.includes("charges") || name.includes("months") || name.includes("days")
        ? parseFloat(value) || 0
        : value
    }));
  };

  const handleAddClause = () => {
    setForm((prev) => ({
      ...prev,
      custom_clauses: [...prev.custom_clauses, "The tenant agrees to maintain the apartment fixtures in good condition."]
    }));
  };

  const handleRemoveClause = (index) => {
    setForm((prev) => ({
      ...prev,
      custom_clauses: prev.custom_clauses.filter((_, i) => i !== index)
    }));
  };

  const handleClauseChange = (index, value) => {
    const updated = [...form.custom_clauses];
    updated[index] = value;
    setForm((prev) => ({ ...prev, custom_clauses: updated }));
  };

  // Create or Update Agreement
  const handleSaveAgreement = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await agreementApi.create(form);
      toast.success("E-Rental Agreement created successfully!");
      setCurrentAgreement(res.agreement);
      setActiveTab("preview");
      fetchAgreements();
    } catch (err) {
      toast.error(err.message || "Failed to create agreement");
    } finally {
      setSaving(false);
    }
  };

  // Signature Canvas Drawing Logic
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#002045";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSignAgreement = async () => {
    if (!currentAgreement) {
      toast.error("Please create or select an agreement first.");
      return;
    }

    setSigning(true);
    let signatureData = "";

    if (signatureMode === "draw") {
      const canvas = canvasRef.current;
      if (!canvas) {
        toast.error("Signature canvas not found");
        setSigning(false);
        return;
      }
      signatureData = canvas.toDataURL("image/png");
    } else {
      if (!typedSignature.trim()) {
        toast.error("Please type your full legal name to sign.");
        setSigning(false);
        return;
      }
      signatureData = `DIGITALLY_SIGNED:${typedSignature.trim().toUpperCase()}:${new Date().toISOString()}`;
    }

    if (!signatureData) {
      toast.error("Please provide a valid signature before submitting.");
      setSigning(false);
      return;
    }

    try {
      const res = await agreementApi.sign(currentAgreement.id || currentAgreement._id, signatureData, signeeRole);
      toast.success(`Signed successfully as ${signeeRole === "landlord" ? "Landlord / Lessor" : "Tenant / Lessee"}!`);
      setCurrentAgreement(res.agreement);
      fetchAgreements();
    } catch (err) {
      toast.error(err.message || "Failed to sign agreement");
    } finally {
      setSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const ag = currentAgreement || form;

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2c] pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-[1100px] mx-auto">
        {/* Header (Hidden in Print) */}
        <div className="print:hidden mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-100 border border-emerald-300 rounded-full text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
            ⚖️ Legal PropTech Suite
          </div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-[#002045]">
            E-Rental Agreement Generator
          </h1>
          <p className="text-sm text-[#43474e] mt-1 max-w-2xl">
            Create, customize, digitally sign, and download legally formatted 11-Month Residential Tenancy Agreements compliant with Indian Tenancy Acts.
          </p>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mt-6 border-b border-gray-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                activeTab === "create"
                  ? "bg-[#002045] text-white shadow-md"
                  : "bg-white text-[#43474e] hover:bg-gray-100 border border-gray-200"
              }`}
            >
              📝 1. Agreement Terms
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
              📜 2. Legal Preview & Sign
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("vault")}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                activeTab === "vault"
                  ? "bg-[#002045] text-white shadow-md"
                  : "bg-white text-[#43474e] hover:bg-gray-100 border border-gray-200"
              }`}
            >
              📂 3. Agreement Vault ({agreementsList.length})
            </button>
          </div>
        </div>

        {/* ── TAB 1: CONFIGURE AGREEMENT TERMS ── */}
        {activeTab === "create" && (
          <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-[#c4c6cf]/40">
            {/* ⚡ Auto-Fill Notification Banner */}
            <div className="mb-8 p-4 bg-gradient-to-r from-[#e7eeff] via-[#f0f4ff] to-emerald-50 border border-[#adc7f7] rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <strong className="text-sm font-bold text-[#002045] block">
                    Auto-Filled from Verified User Profile & Bookings
                  </strong>
                  <span className="text-xs text-[#43474e]">
                    {availableBookings.length > 0
                      ? `Found ${availableBookings.length} booking(s). Select a property below to auto-fill terms instantly.`
                      : `Synced with active login: ${username} (${role}). You can edit any field below.`}
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
                    <option value="">-- Switch Auto-Fill Booking --</option>
                    {availableBookings.map((b) => (
                      <option key={b.id || b._id} value={b.id || b._id}>
                        {b.property_title} (₹{Number(b.rent || b.offered_rent || 0).toLocaleString()}/mo) - {b.status}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveAgreement} className="space-y-8">
              {/* Landlord Section */}
              <div>
                <h3 className="font-headline text-base font-bold text-[#002045] uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                  <span>👤</span> Landlord / Lessor Details
                  {role === "owner" && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      ✓ Auto-filled (Logged-in Owner)
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                      Full Legal Name
                    </label>
                    <input
                      name="landlord_name"
                      value={form.landlord_name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Amit Sharma"
                      className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-semibold text-[#002045]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                      Contact Phone
                    </label>
                    <input
                      name="landlord_phone"
                      value={form.landlord_phone}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. +919876543210"
                      className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-semibold text-[#002045]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                      Landlord PAN Number
                    </label>
                    <input
                      name="landlord_pan"
                      value={form.landlord_pan}
                      onChange={handleInputChange}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm uppercase font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Tenant Section */}
              <div>
                <h3 className="font-headline text-base font-bold text-[#002045] uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                  <span>🏠</span> Tenant / Lessee Details
                  {role === "user" && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                      ✓ Auto-filled (Logged-in Tenant)
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                      Tenant Legal Name
                    </label>
                    <input
                      name="tenant_name"
                      value={form.tenant_name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Rahul Verma"
                      className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-semibold text-[#002045]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                      Contact Phone
                    </label>
                    <input
                      name="tenant_phone"
                      value={form.tenant_phone}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. +919123456789"
                      className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-semibold text-[#002045]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                      Tenant PAN / Aadhaar
                    </label>
                    <input
                      name="tenant_pan"
                      value={form.tenant_pan}
                      onChange={handleInputChange}
                      placeholder="e.g. XYZPQ9876K"
                      className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm uppercase font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Rented Property Demarcation */}
              <div>
                <h3 className="font-headline text-base font-bold text-[#002045] uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                  📍 Rented Property Demarcation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                      Complete Address of Premises
                    </label>
                    <input
                      name="property_address"
                      value={form.property_address}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Flat 402, Green Valley Enclave, Outer Ring Road"
                      className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-semibold text-[#002045]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                      City / State
                    </label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Bengaluru"
                      className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-semibold text-[#002045]"
                    />
                  </div>
                </div>
              </div>

              {/* Commercial Terms */}
              <div>
                <h3 className="font-headline text-base font-bold text-[#002045] uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                  💰 Commercial Terms & Tenancy Period
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                      Monthly Rent (₹)
                    </label>
                    <input
                      type="number"
                      name="monthly_rent"
                      value={form.monthly_rent}
                      onChange={handleInputChange}
                      required
                      min={1000}
                      className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-bold text-[#002045]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                      Security Deposit (₹)
                    </label>
                    <input
                      type="number"
                      name="security_deposit"
                      value={form.security_deposit}
                      onChange={handleInputChange}
                      required
                      min={1000}
                      className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-bold text-[#002045]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                      Maintenance Charges (₹/mo)
                    </label>
                    <input
                      type="number"
                      name="maintenance_charges"
                      value={form.maintenance_charges}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                      Tenancy Start Date
                    </label>
                    <input
                      type="date"
                      name="tenancy_start_date"
                      value={form.tenancy_start_date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                      Duration (Months)
                    </label>
                    <input
                      type="number"
                      name="tenancy_duration_months"
                      value={form.tenancy_duration_months}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                      Lock-in Period (Months)
                    </label>
                    <input
                      type="number"
                      name="lock_in_months"
                      value={form.lock_in_months}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#43474e] uppercase mb-1">
                      Notice Period (Days)
                    </label>
                    <input
                      type="number"
                      name="notice_period_days"
                      value={form.notice_period_days}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Clauses */}
              <div>
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                  <h3 className="font-headline text-base font-bold text-[#002045] uppercase tracking-wider">
                    📋 Legal Clauses & Covenants ({form.custom_clauses.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddClause}
                    className="text-xs font-bold text-[#002045] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    + Add Clause
                  </button>
                </div>
                <div className="space-y-3">
                  {form.custom_clauses.map((clause, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-[#74777f] w-6 text-right">
                        {idx + 1}.
                      </span>
                      <input
                        value={clause}
                        onChange={(e) => handleClauseChange(idx, e.target.value)}
                        className="flex-grow px-3.5 py-2 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveClause(idx)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center font-bold text-xs cursor-pointer flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit / Proceed */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3.5 bg-[#002045] hover:bg-[#1a365d] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {saving ? "Saving Draft..." : "Generate Legal Agreement Document →"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB 2: PREVIEW, DIGITAL SIGNATURE & EXPORT ── */}
        {activeTab === "preview" && (
          <div className="space-y-8">
            {/* Top Toolbar (Hidden in Print) */}
            <div className="print:hidden bg-white p-4 rounded-2xl border border-[#c4c6cf]/40 flex flex-wrap justify-between items-center gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    ag.status === "Executed"
                      ? "bg-emerald-100 text-emerald-800"
                      : ag.status === "Pending_Landlord_Signature" || ag.status === "Pending_Tenant_Signature"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  Status: {ag.status || "Draft"}
                </span>
                <span className="text-xs text-[#74777f]">
                  Doc ID: {ag.id || ag._id || "NEW-DRAFT"}
                </span>
              </div>

              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-white border border-[#c4c6cf] text-[#002045] rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
                >
                  🖨️ Print / Save as PDF
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("create")}
                  className="px-4 py-2 bg-[#002045] text-white rounded-xl text-xs font-bold hover:bg-[#1a365d] flex items-center gap-1.5 cursor-pointer"
                >
                  ✏️ Edit Terms
                </button>
              </div>
            </div>

            {/* ── PRINTABLE AGREEMENT DOCUMENT ── */}
            <div className="bg-white p-8 md:p-14 rounded-3xl shadow-xl border border-gray-200 print:shadow-none print:border-none print:p-0">
              {/* Simulated e-Stamp Duty Header */}
              <div className="border-4 border-double border-[#002045] p-6 mb-8 text-center bg-amber-50/20 rounded-xl relative overflow-hidden">
                <div className="text-xs uppercase tracking-widest font-bold text-[#ad3035] mb-1">
                  Government of India &bull; State Tenancy Registration
                </div>
                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#002045] uppercase">
                  Certificate of Stamp Duty & Tenancy
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-[11px] text-[#43474e] border-t border-[#002045]/20 pt-3">
                  <div>
                    <strong>Certificate No:</strong> IN-KA{Math.floor(Math.random() * 900000 + 100000)}
                  </div>
                  <div>
                    <strong>Duty Paid:</strong> ₹100.00
                  </div>
                  <div>
                    <strong>First Party:</strong> {ag.landlord_name || "Lessor"}
                  </div>
                  <div>
                    <strong>Second Party:</strong> {ag.tenant_name || "Lessee"}
                  </div>
                </div>
              </div>

              {/* Legal Agreement Text */}
              <div className="space-y-6 text-sm text-[#1e293b] leading-relaxed font-serif">
                <h2 className="text-center text-xl font-bold uppercase underline tracking-wider text-[#002045]">
                  Residential Tenancy Agreement
                </h2>

                <p>
                  This <strong>Residential Tenancy Agreement</strong> (the "Agreement") is executed on this{" "}
                  <strong>{ag.tenancy_start_date || new Date().toISOString().split("T")[0]}</strong> at{" "}
                  <strong>{ag.city || "Bengaluru"}</strong>, by and between:
                </p>

                <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-200 text-xs font-sans space-y-2">
                  <p>
                    <strong>LESSOR / LANDLORD:</strong> <strong>{ag.landlord_name}</strong>, Contact: {ag.landlord_phone}, PAN:{" "}
                    <strong>{ag.landlord_pan || "NOT_PROVIDED"}</strong> (hereinafter referred to as the <em>"LESSOR"</em>, which expression shall include their legal heirs, executors, and assigns).
                  </p>
                  <p className="text-center font-bold text-gray-400">--- AND ---</p>
                  <p>
                    <strong>LESSEE / TENANT:</strong> <strong>{ag.tenant_name}</strong>, Contact: {ag.tenant_phone}, PAN/ID:{" "}
                    <strong>{ag.tenant_pan || "NOT_PROVIDED"}</strong> (hereinafter referred to as the <em>"LESSEE"</em>, which expression shall include their successors).
                  </p>
                </div>

                <h3 className="font-sans font-bold text-sm text-[#002045] uppercase tracking-wider">
                  1. Demised Premises
                </h3>
                <p>
                  The Lessor hereby leases to the Lessee and the Lessee agrees to take on lease the residential premises situated at:{" "}
                  <strong>{ag.property_address}, {ag.city}</strong> (hereinafter referred to as the <em>"Premises"</em>).
                </p>

                <h3 className="font-sans font-bold text-sm text-[#002045] uppercase tracking-wider">
                  2. Tenancy Period & Lock-In
                </h3>
                <p>
                  This lease is granted for an initial period of <strong>{ag.tenancy_duration_months || 11} months</strong> commencing from{" "}
                  <strong>{ag.tenancy_start_date}</strong>. Both parties agree to a lock-in period of <strong>{ag.lock_in_months || 6} months</strong>, during which neither party shall terminate the agreement.
                </p>

                <h3 className="font-sans font-bold text-sm text-[#002045] uppercase tracking-wider">
                  3. Monthly Rent & Maintenance
                </h3>
                <p>
                  The agreed monthly rent payable by the Lessee to the Lessor is <strong>₹{Number(ag.monthly_rent || 0).toLocaleString()}</strong> (Rupees {ag.monthly_rent} only), payable in advance on or before the 5th day of every calendar month. An additional maintenance charge of <strong>₹{Number(ag.maintenance_charges || 0).toLocaleString()}</strong> per month shall be paid as applicable.
                </p>

                <h3 className="font-sans font-bold text-sm text-[#002045] uppercase tracking-wider">
                  4. Interest-Free Refundable Security Deposit
                </h3>
                <p>
                  The Lessee has deposited with the Lessor a sum of <strong>₹{Number(ag.security_deposit || 0).toLocaleString()}</strong> as an interest-free refundable security deposit. This amount shall be fully refunded to the Lessee at the time of vacating and handing over vacant possession of the Premises, subject to deductions for any unpaid rent, utilities, or damages.
                </p>

                <h3 className="font-sans font-bold text-sm text-[#002045] uppercase tracking-wider">
                  5. Termination & Notice Period
                </h3>
                <p>
                  After expiry of the lock-in period, either party may terminate this agreement by giving <strong>{ag.notice_period_days || 30} days</strong> prior written notice.
                </p>

                <h3 className="font-sans font-bold text-sm text-[#002045] uppercase tracking-wider">
                  6. House Rules & Covenants
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-xs font-sans">
                  {ag.custom_clauses && ag.custom_clauses.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ol>

                {/* Signature Execution Section */}
                <div className="pt-8 mt-10 border-t-2 border-gray-300 grid grid-cols-2 gap-8 text-xs font-sans">
                  {/* Landlord Signature Block */}
                  <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 flex flex-col justify-between h-44">
                    <div>
                      <span className="font-bold text-[#002045] uppercase tracking-wider block">
                        Lessor / Landlord Signature
                      </span>
                      <span className="text-[11px] text-gray-500">{ag.landlord_name}</span>
                    </div>

                    <div className="text-center py-2">
                      {ag.landlord_signature ? (
                        ag.landlord_signature.startsWith("data:image") ? (
                          <img
                            src={ag.landlord_signature}
                            alt="Landlord Signature"
                            className="max-h-16 mx-auto object-contain"
                          />
                        ) : (
                          <div className="font-serif italic font-bold text-base text-blue-900 border-b border-blue-900 inline-block px-4">
                            {ag.landlord_signature.split(":")[1] || ag.landlord_signature}
                          </div>
                        )
                      ) : (
                        <span className="text-xs text-amber-700 font-semibold italic bg-amber-50 px-3 py-1 rounded">
                          ⌛ Pending Landlord Signature
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-gray-400 border-t border-gray-200 pt-1 flex justify-between">
                      <span>Date: {ag.landlord_signed_at ? new Date(ag.landlord_signed_at).toLocaleDateString() : "Pending"}</span>
                      <span>Verified Digital Sign</span>
                    </div>
                  </div>

                  {/* Tenant Signature Block */}
                  <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 flex flex-col justify-between h-44">
                    <div>
                      <span className="font-bold text-[#002045] uppercase tracking-wider block">
                        Lessee / Tenant Signature
                      </span>
                      <span className="text-[11px] text-gray-500">{ag.tenant_name}</span>
                    </div>

                    <div className="text-center py-2">
                      {ag.tenant_signature ? (
                        ag.tenant_signature.startsWith("data:image") ? (
                          <img
                            src={ag.tenant_signature}
                            alt="Tenant Signature"
                            className="max-h-16 mx-auto object-contain"
                          />
                        ) : (
                          <div className="font-serif italic font-bold text-base text-blue-900 border-b border-blue-900 inline-block px-4">
                            {ag.tenant_signature.split(":")[1] || ag.tenant_signature}
                          </div>
                        )
                      ) : (
                        <span className="text-xs text-amber-700 font-semibold italic bg-amber-50 px-3 py-1 rounded">
                          ⌛ Pending Tenant Signature
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-gray-400 border-t border-gray-200 pt-1 flex justify-between">
                      <span>Date: {ag.tenant_signed_at ? new Date(ag.tenant_signed_at).toLocaleDateString() : "Pending"}</span>
                      <span>Verified Digital Sign</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── DIGITAL SIGNATURE PAD (Hidden in Print) ── */}
            {currentAgreement && ag.status !== "Executed" && (
              <div className="print:hidden bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-headline text-lg font-bold text-[#002045] flex items-center gap-2">
                      <span>✍️</span> Digital Signature Console
                    </h3>
                    <p className="text-xs text-[#74777f] mt-0.5">
                      Sign this agreement legally using touch drawing or verified typed signature.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSigneeRole("tenant")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        signeeRole === "tenant"
                          ? "bg-[#002045] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Sign as Tenant
                    </button>
                    <button
                      type="button"
                      onClick={() => setSigneeRole("landlord")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        signeeRole === "landlord"
                          ? "bg-[#002045] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Sign as Landlord
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setSignatureMode("draw")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                      signatureMode === "draw" ? "bg-gray-200 text-[#002045]" : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    ✏️ Draw Signature
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureMode("type")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                      signatureMode === "type" ? "bg-gray-200 text-[#002045]" : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    ⌨️ Type Legal Name
                  </button>
                </div>

                {signatureMode === "draw" ? (
                  <div>
                    <div className="border-2 border-dashed border-[#c4c6cf] rounded-2xl overflow-hidden bg-[#f9f9ff] relative h-40">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={160}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-full cursor-crosshair touch-none"
                      />
                      <span className="absolute bottom-2 right-3 text-[10px] text-gray-400 font-mono select-none">
                        Draw signature inside box
                      </span>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                      >
                        Clear Signature
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      placeholder="Type your full legal name..."
                      className="w-full px-4 py-3 bg-[#f9f9ff] border border-gray-300 rounded-xl text-base font-serif italic text-[#002045] font-bold"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Typing your name executes a legally binding electronic signature timestamped with your account credentials.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={signing}
                    onClick={handleSignAgreement}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
                  >
                    {signing ? "Affixing Signature..." : `Affix Signature as ${signeeRole === "landlord" ? "Landlord" : "Tenant"} →`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: AGREEMENT VAULT ── */}
        {activeTab === "vault" && (
          <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-[#c4c6cf]/40">
            <h3 className="font-headline text-lg font-bold text-[#002045] mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <span>📂 Executed & Draft Agreements</span>
              <span className="text-xs font-normal text-gray-400">{agreementsList.length} Total</span>
            </h3>

            {loadingList ? (
              <div className="text-center py-12 text-[#43474e]">
                <div className="inline-block w-8 h-8 border-4 border-[#002045] border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-xs">Loading agreements vault...</p>
              </div>
            ) : agreementsList.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">📜</div>
                <h4 className="font-bold text-[#002045] mb-1">No agreements created yet</h4>
                <p className="text-xs text-gray-500 mb-4">
                  Configure your first rental agreement draft in Tab 1 to get started.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("create")}
                  className="px-5 py-2.5 bg-[#002045] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Create Agreement Draft
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {agreementsList.map((item) => (
                  <div
                    key={item.id || item._id}
                    className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50/80 px-3 rounded-xl transition-colors"
                  >
                    <div>
                      <strong className="font-bold text-[#002045] text-sm block">
                        {item.property_title || "Residential Tenancy"}
                      </strong>
                      <span className="text-xs text-gray-500">
                        {item.landlord_name} (Lessor) &bull; {item.tenant_name} (Lessee) &bull; ₹{Number(item.monthly_rent || 0).toLocaleString()}/mo
                      </span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          item.status === "Executed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.status || "Draft"}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setCurrentAgreement(item);
                          setActiveTab("preview");
                        }}
                        className="px-4 py-2 bg-[#002045] text-white rounded-xl text-xs font-bold hover:bg-[#1a365d] cursor-pointer"
                      >
                        Open & Sign →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalAgreement;
