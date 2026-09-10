// src/pages/AddProperty.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { propertyApi } from "../services/api";
import { INDIA_LOCATIONS, lookupPincode } from "../data/indiaLocations";

const AddProperty = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Image files & preview state
  const [imageFile, setImageFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [bedroomFile, setBedroomFile] = useState(null);
  const [bedroomPreview, setBedroomPreview] = useState(null);

  const [hallFile, setHallFile] = useState(null);
  const [hallPreview, setHallPreview] = useState(null);

  const [kitchenFile, setKitchenFile] = useState(null);
  const [kitchenPreview, setKitchenPreview] = useState(null);

  const [form, setForm] = useState({
    title: "",
    state: "Karnataka",
    district: "Bengaluru Urban",
    taluk: "Indiranagar (Bengaluru East)",
    city: "Bengaluru",
    area: "Indiranagar",
    pincode: "560038",
    address: "",
    rent: "",
    deposit: "",
    houseType: "2BHK",
    rooms: 2,
    facilities: "",
    rules: "",
    locationLink: "",
    upiId: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankIfscCode: "",
  });

  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Handle PIN code lookup to auto-fill State, District, City
  const handlePincodeChange = async (pinValue) => {
    setForm((prev) => ({ ...prev, pincode: pinValue }));
    const cleanPin = pinValue.trim();
    if (cleanPin.length === 6 && /^\d{6}$/.test(cleanPin)) {
      setPincodeLoading(true);
      try {
        const resolved = await lookupPincode(cleanPin);
        if (resolved) {
          setForm((prev) => ({
            ...prev,
            state: resolved.state || prev.state,
            district: resolved.district || prev.district,
            taluk: resolved.taluk || prev.taluk,
            city: resolved.city || prev.city,
            area: resolved.taluk || prev.area,
          }));
          toast.success(`📍 Auto-filled: ${resolved.taluk || resolved.district}, ${resolved.state}`);
        }
      } catch (err) {
        console.warn("Pincode resolve error:", err);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  // Handle Cover Photo preview
  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // Handle Additional Photos preview
  const handleExtraPhotoChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    if (type === "bedroom") {
      setBedroomFile(file);
      setBedroomPreview(previewUrl);
    } else if (type === "hall") {
      setHallFile(file);
      setHallPreview(previewUrl);
    } else if (type === "kitchen") {
      setKitchenFile(file);
      setKitchenPreview(previewUrl);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.warning("Geolocation is not supported by your browser.");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const link = `https://maps.google.com/?q=${lat},${lng}`;
        setForm((prev) => ({ ...prev, locationLink: link }));
        setGettingLocation(false);
        toast.success("Live GPS coordinates attached to listing!");
      },
      (error) => {
        toast.error("Unable to retrieve your location. Please check browser permissions.");
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleAddProperty = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error("Cover photo is required for listing verification.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Upload Cover Photo
      const coverUploadRes = await propertyApi.uploadImage(imageFile);
      const finalImgUrl = coverUploadRes.imageUrl;

      // 2. Upload Additional Photos in Parallel with Promise.all
      const additionalUploadPromises = [bedroomFile, hallFile, kitchenFile]
        .filter(Boolean)
        .map((file) => propertyApi.uploadImage(file).then((r) => r.imageUrl).catch(() => ""));

      const extraUrls = await Promise.all(additionalUploadPromises);
      const additionalImagesStr = extraUrls.filter(Boolean).join(",");

      // 3. Create Property Listing
      const payload = {
        ...form,
        rent: parseFloat(form.rent),
        deposit: parseFloat(form.deposit),
        rooms: parseInt(form.rooms),
        imgUrl: finalImgUrl,
        additionalImages: additionalImagesStr,
      };

      await propertyApi.create(payload);

      toast.success("🎉 Property listed successfully! It is now active on the marketplace.");
      navigate("/owner-dashboard");
    } catch (err) {
      toast.error(err.message || "Failed to create property listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2c] pt-24 pb-16 px-4 md:px-8 flex justify-center">
      <div className="max-w-3xl w-full">
        <button
          type="button"
          onClick={() => navigate("/owner-dashboard")}
          className="text-xs font-bold text-[#002045] hover:underline mb-6 flex items-center gap-1 cursor-pointer"
        >
          ← Back to Owner Dashboard
        </button>

        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-[0px_4px_25px_rgba(26,54,93,0.08)] border border-[#c4c6cf]/40">
          <div className="mb-8">
            <span className="text-xs font-bold text-[#ad3035] uppercase tracking-wider block mb-1">
              Direct Home Owner Listing
            </span>
            <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#002045]">
              List Your Property Free
            </h1>
            <p className="text-xs text-[#43474e] mt-1">
              Zero brokerage, instant tenant inquiries, and direct bank account deposits.
            </p>
          </div>

          <form onSubmit={handleAddProperty} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                Listing Title
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Spacious Sunlit 2BHK with Balcony"
                required
                className="w-full px-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
              />
            </div>

            {/* State, District, Taluk & PIN Code Hierarchy */}
            <div className="bg-[#f0f3ff] p-4 rounded-xl border border-[#adc7f7]/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#002045] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#ad3035]">pin_drop</span>
                  Location & Administrative Hierarchy
                </span>
                {pincodeLoading && (
                  <span className="text-[11px] text-[#002045] font-semibold animate-pulse">
                    Detecting PIN Code...
                  </span>
                )}
              </div>

              {/* PIN Code Quick Auto-Fill */}
              <div>
                <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1">
                  6-Digit PIN Code (Auto-fills location)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    name="pincode"
                    value={form.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="e.g. 560038"
                    className="w-full px-4 py-2.5 bg-white border border-[#c4c6cf]/60 rounded-xl text-sm font-medium focus:outline-none focus:border-[#002045]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-[#74777f]">
                    🇮🇳 India
                  </span>
                </div>
              </div>

              {/* State & District Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1">
                    State
                  </label>
                  <select
                    name="state"
                    value={form.state}
                    onChange={(e) => {
                      const newState = e.target.value;
                      const dists = Object.keys(INDIA_LOCATIONS[newState] || {});
                      const firstDist = dists[0] || "";
                      const taluks = INDIA_LOCATIONS[newState]?.[firstDist] || [];
                      setForm((prev) => ({
                        ...prev,
                        state: newState,
                        district: firstDist,
                        taluk: taluks[0] || "",
                        city: firstDist,
                        area: taluks[0] || "",
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#c4c6cf]/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002045]"
                  >
                    {Object.keys(INDIA_LOCATIONS).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1">
                    District
                  </label>
                  <select
                    name="district"
                    value={form.district}
                    onChange={(e) => {
                      const newDist = e.target.value;
                      const taluks = INDIA_LOCATIONS[form.state]?.[newDist] || [];
                      setForm((prev) => ({
                        ...prev,
                        district: newDist,
                        taluk: taluks[0] || "",
                        city: newDist,
                        area: taluks[0] || "",
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#c4c6cf]/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002045]"
                  >
                    {Object.keys(INDIA_LOCATIONS[form.state] || {}).map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Taluk / Sub-division & Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1">
                    Taluk / Sub-district
                  </label>
                  <select
                    name="taluk"
                    value={form.taluk}
                    onChange={(e) => {
                      const newTaluk = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        taluk: newTaluk,
                        area: newTaluk.split(" (")[0] || newTaluk,
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#c4c6cf]/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002045]"
                  >
                    {(INDIA_LOCATIONS[form.state]?.[form.district] || []).map((tlk) => (
                      <option key={tlk} value={tlk}>
                        {tlk}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1">
                    Locality / Area Name
                  </label>
                  <input
                    name="area"
                    value={form.area}
                    onChange={handleChange}
                    placeholder="e.g. Indiranagar, 100ft Road"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-[#c4c6cf]/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002045]"
                  />
                </div>
              </div>
            </div>

            {/* Full Address */}
            <div>
              <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                Exact Address & Landmark
              </label>
              <textarea
                name="address"
                rows={2}
                value={form.address}
                onChange={handleChange}
                placeholder="Door No., Street, Landmark, Pincode"
                required
                className="w-full px-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
              />
            </div>

            {/* Rent & Deposit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                  Monthly Rent (₹)
                </label>
                <input
                  type="number"
                  name="rent"
                  value={form.rent}
                  onChange={handleChange}
                  placeholder="e.g. 22000"
                  required
                  className="w-full px-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  name="deposit"
                  value={form.deposit}
                  onChange={handleChange}
                  placeholder="e.g. 66000"
                  required
                  className="w-full px-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
                />
              </div>
            </div>

            {/* House Type & Rooms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                  House Type
                </label>
                <select
                  name="houseType"
                  value={form.houseType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
                >
                  <option value="1RK">1RK Studio</option>
                  <option value="1BHK">1BHK</option>
                  <option value="2BHK">2BHK</option>
                  <option value="3BHK">3BHK</option>
                  <option value="Independent House">Independent Villa</option>
                  <option value="PG">PG / Co-living</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                  Number of Bedrooms
                </label>
                <input
                  type="number"
                  name="rooms"
                  value={form.rooms}
                  onChange={handleChange}
                  min={1}
                  required
                  className="w-full px-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
                />
              </div>
            </div>

            {/* Facilities & Rules */}
            <div>
              <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                Amenities & Facilities (comma-separated)
              </label>
              <input
                name="facilities"
                value={form.facilities}
                onChange={handleChange}
                placeholder="Car Parking, 24x7 Water, Lift, Power Backup, WiFi, Geyser"
                className="w-full px-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                House Rules (comma-separated)
              </label>
              <input
                name="rules"
                value={form.rules}
                onChange={handleChange}
                placeholder="Families & working bachelors, Pets allowed, No smoking"
                className="w-full px-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
              />
            </div>

            {/* Google Maps Location */}
            <div>
              <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                Google Maps Location
              </label>
              <div className="flex gap-2">
                <input
                  name="locationLink"
                  value={form.locationLink}
                  onChange={handleChange}
                  placeholder="https://maps.google.com/..."
                  className="flex-grow px-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
                />
                <button
                  type="button"
                  onClick={handleGetLiveLocation}
                  disabled={gettingLocation}
                  className="px-4 py-3 bg-[#002045] text-white rounded-xl text-xs font-bold whitespace-nowrap hover:bg-[#1a365d] transition-colors cursor-pointer disabled:opacity-60"
                >
                  {gettingLocation ? "Locating..." : "📍 GPS Pin"}
                </button>
              </div>
            </div>

            {/* Photo Upload with Instant Previews */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="font-headline text-sm font-bold text-[#002045] uppercase tracking-wider mb-3">
                📸 Property Photographs
              </h3>

              {/* Cover Photo */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#111c2c] mb-1.5">
                  Main Cover Photo (Required)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    onChange={handleCoverChange}
                    accept="image/*"
                    required
                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#e7eeff] file:text-[#002045] hover:file:bg-[#dee8ff]"
                  />
                  {coverPreview && (
                    <img
                      src={coverPreview}
                      alt="Cover Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-[#c4c6cf]"
                    />
                  )}
                </div>
              </div>

              {/* Room Photos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#43474e] mb-1">
                    Bedroom Photo
                  </label>
                  <input
                    type="file"
                    onChange={(e) => handleExtraPhotoChange(e, "bedroom")}
                    accept="image/*"
                    className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gray-100"
                  />
                  {bedroomPreview && (
                    <img
                      src={bedroomPreview}
                      alt="Bedroom"
                      className="w-12 h-12 mt-2 rounded-lg object-cover"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#43474e] mb-1">
                    Living / Hall Photo
                  </label>
                  <input
                    type="file"
                    onChange={(e) => handleExtraPhotoChange(e, "hall")}
                    accept="image/*"
                    className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gray-100"
                  />
                  {hallPreview && (
                    <img
                      src={hallPreview}
                      alt="Hall"
                      className="w-12 h-12 mt-2 rounded-lg object-cover"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#43474e] mb-1">
                    Kitchen Photo
                  </label>
                  <input
                    type="file"
                    onChange={(e) => handleExtraPhotoChange(e, "kitchen")}
                    accept="image/*"
                    className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gray-100"
                  />
                  {kitchenPreview && (
                    <img
                      src={kitchenPreview}
                      alt="Kitchen"
                      className="w-12 h-12 mt-2 rounded-lg object-cover"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Direct Payout Account */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="font-headline text-sm font-bold text-[#002045] uppercase tracking-wider mb-1">
                💰 Direct Deposit Payout Setup
              </h3>
              <p className="text-xs text-[#74777f] mb-4">
                Tenants pay the security deposit directly to your verified account once approved.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                    UPI ID
                  </label>
                  <input
                    name="upiId"
                    value={form.upiId}
                    onChange={handleChange}
                    placeholder="e.g. name@okhdfcbank"
                    required
                    className="w-full px-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                    Account Holder Name
                  </label>
                  <input
                    name="bankAccountName"
                    value={form.bankAccountName}
                    onChange={handleChange}
                    placeholder="Legal account holder name"
                    required
                    className="w-full px-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                    Bank Account Number
                  </label>
                  <input
                    name="bankAccountNumber"
                    value={form.bankAccountNumber}
                    onChange={handleChange}
                    placeholder="e.g. 987654321012"
                    required
                    className="w-full px-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                    IFSC Code
                  </label>
                  <input
                    name="bankIfscCode"
                    value={form.bankIfscCode}
                    onChange={handleChange}
                    placeholder="e.g. HDFC0001234"
                    required
                    className="w-full px-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#ad3035] hover:bg-[#8c1620] text-white font-semibold py-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Uploading Photos & Submitting Listing...
                </span>
              ) : (
                <>
                  Publish Property Listing
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProperty;
