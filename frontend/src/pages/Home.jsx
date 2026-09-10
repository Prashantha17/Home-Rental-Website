// src/pages/Home.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { propertyApi, requestApi } from "../services/api";
import { INDIA_LOCATIONS, lookupPincode, KNOWN_PINCODES } from "../data/indiaLocations";

// Curated Showcase Residences with Stitch architectural photography
const SHOWCASE_PROPERTIES = [
  {
    id: "showcase-1",
    title: "The Glass Pavilion",
    state: "Karnataka",
    district: "Bengaluru Urban",
    taluk: "Indiranagar (Bengaluru East)",
    pincode: "560038",
    city: "Bengaluru",
    area: "Indiranagar",
    rent: 65000,
    deposit: 200000,
    rooms: 3,
    houseType: "3BHK Villa",
    rating: 4.98,
    badge: "Superhost",
    imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcxNPtU6thw18_vOPQWx8diFce7Lbr6UDC1LGD2Q4J0W0HVC9srdg2YeDtcKVNfXMoayinHcgR1ImHT0zXFPyl4c7tVKgJtVHpLN2QPR9-VY6iC3HXDEzYb2zc8EGbR9Nd6FMOpZDAg7ICqBH_PO_-wdTg1H7R_K-KsGcVin2hy2YJx7iRQTHJvkCNQ6ULd6oRlvz8bWR3fnzp4N2Zr3MwuJLzaCby74A6vxv_jRp1kw4B-MV1UcOI",
    additionalImages: [
      "https://images.pexels.com/photos/2029667/pexels-photo-2029667.jpeg?auto=compress&dpr=2&w=800",
      "https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg?auto=compress&dpr=2&w=800"
    ],
    description: "Sleek architectural villa featuring panoramic floor-to-ceiling glass walls, minimalist wooden deck, smart home automation, and 24x7 power backup.",
    facilities: ["Car Parking", "Infinity Pool", "Private Terrace", "High-speed WiFi", "Power Backup"],
    rules: ["Families & working professionals", "Pets allowed", "No loud music after 11 PM"],
    owner_name: "Priya K",
    owner_phone: "+919535178422"
  },
  {
    id: "showcase-2",
    title: "Urban Skyline Penthouse",
    state: "Maharashtra",
    district: "Mumbai Suburban",
    taluk: "Bandra West",
    pincode: "400050",
    city: "Mumbai",
    area: "Bandra West",
    rent: 95000,
    deposit: 300000,
    rooms: 3,
    houseType: "3BHK Penthouse",
    rating: 4.85,
    badge: "Superhost",
    imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHlUqlMr-m7pwgQuQXzDQJtTz8FPyQwDYiAn8_uFrpHiHdKr1rqWe2Af_2DH_mOjwnPDA8recpITUdA1rTq4_a0GY0qBqP8A8wY4jyqjPFIIMxcU8LEh7qpmkqfC-YN3_MRS51CJ1lxFMoP9ecY0ecnTYC2OvPEa0hKNFwpLQoiqcDeLD75HbNxwk2DYJFI1yG9RKnZTue7z1SXettEQi5rnK94DMC0w4P6V99ho2tIg4omFTvBJVC",
    additionalImages: [
      "https://images.pexels.com/photos/2631746/pexels-photo-2631746.jpeg?auto=compress&dpr=2&w=800"
    ],
    description: "High ceilings, Italian marble flooring, expansive terrace overlooking the Arabian Sea, furnished with bespoke modern Italian pieces.",
    facilities: ["Sea View", "Private Elevator", "Gym Access", "2 Reserved Parking", "Concierge"],
    rules: ["Vegetarian preferred", "No smoking"],
    owner_name: "Rohan V",
    owner_phone: "+919535178422"
  },
  {
    id: "showcase-3",
    title: "Serene Garden Villa",
    state: "Goa",
    district: "North Goa",
    taluk: "Assagao (Bardez)",
    pincode: "403507",
    city: "Goa",
    area: "Assagao",
    rent: 75000,
    deposit: 225000,
    rooms: 2,
    houseType: "2BHK Villa",
    rating: 5.0,
    badge: "New",
    imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6vdxVsMtu6UF6LrqyLfW018q0Fmnhb3Ypfja0WglLW3auI0vmjkYItThP7lYOZdEaJ1NF-9DLTjLNQ8Vk4dD0Ywqq2fls7SENiDchIrL_tFlZMwo4fa36lZVGrboKCMnEPmvzBjyxg2nHl_j3BrGcjGo5JmU4AnbdfDko7ht8eAiMbOv3TzYYBzAeyV-xDxR9H1IWM2XnfwmHmw7SLJjxF2JIiv1TRtmTrafRvGYOje0j9odrVjYn",
    additionalImages: [],
    description: "Portuguese-heritage inspired courtyard villa with plunge pool, lush tropical garden, natural stone verandah, and high-speed fiber internet.",
    facilities: ["Private Plunge Pool", "Tropical Garden", "Air Conditioning", "WiFi", "Daily Housekeeping"],
    rules: ["Pets allowed", "Smoking in garden only"],
    owner_name: "Anita D",
    owner_phone: "+919535178422"
  }
];

// Interactive Spatial Experience - The Oceanfront Sanctuary
const SPATIAL_ROOMS = {
  living: {
    key: "living",
    tabLabel: "Panoramic Living Area",
    title: "Panoramic Living Area",
    zone: "Zone: Main Pavilion • Level 1",
    desc: "Framed by 14-foot ocean-facing glass, this continuous open-concept living area unites custom Italian bouclé seating with natural travertine and acoustic cedar ceiling slats.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcxNPtU6thw18_vOPQWx8diFce7Lbr6UDC1LGD2Q4J0W0HVC9srdg2YeDtcKVNfXMoayinHcgR1ImHT0zXFPyl4c7tVKgJtVHpLN2QPR9-VY6iC3HXDEzYb2zc8EGbR9Nd6FMOpZDAg7ICqBH_PO_-wdTg1H7R_K-KsGcVin2hy2YJx7iRQTHJvkCNQ6ULd6oRlvz8bWR3fnzp4N2Zr3MwuJLzaCby74A6vxv_jRp1kw4B-MV1UcOI",
    hotspot: "Floor-to-Ceiling Motorized Glass Walls",
    features: [
      "Acoustic ceiling treatment with concealed audio",
      "Linear ethanol fireplace set into honed quartzite",
      "Direct walkout to heated infinity horizon pool"
    ]
  },
  kitchen: {
    key: "kitchen",
    tabLabel: "Gourmet Kitchen",
    title: "Gourmet Chef's Kitchen",
    zone: "Zone: West Wing Culinary • Level 1",
    desc: "Concealed Gaggenau 400 series appliances integrated behind rift-sawn white oak cabinetry. Features an 11-foot waterfall island with leathered marble finishes.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6vdxVsMtu6UF6LrqyLfW018q0Fmnhb3Ypfja0WglLW3auI0vmjkYItThP7lYOZdEaJ1NF-9DLTjLNQ8Vk4dD0Ywqq2fls7SENiDchIrL_tFlZMwo4fa36lZVGrboKCMnEPmvzBjyxg2nHl_j3BrGcjGo5JmU4AnbdfDko7ht8eAiMbOv3TzYYBzAeyV-xDxR9H1IWM2XnfwmHmw7SLJjxF2JIiv1TRtmTrafRvGYOje0j9odrVjYn",
    hotspot: "Gaggenau 400 Induction Suite & Leathered Marble",
    features: [
      "Dual temperature wine vault with 200 bottle capacity",
      "Sub-zero refrigeration & butler's staging pantry",
      "Hand-blown pendant illumination by artisans"
    ]
  },
  suite: {
    key: "suite",
    tabLabel: "Ocean-View Master Suite",
    title: "Ocean-View Master Suite",
    zone: "Zone: Primary Residence • Level 2",
    desc: "Private sunrise vista with automated blackout louvers. Connected to an ensuite wellness bathroom featuring a freestanding soaking tub overlooking the Pacific.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHlUqlMr-m7pwgQuQXzDQJtTz8FPyQwDYiAn8_uFrpHiHdKr1rqWe2Af_2DH_mOjwnPDA8recpITUdA1rTq4_a0GY0qBqP8A8wY4jyqjPFIIMxcU8LEh7qpmkqfC-YN3_MRS51CJ1lxFMoP9ecY0ecnTYC2OvPEa0hKNFwpLQoiqcDeLD75HbNxwk2DYJFI1yG9RKnZTue7z1SXettEQi5rnK94DMC0w4P6V99ho2tIg4omFTvBJVC",
    hotspot: "Bespoke King Bed & Ocean Sunrise Vista",
    features: [
      "King bespoke platform bed with organic Belgian linen",
      "Walk-in dressing room with boutique lighting",
      "Rain-shower with frameless sunset panoramic glazing"
    ]
  },
  deck: {
    key: "deck",
    tabLabel: "Infinity Sunset Deck",
    title: "Infinity Sunset Deck",
    zone: "Zone: Outdoor Terrace • Sea Level",
    desc: "Cantilevered over the coastline with integrated gas fire pit, teak sun loungers, and zero-edge salt mineral pool merging seamlessly into the Pacific horizon.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2WLZwBYnP1bDestfaXPBlLYJa_njHe7NP6oOaMAXlY_6PNXRv0bZLnmBVz1cEzRG0szD4JJDm90eMTcjP64ikgxwCSiwsV8d7dahqSxz_l8CXwQNlPrfwRpYhl7dZqbMjtNkZge7_-qjPf4cXQImmrZYxXCNKjwVv-zdPTmCHdsKT52f0b0d0mUlzNqmAQyjrC1BvGcWHbw8V9ej5fBD_fmm3hnen6EXA5KiTHMvtJjjxgZLYcJNo",
    hotspot: "Zero-Edge Salt Mineral Horizon Pool",
    features: [
      "Heated infinity pool with hydrotherapy jets",
      "Alfresco outdoor kitchen and Argentine grill",
      "Integrated discrete ambient marine audio"
    ]
  }
};

// Frequently Asked Questions
const FAQ_ITEMS = [
  {
    question: "How are guests vetted for luxury properties?",
    answer: "Every guest undergoes mandatory biometric ID verification, credit pre-authorization, and past luxury rental history reviews. Luxe Stay also assigns dedicated personal concierges to brief arriving guests on house regulations."
  },
  {
    question: "What does the $3,000,000 Host Damage Protection cover?",
    answer: "Our tier-one underwritten policy covers accidental structural damage, fine art, rare furniture, high-end electronics, and deep sanitization cleaning. Reimbursements are processed through a fast-track 48-hour conciliation desk."
  },
  {
    question: "What on-site concierge services are provided for guests?",
    answer: "Complimentary access to a 24/7 dedicated local concierge who coordinates private in-villa chefs, yacht charters, pre-arrival provisioning, and secure ground transit."
  },
  {
    question: "Can I block private dates when I wish to occupy my home?",
    answer: "Yes, entirely at your discretion. With our Host Portal, you have one-click calendar blackouts for personal stays, family visits, or private maintenance whenever you wish."
  }
];

// Curated Lifestyle Vibes with Top Good Places
const VIBE_PLACES = [
  {
    id: "vibe-serene",
    title: "Quiet & Serene Sanctuaries",
    icon: "spa",
    badge: "Peaceful Living",
    tagline: "Calm mornings, private lush greenery & silent residential lanes.",
    places: ["Assagao, Goa", "VV Mohalla, Mysuru", "Alibaug"],
    query: "quiet peaceful serene garden green",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6vdxVsMtu6UF6LrqyLfW018q0Fmnhb3Ypfja0WglLW3auI0vmjkYItThP7lYOZdEaJ1NF-9DLTjLNQ8Vk4dD0Ywqq2fls7SENiDchIrL_tFlZMwo4fa36lZVGrboKCMnEPmvzBjyxg2nHl_j3BrGcjGo5JmU4AnbdfDko7ht8eAiMbOv3TzYYBzAeyV-xDxR9H1IWM2XnfwmHmw7SLJjxF2JIiv1TRtmTrafRvGYOje0j9odrVjYn"
  },
  {
    id: "vibe-tech-wfh",
    title: "Tech Hubs & WFH Sanctuaries",
    icon: "laptop_mac",
    badge: "WFH & Fast Fiber",
    tagline: "Gigabit internet, ergonomic workspaces & minutes to IT corridors.",
    places: ["Indiranagar, Bengaluru", "HSR Layout, Bengaluru", "Kothrud, Pune"],
    query: "wifi high-speed internet wfh work tech",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcxNPtU6thw18_vOPQWx8diFce7Lbr6UDC1LGD2Q4J0W0HVC9srdg2YeDtcKVNfXMoayinHcgR1ImHT0zXFPyl4c7tVKgJtVHpLN2QPR9-VY6iC3HXDEzYb2zc8EGbR9Nd6FMOpZDAg7ICqBH_PO_-wdTg1H7R_K-KsGcVin2hy2YJx7iRQTHJvkCNQ6ULd6oRlvz8bWR3fnzp4N2Zr3MwuJLzaCby74A6vxv_jRp1kw4B-MV1UcOI"
  },
  {
    id: "vibe-coastal",
    title: "Coastal & Sea Breeze Living",
    icon: "water",
    badge: "Sea View & Sunset",
    tagline: "Panoramic ocean horizons, sea-breeze balconies & evening sunset walks.",
    places: ["Bandra West, Mumbai", "North Goa Coast", "ECR, Chennai"],
    query: "sea view ocean balcony sunset water terrace",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2WLZwBYnP1bDestfaXPBlLYJa_njHe7NP6oOaMAXlY_6PNXRv0bZLnmBVz1cEzRG0szD4JJDm90eMTcjP64ikgxwCSiwsV8d7dahqSxz_l8CXwQNlPrfwRpYhl7dZqbMjtNkZge7_-qjPf4cXQImmrZYxXCNKjwVv-zdPTmCHdsKT52f0b0d0mUlzNqmAQyjrC1BvGcWHbw8V9ej5fBD_fmm3hnen6EXA5KiTHMvtJjjxgZLYcJNo"
  },
  {
    id: "vibe-pets",
    title: "Pet-Friendly Green Retreats",
    icon: "pets",
    badge: "Pet Friendly",
    tagline: "Open lawns, private compound walls & nearby dog-friendly parks.",
    places: ["Whitefield, Bengaluru", "Assagao, Goa", "Kalyani Nagar, Pune"],
    query: "pets allowed dog cat garden park yard",
    image: "https://images.pexels.com/photos/2253275/pexels-photo-2253275.jpeg?auto=compress&dpr=2&w=800"
  },
  {
    id: "vibe-sunlit",
    title: "Sunlit Lofts & Penthouses",
    icon: "wb_sunny",
    badge: "Natural Light",
    tagline: "14-foot glass facades, golden-hour light & expansive open layouts.",
    places: ["Bandra West, Mumbai", "Connaught Place, Delhi", "Indiranagar"],
    query: "bright sunlight natural light windows penthouse airy",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHlUqlMr-m7pwgQuQXzDQJtTz8FPyQwDYiAn8_uFrpHiHdKr1rqWe2Af_2DH_mOjwnPDA8recpITUdA1rTq4_a0GY0qBqP8A8wY4jyqjPFIIMxcU8LEh7qpmkqfC-YN3_MRS51CJ1lxFMoP9ecY0ecnTYC2OvPEa0hKNFwpLQoiqcDeLD75HbNxwk2DYJFI1yG9RKnZTue7z1SXettEQi5rnK94DMC0w4P6V99ho2tIg4omFTvBJVC"
  },
  {
    id: "vibe-luxury-pool",
    title: "Private Pool & Luxury Villas",
    icon: "pool",
    badge: "Private Pool",
    tagline: "Zero-edge plunge pools, barbecue decks & secluded architectural luxury.",
    places: ["Assagao, Goa", "Alibaug Coast", "Lonavala"],
    query: "pool villa luxury private pool plunge jacuzzi",
    image: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&dpr=2&w=800"
  }
];

// Infer state/district/pincode from city or area if missing
const inferLocation = (p) => {
  const city = (p.city || "").toLowerCase();
  const area = (p.area || "").toLowerCase();

  if (p.state && p.district) {
    return {
      state: p.state,
      district: p.district,
      taluk: p.taluk || p.area || "",
      pincode: p.pincode || ""
    };
  }

  if (city.includes("bengaluru") || city.includes("bangalore") || area.includes("btm") || area.includes("indiranagar")) {
    const isBtm = area.includes("btm");
    return {
      state: "Karnataka",
      district: "Bengaluru Urban",
      taluk: isBtm ? "BTM Layout (Bengaluru South)" : "Indiranagar (Bengaluru East)",
      pincode: isBtm ? "560068" : "560038"
    };
  }
  if (city.includes("mysuru") || city.includes("mysore") || area.includes("vv mohalla")) {
    return {
      state: "Karnataka",
      district: "Mysuru",
      taluk: "VV Mohalla (Mysuru City)",
      pincode: "570002"
    };
  }
  if (city.includes("mumbai") || area.includes("bandra")) {
    return {
      state: "Maharashtra",
      district: "Mumbai Suburban",
      taluk: "Bandra West",
      pincode: "400050"
    };
  }
  if (city.includes("pune")) {
    return {
      state: "Maharashtra",
      district: "Pune",
      taluk: "Kothrud",
      pincode: "411038"
    };
  }
  if (city.includes("goa") || area.includes("assagao")) {
    return {
      state: "Goa",
      district: "North Goa",
      taluk: "Assagao (Bardez)",
      pincode: "403507"
    };
  }
  if (city.includes("chennai")) {
    return {
      state: "Tamil Nadu",
      district: "Chennai",
      taluk: "Adyar",
      pincode: "600020"
    };
  }
  if (city.includes("delhi")) {
    return {
      state: "Delhi NCR",
      district: "New Delhi",
      taluk: "Connaught Place",
      pincode: "110001"
    };
  }

  return {
    state: p.state || "Karnataka",
    district: p.district || p.city || "Bengaluru Urban",
    taluk: p.taluk || p.area || "",
    pincode: p.pincode || ""
  };
};

// Normalize property shape for 100% UI consistency
const normalizeProperty = (p) => {
  const facilities = Array.isArray(p.facilities)
    ? p.facilities
    : typeof p.facilities === "string" && p.facilities.length > 0
    ? p.facilities.split(",").map((f) => f.trim())
    : [];

  const rules = Array.isArray(p.rules)
    ? p.rules
    : typeof p.rules === "string" && p.rules.length > 0
    ? p.rules.split(",").map((r) => r.trim())
    : [];

  const rawAddImages = Array.isArray(p.additionalImages)
    ? p.additionalImages
    : typeof p.additionalImages === "string" && p.additionalImages.length > 0
    ? p.additionalImages.split(",").map((i) => i.trim())
    : p.images || [];

  const rentVal = Number(p.rent || p.rent_amount || 0);
  const inferred = inferLocation(p);

  return {
    id: String(p.id || p._id || `prop-${Math.random()}`),
    title: p.title || "Modern Residential Property",
    state: p.state || inferred.state,
    district: p.district || inferred.district,
    taluk: p.taluk || inferred.taluk,
    pincode: p.pincode || inferred.pincode,
    city: p.city || inferred.district || "Bengaluru",
    area: p.area || inferred.taluk || "",
    address: p.address || "",
    rent: rentVal,
    deposit: Number(p.deposit || rentVal * 3.5 || 50000),
    rooms: Number(p.rooms || 2),
    houseType: p.houseType || "2BHK",
    rating: Number(p.rating || (4.7 + (rentVal % 4) * 0.08).toFixed(2)),
    badge: p.badge || (rentVal > 50000 ? "Premium" : "Zero Brokerage"),
    imgUrl:
      p.imgUrl ||
      "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&dpr=2&w=800",
    additionalImages: rawAddImages,
    description:
      p.description ||
      `Spacious, sunlit ${p.houseType || "apartment"} with modern amenities and convenient metro connectivity.`,
    facilities:
      facilities.length > 0
        ? facilities
        : ["Car Parking", "24x7 Water Supply", "Elevator", "Power Backup"],
    rules: rules.length > 0 ? rules : ["Families & working professionals welcome"],
    owner_name: p.owner_name || "Verified Landlord",
    owner_phone: p.owner_phone || "+919535178422",
    upiId: p.upiId || "",
    matchScore: p.matchScore || null,
    matchReason: p.matchReason || null,
  };
};

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedHouseType, setSelectedHouseType] = useState("ALL");
  const [vibeQuery, setVibeQuery] = useState("");
  const [isVibeSearching, setIsVibeSearching] = useState(false);
  const [favorites, setFavorites] = useState({});

  // Location Hierarchy & PIN code states
  const [searchMode, setSearchMode] = useState("pincode"); // "pincode" | "hierarchy" | "keyword"
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTaluk, setSelectedTaluk] = useState("");
  const [searchPincode, setSearchPincode] = useState("");
  const [pincodeAutoInfo, setPincodeAutoInfo] = useState(null);
  const [pincodeResolving, setPincodeResolving] = useState(false);

  // Modal State
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [activeModalImage, setActiveModalImage] = useState(0);

  // Negotiation / Request State
  const [negotiationProperty, setNegotiationProperty] = useState(null);
  const [offeredRent, setOfferedRent] = useState("");
  const [negotiationMessage, setNegotiationMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  // Featured Spatial Walkthrough & FAQ State
  const [activeRoomKey, setActiveRoomKey] = useState("living");
  const [isImageFading, setIsImageFading] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [isFullTourModalOpen, setIsFullTourModalOpen] = useState(false);
  const [isVibeDrawerOpen, setIsVibeDrawerOpen] = useState(false);
  const vibeInputRef = useRef(null);

  const handleSwitchRoom = (key) => {
    if (key === activeRoomKey) return;
    setIsImageFading(true);
    setTimeout(() => {
      setActiveRoomKey(key);
      setIsImageFading(false);
    }, 180);
  };

  const toggleFaqItem = (idx) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  const listingsSectionRef = useRef(null);

  // Handle PIN code input and auto lookup
  const handlePincodeSearchChange = async (val) => {
    const cleanVal = val.trim();
    setSearchPincode(cleanVal);
    if (cleanVal.length === 6 && /^\d{6}$/.test(cleanVal)) {
      setPincodeResolving(true);
      try {
        const res = await lookupPincode(cleanVal);
        if (res) {
          setPincodeAutoInfo(res);
          toast.success(`📍 Found: ${res.taluk || res.city}, ${res.state}`);
        } else {
          setPincodeAutoInfo(null);
        }
      } catch (e) {
        setPincodeAutoInfo(null);
      } finally {
        setPincodeResolving(false);
      }
    } else {
      setPincodeAutoInfo(null);
    }
  };

  const handleResetLocationFilters = () => {
    setSelectedState("");
    setSelectedDistrict("");
    setSelectedTaluk("");
    setSearchPincode("");
    setPincodeAutoInfo(null);
    setSearchLocation("");
    setSelectedHouseType("ALL");
    setVibeQuery("");
    loadProperties();
  };

  // Load properties from backend
  const loadProperties = useCallback(async () => {
    setLoading(true);
    try {
      const data = await propertyApi.getAll();
      if (Array.isArray(data) && data.length > 0) {
        setProperties(data.map(normalizeProperty));
      } else {
        setProperties(SHOWCASE_PROPERTIES.map(normalizeProperty));
      }
    } catch (err) {
      console.warn("Backend load notice, displaying curated properties:", err);
      setProperties(SHOWCASE_PROPERTIES.map(normalizeProperty));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Keyboard escape for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedProperty(null);
        setNegotiationProperty(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProperty]);

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const nextState = !prev[id];
      if (nextState) {
        toast.success("Saved to favorites!");
      } else {
        toast.info("Removed from favorites");
      }
      return { ...prev, [id]: nextState };
    });
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchMode === "vibe") {
      handleVibeSearch();
      return;
    }
    if (listingsSectionRef.current) {
      listingsSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleVibeSearch = async (queryOverride) => {
    const q = (typeof queryOverride === "string" ? queryOverride : vibeQuery).trim();
    if (!q) {
      toast.warning("Please describe your desired living vibe or choose a quick option!");
      return;
    }

    setVibeQuery(q);
    setSearchMode("vibe");
    setSelectedState("");
    setSelectedDistrict("");
    setSelectedTaluk("");
    setSearchPincode("");
    setPincodeAutoInfo(null);
    setSearchLocation("");

    setIsVibeSearching(true);
    try {
      const results = await propertyApi.vibeSearch(q);
      if (Array.isArray(results) && results.length > 0) {
        setProperties(results.map(normalizeProperty));
        toast.success(`✨ Found ${results.length} homes matched to your vibe: "${q}"!`);
        if (listingsSectionRef.current) {
          listingsSectionRef.current.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        toast.info("No properties closely matched your vibe keywords. Showing all.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Vibe search encountered an error.");
    } finally {
      setIsVibeSearching(false);
    }
  };

  const handleInitiateBooking = (property) => {
    if (!isAuthenticated) {
      toast.warning("Please sign in to send a rental request");
      navigate("/login");
      return;
    }
    setNegotiationProperty(property);
    setOfferedRent(property.rent || "");
    setNegotiationMessage("");
    setSelectedProperty(null);
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!negotiationProperty) return;

    const offerAmount = parseFloat(offeredRent);
    if (!offerAmount || offerAmount <= 0) {
      toast.error("Please enter a valid monthly rent offer amount.");
      return;
    }

    setBookingLoading(true);
    try {
      await requestApi.create(negotiationProperty.id, offerAmount, negotiationMessage);
      if (offerAmount !== negotiationProperty.rent) {
        toast.success(`🎉 Negotiated offer of ₹${offerAmount.toLocaleString()}/mo sent to owner!`);
      } else {
        toast.success("🎉 Rental request submitted to the property owner!");
      }
      setNegotiationProperty(null);
    } catch (err) {
      toast.error(err.message || "Failed to submit rental request");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleOpenChat = (ownerName) => {
    window.dispatchEvent(
      new CustomEvent("open-chat", {
        detail: { owner: ownerName },
      })
    );
  };

  // Filter properties based on hierarchy, pincode, keyword, or house type
  const filteredProperties = properties.filter((p) => {
    // 1. Hierarchy Filtering
    if (selectedState) {
      const matchState = (p.state || "").toLowerCase().includes(selectedState.toLowerCase());
      if (!matchState) return false;
    }

    if (selectedDistrict) {
      const pDist = (p.district || "").toLowerCase();
      const pCity = (p.city || "").toLowerCase();
      const selDist = selectedDistrict.toLowerCase();
      const matchDist = pDist.includes(selDist) || pCity.includes(selDist) || selDist.includes(pCity);
      if (!matchDist) return false;
    }

    if (selectedTaluk) {
      const pTaluk = (p.taluk || "").toLowerCase();
      const pArea = (p.area || "").toLowerCase();
      const selTaluk = selectedTaluk.toLowerCase();
      const talukNameOnly = selTaluk.split(" (")[0];
      const matchTaluk =
        pTaluk.includes(talukNameOnly) ||
        pArea.includes(talukNameOnly) ||
        talukNameOnly.includes(pArea);
      if (!matchTaluk) return false;
    }

    // 2. PIN Code Filtering
    if (searchPincode) {
      const pin = searchPincode.trim();
      const matchesPin = (p.pincode || "").includes(pin);
      const matchesAutoResolved = pincodeAutoInfo && (
        (p.district || "").toLowerCase().includes((pincodeAutoInfo.district || "").toLowerCase()) ||
        (p.city || "").toLowerCase().includes((pincodeAutoInfo.city || "").toLowerCase()) ||
        (p.state || "").toLowerCase().includes((pincodeAutoInfo.state || "").toLowerCase())
      );
      if (!matchesPin && !matchesAutoResolved) return false;
    }

    // 3. Keyword/Location Input Filtering
    if (searchLocation.trim()) {
      const loc = searchLocation.toLowerCase().trim();
      const matchesLoc =
        (p.city || "").toLowerCase().includes(loc) ||
        (p.area || "").toLowerCase().includes(loc) ||
        (p.district || "").toLowerCase().includes(loc) ||
        (p.state || "").toLowerCase().includes(loc) ||
        (p.taluk || "").toLowerCase().includes(loc) ||
        (p.title || "").toLowerCase().includes(loc) ||
        (p.pincode || "").includes(loc);
      if (!matchesLoc) return false;
    }

    // 4. House Type Filtering
    const matchesType =
      selectedHouseType === "ALL" ||
      p.houseType.toUpperCase().includes(selectedHouseType.toUpperCase());

    return matchesType;
  });

  return (
    <div className="bg-[#f9f9ff] text-[#111c2c] font-sans min-h-screen flex flex-col pt-20">
      {/* ─── STITCH HERO SECTION (Full-Bleed Luxury Background) ─── */}
      <section className="relative w-full h-[780px] min-h-[640px] flex items-center justify-center">
        {/* Background Image from Stitch Coastal Modernist Screen */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuB2WLZwBYnP1bDestfaXPBlLYJa_njHe7NP6oOaMAXlY_6PNXRv0bZLnmBVz1cEzRG0szD4JJDm90eMTcjP64ikgxwCSiwsV8d7dahqSxz_l8CXwQNlPrfwRpYhl7dZqbMjtNkZge7_-qjPf4cXQImmrZYxXCNKjwVv-zdPTmCHdsKT52f0b0d0mUlzNqmAQyjrC1BvGcWHbw8V9ej5fBD_fmm3hnen6EXA5KiTHMvtJjjxgZLYcJNo')`
          }}
        ></div>
        {/* Soft overlay to ensure readability */}
        <div className="absolute inset-0 bg-[#111c2c]/30"></div>

        {/* Stitch Floating Search Container (Glassmorphic Semi-Transparent) */}
        <div className="relative z-10 w-full max-w-4xl mx-4 md:mx-auto bg-white/75 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-[0px_20px_50px_rgba(0,32,69,0.22)] p-6 md:p-10 flex flex-col items-center border border-white/60 transition-all">
          <div className="inline-block bg-[#e7eeff]/90 backdrop-blur-sm text-[#002045] text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider mb-2 border border-[#adc7f7]/70 shadow-xs">
            🇮🇳 India's 100% Zero-Brokerage Network
          </div>
          <h1 className="font-headline text-3xl md:text-5xl font-extrabold text-[#002045] text-center mb-2 tracking-tight flex items-center justify-center gap-2">
            Namma Mane <span>🏠</span>
          </h1>
          <p className="text-sm md:text-base text-[#43474e] font-medium text-center mb-6 max-w-lg">
            Find your home which matches your vibe
          </p>

          {/* Search Mode Tabs */}
          <div className="flex bg-white/60 backdrop-blur-md p-1 rounded-xl border border-white/70 shadow-xs text-xs font-bold mb-4 w-full max-w-lg">
            <button
              type="button"
              onClick={() => setSearchMode("pincode")}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                searchMode === "pincode"
                  ? "bg-[#002045] text-white shadow-sm"
                  : "text-[#43474e] hover:text-[#002045]"
              }`}
            >
              <span className="material-symbols-outlined text-sm">pin_drop</span>
              By PIN Code
            </button>
            <button
              type="button"
              onClick={() => setSearchMode("hierarchy")}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                searchMode === "hierarchy"
                  ? "bg-[#002045] text-white shadow-sm"
                  : "text-[#43474e] hover:text-[#002045]"
              }`}
            >
              <span className="material-symbols-outlined text-sm">apartment</span>
              State & District
            </button>
            <button
              type="button"
              onClick={() => setSearchMode("keyword")}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                searchMode === "keyword"
                  ? "bg-[#002045] text-white shadow-sm"
                  : "text-[#43474e] hover:text-[#002045]"
              }`}
            >
              <span className="material-symbols-outlined text-sm">search</span>
              Keyword Search
            </button>
          </div>

          {/* Search Bar Pill Form (Clean Location Search, Semi-Transparent Glass) */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full bg-white/70 backdrop-blur-md rounded-2xl md:rounded-full border border-white/80 p-2 shadow-[0_8px_30px_rgba(0,32,69,0.08)] focus-within:border-[#002045] focus-within:ring-2 focus-within:ring-[#002045]/15 transition-all duration-300 flex flex-col md:flex-row items-center"
          >
            {/* Field 1: Dynamic Location Input based on active Mode */}
            {searchMode === "pincode" && (
              <div className="flex-1 w-full flex flex-col px-6 py-2 border-b md:border-b-0 md:border-r border-[#c4c6cf]/50 hover:bg-[#e7eeff]/30 rounded-t-xl md:rounded-l-full md:rounded-tr-none transition-colors">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-[#43474e] uppercase tracking-wider">
                    PIN Code
                  </label>
                  {pincodeResolving && (
                    <span className="text-[10px] text-[#002045] font-semibold animate-pulse">
                      Resolving...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="material-symbols-outlined text-sm text-[#ad3035]">pin_drop</span>
                  <input
                    type="text"
                    maxLength={6}
                    value={searchPincode}
                    onChange={(e) => handlePincodeSearchChange(e.target.value)}
                    placeholder="Enter 6-digit PIN (e.g. 560038)"
                    className="bg-transparent border-none p-0 focus:outline-none text-[#111c2c] placeholder:text-[#74777f]/70 text-sm font-semibold tracking-wider w-full"
                  />
                  {searchPincode && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchPincode("");
                        setPincodeAutoInfo(null);
                      }}
                      className="text-gray-400 hover:text-gray-700 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {pincodeAutoInfo && (
                  <span className="text-[10px] text-[#002045] font-semibold mt-0.5 truncate">
                    📍 {pincodeAutoInfo.taluk || pincodeAutoInfo.district}, {pincodeAutoInfo.state}
                  </span>
                )}
              </div>
            )}

            {searchMode === "hierarchy" && (
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-1 px-4 py-1.5 border-b md:border-b-0 md:border-r border-[#c4c6cf]/50 rounded-t-xl md:rounded-l-full md:rounded-tr-none">
                <div>
                  <label className="text-[9px] font-bold text-[#43474e] uppercase tracking-wider block">
                    State
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setSelectedDistrict("");
                      setSelectedTaluk("");
                    }}
                    className="bg-transparent border-none p-0 focus:outline-none text-xs font-semibold text-[#111c2c] w-full"
                  >
                    <option value="">Select State</option>
                    {Object.keys(INDIA_LOCATIONS).map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-[#43474e] uppercase tracking-wider block">
                    District
                  </label>
                  <select
                    value={selectedDistrict}
                    disabled={!selectedState}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      setSelectedTaluk("");
                    }}
                    className="bg-transparent border-none p-0 focus:outline-none text-xs font-semibold text-[#111c2c] w-full disabled:opacity-50"
                  >
                    <option value="">All Districts</option>
                    {selectedState &&
                      Object.keys(INDIA_LOCATIONS[selectedState] || {}).map((dist) => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-[#43474e] uppercase tracking-wider block">
                    Taluk
                  </label>
                  <select
                    value={selectedTaluk}
                    disabled={!selectedDistrict}
                    onChange={(e) => setSelectedTaluk(e.target.value)}
                    className="bg-transparent border-none p-0 focus:outline-none text-xs font-semibold text-[#111c2c] w-full disabled:opacity-50"
                  >
                    <option value="">All Taluks</option>
                    {selectedState &&
                      selectedDistrict &&
                      (INDIA_LOCATIONS[selectedState]?.[selectedDistrict] || []).map((tlk) => (
                        <option key={tlk} value={tlk}>{tlk}</option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {searchMode === "keyword" && (
              <div className="flex-1 w-full flex flex-col px-6 py-2 border-b md:border-b-0 md:border-r border-[#c4c6cf]/50 hover:bg-[#e7eeff]/30 rounded-t-xl md:rounded-l-full md:rounded-tr-none transition-colors">
                <label className="text-[10px] font-bold text-[#43474e] uppercase tracking-wider">
                  Where
                </label>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="material-symbols-outlined text-sm text-[#74777f]">location_on</span>
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder="Search city, area, or society (e.g. Indiranagar)"
                    className="bg-transparent border-none p-0 focus:outline-none text-[#111c2c] placeholder:text-[#74777f]/70 text-sm font-medium w-full"
                  />
                  {searchLocation && (
                    <button
                      type="button"
                      onClick={() => setSearchLocation("")}
                      className="text-gray-400 hover:text-gray-700 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Field 2: House Type */}
            <div className="w-full md:w-44 flex flex-col px-6 py-2 border-b md:border-b-0 md:border-r border-[#c4c6cf]/50 hover:bg-[#e7eeff]/30 transition-colors">
              <label className="text-[10px] font-bold text-[#43474e] uppercase tracking-wider">
                House Type
              </label>
              <select
                value={selectedHouseType}
                onChange={(e) => setSelectedHouseType(e.target.value)}
                className="bg-transparent border-none p-0 focus:outline-none text-xs font-semibold text-[#111c2c] w-full mt-0.5"
              >
                <option value="ALL">All Types</option>
                <option value="1RK">1RK Studio</option>
                <option value="1BHK">1BHK</option>
                <option value="2BHK">2BHK</option>
                <option value="3BHK">3BHK</option>
                <option value="VILLA">Villa / House</option>
              </select>
            </div>

            {/* Field 3: Tenancy & Search Trigger Button */}
            <div className="w-full md:w-56 flex items-center justify-between px-6 py-2 hover:bg-[#e7eeff]/30 rounded-b-xl md:rounded-r-full md:rounded-bl-none transition-colors">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#43474e] uppercase tracking-wider">
                  Tenancy
                </label>
                <select className="bg-transparent border-none p-0 focus:outline-none text-xs font-semibold text-[#111c2c] w-full mt-0.5">
                  <option>Any Tenant</option>
                  <option>Families</option>
                  <option>Bachelors</option>
                  <option>Pets Welcome</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-[#fe6c6b] hover:bg-[#ad3035] text-white rounded-full w-12 h-12 flex items-center justify-center transition-all ml-3 flex-shrink-0 shadow-md hover:scale-105 cursor-pointer"
                aria-label="Search"
              >
                <span className="material-symbols-outlined text-white text-xl">search</span>
              </button>
            </div>
          </form>

          {/* ─── SEPARATE DEDICATED VIBE SEARCH SECTION (Down side, Semi-Transparent Glass) ─── */}
          <div className="w-full mt-6 pt-5 border-t border-white/40" id="vibeSearchDownside">
            <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/80 p-4 md:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ad3035] to-[#fe6c6b] text-white flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-extrabold text-[#002045]">
                        AI Lifestyle & Vibe Search
                      </h3>
                      <span className="bg-gradient-to-r from-[#ad3035] to-[#fe6c6b] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Natural Language
                      </span>
                    </div>
                    <p className="text-[11px] text-[#43474e] mt-0.5">
                      Search by living atmosphere, lighting, sea breeze, or specific lifestyle
                    </p>
                  </div>
                </div>
                {vibeQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setVibeQuery("");
                      loadProperties();
                    }}
                    className="text-xs font-semibold text-[#ad3035] hover:underline cursor-pointer"
                  >
                    Clear Vibe Filter
                  </button>
                )}
              </div>

              {/* Dedicated Vibe Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVibeSearch();
                }}
                className="flex flex-col sm:flex-row gap-2.5"
              >
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#fe6c6b]">
                    auto_awesome
                  </span>
                  <input
                    ref={vibeInputRef}
                    type="text"
                    value={vibeQuery}
                    onChange={(e) => setVibeQuery(e.target.value)}
                    placeholder="e.g. Quiet sunlit penthouse with ocean breeze, fast wifi & pet-friendly..."
                    className="w-full pl-10 pr-9 py-2.5 bg-white/80 backdrop-blur-sm border border-white/90 rounded-xl text-xs sm:text-sm font-medium text-[#111c2c] placeholder:text-[#74777f]/70 focus:outline-none focus:border-[#fe6c6b] focus:bg-white focus:ring-2 focus:ring-[#fe6c6b]/15 transition-all shadow-inner"
                  />
                  {vibeQuery && (
                    <button
                      type="button"
                      onClick={() => setVibeQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isVibeSearching}
                  className="bg-gradient-to-r from-[#ad3035] to-[#002045] hover:opacity-95 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  <span>{isVibeSearching ? "Matching..." : "Search by Vibe"}</span>
                </button>
              </form>

              {/* Quick Vibes chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-white/50">
                <span className="text-[11px] font-bold text-[#74777f]">Quick Vibes:</span>
                {[
                  { label: "🌿 Quiet & Serene", query: "quiet peaceful serene garden" },
                  { label: "💼 WFH & Fast WiFi", query: "wifi high-speed internet wfh work tech" },
                  { label: "🌊 Sea Breeze & Balcony", query: "sea view ocean balcony terrace" },
                  { label: "🐾 Pet Friendly", query: "pets allowed dog garden" },
                  { label: "☀️ Bright & Sunlit", query: "bright sunlight natural light airy" },
                  { label: "🏊 Villa with Pool", query: "pool villa luxury private pool" },
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleVibeSearch(chip.query)}
                    className="text-[11px] font-medium bg-white/75 backdrop-blur-sm hover:bg-[#002045] hover:text-white text-[#002045] px-2.5 py-1 rounded-lg border border-white/80 shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STITCH SECTION 1: DISCOVER POPULAR DESTINATIONS ─── */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-12 py-20 w-full">
        <h2 className="font-headline text-2xl md:text-3xl font-bold text-[#002045] mb-8">
          Discover Popular Destinations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Malibu / Bengaluru */}
          <div
            onClick={() => {
              setSelectedState("Karnataka");
              setSelectedDistrict("Bengaluru Urban");
              setSelectedTaluk("");
              setSearchPincode("");
              handleSearchSubmit();
            }}
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] block shadow-[0px_4px_20px_rgba(26,54,93,0.05)] hover:shadow-[0px_10px_30px_rgba(26,54,93,0.12)] transition-all duration-300 cursor-pointer border border-[#c4c6cf]/30"
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEQ-lzH_ZCZUMe7JgwGtPuFBtvZzuQlj8WU8lz4-TCSnp11PNutu0MnYP_Ga7V5665ZZF67AJtptlk9H1n2WCi-I5ebGiWRzWWZbOIv1KsxQFfPTQJUxh7r-dTXEuZwKq8NXka_MPPkHF1cahP7cNVYrI38nlQpdAOfzw5_TgECcb8Bf7lkmNrOH7tV5_FmxWPfQ1n1ToGpgPG_qTUA9NrJ1whOfgzvKvAB2V7CEyJqxwrC-CF92ah"
              alt="Bengaluru"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <h3 className="font-headline text-2xl font-bold">Bengaluru</h3>
              <p className="text-xs text-gray-200 mt-1">Karnataka &bull; Indiranagar, BTM</p>
            </div>
          </div>

          {/* Card 2: Lake Tahoe / Mumbai */}
          <div
            onClick={() => {
              setSelectedState("Maharashtra");
              setSelectedDistrict("Mumbai Suburban");
              setSelectedTaluk("");
              setSearchPincode("");
              handleSearchSubmit();
            }}
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] block shadow-[0px_4px_20px_rgba(26,54,93,0.05)] hover:shadow-[0px_10px_30px_rgba(26,54,93,0.12)] transition-all duration-300 cursor-pointer border border-[#c4c6cf]/30"
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA340FcFKnWj_pmzX2gdMETT-StZ1OIlBhPk5MuASKzDekc71dplr74Cuq1IuIAzRSltjpEa2mLxVFt_Wwli3WxnSvZBXLqCPIDGqeqU840JlG0sa2A0FHAHxOE7jbwg5U-NpTI6T66iiJ5cFIwxouwQb5CyRx_30vwtLqsecgsWO1hDqMshzzRul8rwJK80c4rVkCsXisQUHXXTxksJCBPlTkk2mmCm0lJthArZ7chdYG7tStmmhb7"
              alt="Mumbai"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <h3 className="font-headline text-2xl font-bold">Mumbai</h3>
              <p className="text-xs text-gray-200 mt-1">Maharashtra &bull; Bandra, Juhu</p>
            </div>
          </div>

          {/* Card 3: Charleston / Goa */}
          <div
            onClick={() => {
              setSelectedState("Goa");
              setSelectedDistrict("North Goa");
              setSelectedTaluk("");
              setSearchPincode("");
              handleSearchSubmit();
            }}
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] block shadow-[0px_4px_20px_rgba(26,54,93,0.05)] hover:shadow-[0px_10px_30px_rgba(26,54,93,0.12)] transition-all duration-300 cursor-pointer border border-[#c4c6cf]/30"
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJBM1FVtvzvfRFjXjd3qqEiktK1IxtxtljWOfWxdUoP42Yr_yE-KTr6rN9TLEzPnVFhJu2QJusiOrrVW9U5qoxnNlot6V7tSWRmCzJJAdRpiw-VroWcsddRi4jywUuB5beiOF-xpMxQi10PlMWU85bcjjHWmqJwBbi7OQiKDIS4Prz-cF2bXyjv1B6QuknPFtn3fA6yGUo0IQp1QCyYo3kHa5T4Rwm1Ck7rDGviQxbTfeAzDiSEQzF"
              alt="Goa"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <h3 className="font-headline text-2xl font-bold">Goa Stays</h3>
              <p className="text-xs text-gray-200 mt-1">Assagao, Anjuna, Calangute</p>
            </div>
          </div>

          {/* Card 4: Aspen / Mysuru & Pune */}
          <div
            onClick={() => {
              setSelectedState("Karnataka");
              setSelectedDistrict("Mysuru");
              setSelectedTaluk("");
              setSearchPincode("");
              handleSearchSubmit();
            }}
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] block shadow-[0px_4px_20px_rgba(26,54,93,0.05)] hover:shadow-[0px_10px_30px_rgba(26,54,93,0.12)] transition-all duration-300 cursor-pointer border border-[#c4c6cf]/30"
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_TmDazfsQpD3UZ2UOdPpuolPc4NsZaC433MYT0O91kYBxRSnBlitN6Bo0xMAxN2Aj8OAJ5aCnCS4_TNI7zUwg8u7m8NMmnLZr7VZUDg9pLdWfmGk2VhL6jzraYQbXG86PvILshfgff4C8Odoxo3HfEZMxrJSYo1UoNrLIrcHV90mXJ8MZgZ1V1ozS790jbiap14jIGfha29sUWjJw1fwp91P9yn-0hmlCVgxqk5Jvut0dwqMWTvfV"
              alt="Mysuru"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <h3 className="font-headline text-2xl font-bold">Mysuru & Pune</h3>
              <p className="text-xs text-gray-200 mt-1">Heritage & Tech Corridors</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VIBE SEARCH: FIND GOOD PLACES BY LIFESTYLE ─── */}
      <section className="py-20 px-6 md:px-12 bg-gradient-to-b from-[#f9f9ff] to-[#f0f3ff] border-t border-[#c4c6cf]/20">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold text-[#ad3035] uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#fe6c6b] animate-ping"></span>
                AI Vibe Matcher & Curated Havens
              </span>
              <h2 className="font-headline text-2xl md:text-4xl font-extrabold text-[#002045]">
                Find Good Places by Your Lifestyle Vibe
              </h2>
              <p className="text-[#43474e] text-sm mt-1.5 max-w-2xl">
                Choose the living atmosphere that inspires you—from quiet garden villas to coastal sea-breeze balconies and high-speed remote work pads.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#002045] bg-white px-4 py-2 rounded-full shadow-sm border border-[#adc7f7]">
                ✨ 6 Curated Vibe Havens
              </span>
            </div>
          </div>

          {/* Grid of Vibe Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {VIBE_PLACES.map((vibe) => (
              <div
                key={vibe.id}
                onClick={() => handleVibeSearch(vibe.query)}
                className="bg-white rounded-2xl overflow-hidden shadow-[0px_4px_20px_rgba(26,54,93,0.06)] hover:shadow-[0px_12px_35px_rgba(26,54,93,0.15)] transition-all duration-300 border border-[#c4c6cf]/40 flex flex-col group cursor-pointer hover:-translate-y-1"
              >
                {/* Card Image Banner */}
                <div className="relative h-52 overflow-hidden bg-gray-900">
                  <img
                    src={vibe.image}
                    alt={vibe.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
                  {/* Top Vibe Badge */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="material-symbols-outlined text-sm text-[#fe6c6b]">{vibe.icon}</span>
                    <span className="text-xs font-bold text-[#002045]">{vibe.badge}</span>
                  </div>
                  {/* Bottom Title on Image */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-headline text-lg font-bold text-white drop-shadow-sm">
                      {vibe.title}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-col flex-grow justify-between bg-white">
                  <div>
                    <p className="text-xs text-[#43474e] leading-relaxed mb-3.5">
                      {vibe.tagline}
                    </p>

                    {/* Good Places Pill tags */}
                    <div className="mb-4">
                      <span className="text-[10px] uppercase font-bold text-[#74777f] tracking-wider block mb-1.5">
                        📍 Recommended Good Places:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {vibe.places.map((place, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-semibold bg-[#e7eeff] text-[#002045] px-2.5 py-0.5 rounded-md border border-[#adc7f7]/50"
                          >
                            {place}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Trigger */}
                  <div className="pt-3 border-t border-[#c4c6cf]/30 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ad3035] group-hover:text-[#8c1620] flex items-center gap-1">
                      Match Homes for this Vibe
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </span>
                    <span className="text-[11px] text-[#74777f] bg-gray-50 px-2 py-0.5 rounded">
                      Instant Search
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STITCH SECTION 2: CURATED FOR YOU ─── */}
      <section className="bg-[#f0f3ff] py-20">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
          <div className="flex justify-between items-end mb-8">
            <div>
              <div className="text-xs font-bold text-[#ad3035] uppercase tracking-wider mb-1">
                Handpicked Stays
              </div>
              <h2 className="font-headline text-2xl md:text-3xl font-bold text-[#002045]">
                Curated for You
              </h2>
            </div>
            <span className="text-xs font-bold text-[#002045] bg-white px-3 py-1.5 rounded-full shadow-sm border border-[#adc7f7]">
              ⭐ 100% Zero Brokerage
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SHOWCASE_PROPERTIES.map((prop) => {
              const isFav = !!favorites[prop.id];
              return (
                <div
                  key={prop.id}
                  onClick={() => {
                    setActiveModalImage(0);
                    setSelectedProperty(prop);
                  }}
                  className="bg-white rounded-2xl overflow-hidden shadow-[0px_4px_20px_rgba(26,54,93,0.05)] hover:shadow-[0px_10px_30px_rgba(26,54,93,0.12)] transition-all duration-300 group cursor-pointer border border-[#c4c6cf]/30 flex flex-col"
                >
                  <div className="relative h-64 overflow-hidden rounded-t-2xl">
                    <img
                      src={prop.imgUrl}
                      alt={prop.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center shadow-sm">
                      <span className="text-xs font-bold text-[#002045]">
                        {prop.badge}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(prop.id, e)}
                      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:text-[#fe6c6b] transition-colors"
                      aria-label="Save to favorites"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isFav ? "favorite" : "favorite_border"}
                      </span>
                    </button>
                  </div>

                  <div className="p-6 flex flex-col flex-grow justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-headline text-lg font-bold text-[#002045] line-clamp-1">
                          {prop.title}
                        </h3>
                        <div className="flex items-center space-x-1 shrink-0 ml-4 bg-[#e7eeff] px-2 py-0.5 rounded text-xs font-bold text-[#002045]">
                          <span className="material-symbols-outlined text-[#ad3035] text-sm">star</span>
                          <span>{prop.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#43474e] mb-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-[#ad3035]">location_on</span>
                        {prop.area}, {prop.city} &bull; {prop.state}
                      </p>
                      {prop.pincode && (
                        <span className="inline-block text-[10px] bg-[#f0f3ff] text-[#002045] font-semibold px-2 py-0.5 rounded border border-[#adc7f7]/40 mb-3">
                          PIN {prop.pincode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-end justify-between border-t border-[#c4c6cf]/30 pt-4 mt-2">
                      <div>
                        <span className="font-headline text-xl font-bold text-[#002045]">
                          ₹{prop.rent.toLocaleString()}
                        </span>
                        <span className="text-xs text-[#43474e]"> / month</span>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-bold text-white bg-[#002045] hover:bg-[#1a365d] px-4 py-2 rounded-lg transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── ALL VERIFIED PROPERTIES SECTION (Listings & Filter Results) ─── */}
      <section ref={listingsSectionRef} className="py-20 px-6 md:px-12 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="font-headline text-2xl md:text-3xl font-bold text-[#002045]">
                {vibeQuery
                  ? `Homes Matched to Your Vibe: "${vibeQuery}"`
                  : selectedTaluk
                  ? `Properties in "${selectedTaluk}"`
                  : selectedDistrict
                  ? `Properties in "${selectedDistrict}, ${selectedState}"`
                  : selectedState
                  ? `Properties in "${selectedState}"`
                  : searchPincode
                  ? `Properties near PIN "${searchPincode}"`
                  : searchLocation
                  ? `Properties in "${searchLocation}"`
                  : "All Verified Properties"}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <p className="text-sm text-[#43474e]">
                  Showing {filteredProperties.length} available listings
                </p>
                {/* Active Filter Badges */}
                {vibeQuery && (
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#fe6c6b]/15 to-[#002045]/15 text-[#002045] text-xs font-bold px-3 py-1 rounded-full border border-[#fe6c6b]/40 shadow-sm">
                    <span className="material-symbols-outlined text-xs text-[#fe6c6b]">auto_awesome</span>
                    Vibe: "{vibeQuery}"
                    <button
                      type="button"
                      onClick={handleResetLocationFilters}
                      className="text-xs hover:text-[#ad3035] ml-1 font-bold cursor-pointer"
                      title="Clear vibe filter"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedState && (
                  <span className="inline-flex items-center gap-1 bg-[#e7eeff] text-[#002045] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#adc7f7]">
                    State: {selectedState}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedState("");
                        setSelectedDistrict("");
                        setSelectedTaluk("");
                      }}
                      className="text-xs hover:text-[#ad3035]"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedDistrict && (
                  <span className="inline-flex items-center gap-1 bg-[#e7eeff] text-[#002045] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#adc7f7]">
                    District: {selectedDistrict}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDistrict("");
                        setSelectedTaluk("");
                      }}
                      className="text-xs hover:text-[#ad3035]"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedTaluk && (
                  <span className="inline-flex items-center gap-1 bg-[#e7eeff] text-[#002045] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#adc7f7]">
                    Taluk: {selectedTaluk.split(" (")[0]}
                    <button
                      type="button"
                      onClick={() => setSelectedTaluk("")}
                      className="text-xs hover:text-[#ad3035]"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {searchPincode && (
                  <span className="inline-flex items-center gap-1 bg-[#e7eeff] text-[#002045] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#adc7f7]">
                    PIN: {searchPincode}
                    <button
                      type="button"
                      onClick={() => {
                        setSearchPincode("");
                        setPincodeAutoInfo(null);
                      }}
                      className="text-xs hover:text-[#ad3035]"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>
            </div>
            {(searchLocation || selectedHouseType !== "ALL" || selectedState || selectedDistrict || selectedTaluk || searchPincode || vibeQuery) && (
              <button
                type="button"
                onClick={handleResetLocationFilters}
                className="text-xs font-semibold text-[#002045] bg-[#e7eeff] px-3.5 py-2 rounded-lg hover:bg-[#dee8ff] transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-20 text-[#43474e]">
              <div className="inline-block w-8 h-8 border-4 border-[#002045] border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-medium">Loading verified properties...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-16 bg-[#f9f9ff] rounded-2xl border border-dashed border-[#c4c6cf]">
              <span className="material-symbols-outlined text-4xl text-[#74777f] mb-2">search_off</span>
              <h3 className="font-headline text-lg font-bold text-[#002045]">No matching homes found</h3>
              <p className="text-sm text-[#43474e] mt-1">Try changing your location, house type filter, or search query.</p>
              <button
                type="button"
                onClick={handleResetLocationFilters}
                className="mt-4 text-xs font-bold text-white bg-[#002045] px-5 py-2.5 rounded-xl cursor-pointer shadow-sm"
              >
                Show All Homes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((item) => {
                const isFav = !!favorites[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveModalImage(0);
                      setSelectedProperty(item);
                    }}
                    className="bg-[#f9f9ff] rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border border-[#c4c6cf]/30 flex flex-col"
                  >
                    <div className="relative h-56 overflow-hidden bg-gray-200" data-protected-image="true">
                      <img
                        src={item.imgUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none select-none"
                        loading="lazy"
                      />
                      {/* Security Watermark Badge */}
                      <div className="absolute top-3 left-3 bg-[#002045]/75 backdrop-blur-sm text-white/90 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs border border-white/20 pointer-events-none select-none">
                        <span className="material-symbols-outlined text-[11px] text-[#fe6c6b]">lock</span>
                        <span>Protected</span>
                      </div>
                      {/* Vibe Match Badge */}
                      {item.matchScore && (
                        <div className="absolute bottom-2.5 left-2.5 bg-[#002045]/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md border border-white/20">
                          <span className="material-symbols-outlined text-[13px] text-[#fe6c6b]">auto_awesome</span>
                          <span>{item.matchScore}% Match</span>
                          {item.matchReason && (
                            <span className="text-[#adc7f7] font-normal hidden sm:inline">&bull; {item.matchReason}</span>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(item.id, e)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:text-[#fe6c6b] transition-colors"
                        aria-label="Save to favorites"
                      >
                        <span className="material-symbols-outlined text-base">
                          {isFav ? "favorite" : "favorite_border"}
                        </span>
                      </button>
                    </div>

                    <div className="p-5 flex flex-col flex-grow justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-headline text-base font-bold text-[#002045] line-clamp-1">
                            {item.title}
                          </h3>
                          <span className="text-xs font-semibold text-[#002045] bg-[#e7eeff] px-2 py-0.5 rounded">
                            {item.houseType}
                          </span>
                        </div>
                        <p className="text-xs text-[#43474e] mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-[#ad3035]">location_on</span>
                          {item.area ? `${item.area}, ` : ""}{item.district || item.city}{item.state ? `, ${item.state}` : ""}
                        </p>
                        {item.pincode && (
                          <div className="mt-1">
                            <span className="text-[10px] bg-[#f0f3ff] text-[#002045] font-semibold px-2 py-0.5 rounded border border-[#adc7f7]/50">
                              PIN: {item.pincode}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-[#74777f] mt-2 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#c4c6cf]/30 flex items-center justify-between">
                        <div>
                          <span className="font-headline text-lg font-bold text-[#002045]">
                            ₹{item.rent.toLocaleString()}
                          </span>
                          <span className="text-xs text-[#43474e]"> / mo</span>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-bold text-white bg-[#002045] hover:bg-[#1a365d] px-4 py-2 rounded-lg transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── STITCH SECTION: FEATURED SPATIAL EXPERIENCE (VIRTUAL WALKTHROUGH) ─── */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-12 py-16 w-full" id="virtualTourSection">
        {(() => {
          const currentRoom = SPATIAL_ROOMS[activeRoomKey] || SPATIAL_ROOMS.living;
          return (
            <div className="bg-white rounded-3xl border border-[#c4c6cf]/50 p-6 md:p-10 shadow-[0px_10px_35px_rgba(26,54,93,0.06)]">
              {/* Header & Tabs */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#c4c6cf]/40 mb-8 gap-4">
                <div>
                  <span className="text-xs font-bold text-[#ad3035] uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#fe6c6b] animate-ping"></span>
                    Featured Spatial Experience
                  </span>
                  <h2 className="font-headline text-2xl md:text-3xl font-extrabold text-[#002045] mt-1">
                    The Oceanfront Sanctuary - Virtual Walkthrough
                  </h2>
                  <p className="text-[#43474e] text-sm mt-0.5">
                    Explore each meticulously designed living zone before you arrive.
                  </p>
                </div>

                {/* Room Selector Tabs */}
                <div className="flex flex-wrap gap-2" id="spatialTabs">
                  {Object.values(SPATIAL_ROOMS).map((room) => {
                    const isActive = activeRoomKey === room.key;
                    return (
                      <button
                        key={room.key}
                        type="button"
                        onClick={() => handleSwitchRoom(room.key)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#002045] text-white shadow-sm"
                            : "bg-[#e7eeff] text-[#43474e] hover:text-[#002045] hover:bg-[#d8e3fa]"
                        }`}
                      >
                        {room.tabLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spatial Visual Showcase Box */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Visual Display (8 cols) */}
                <div className="lg:col-span-8 relative rounded-2xl overflow-hidden aspect-[16/10] bg-black shadow-lg group">
                  <img
                    src={currentRoom.img}
                    alt={currentRoom.title}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      isImageFading ? "opacity-25 scale-105" : "opacity-100 scale-100"
                    }`}
                  />
                  {/* Interactive Hotspot */}
                  <div className="absolute top-1/3 left-1/4 group/spot cursor-pointer z-10">
                    <div className="w-7 h-7 rounded-full bg-[#fe6c6b] text-white flex items-center justify-center shadow-lg animate-bounce">
                      <span className="material-symbols-outlined text-[16px]">touch_app</span>
                    </div>
                    <div className="absolute left-9 top-0 hidden group-hover/spot:block bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl text-xs font-bold text-[#002045] whitespace-nowrap border border-[#c4c6cf]/40 animate-fadeIn">
                      {currentRoom.hotspot}
                    </div>
                  </div>

                  {/* 360 Spatial Badge */}
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 shadow-md">
                    <span className="material-symbols-outlined text-[16px] text-[#fe6c6b]">360</span>
                    <span className="font-medium">Interactive Spatial Resolution: 4K HDR</span>
                  </div>

                  {/* Full Tour Button */}
                  <button
                    type="button"
                    onClick={() => setIsFullTourModalOpen(true)}
                    className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-[#002045] px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-1 transition-all cursor-pointer hover:scale-105"
                  >
                    <span className="material-symbols-outlined text-[16px]">fullscreen</span>
                    <span>Full Tour</span>
                  </button>
                </div>

                {/* Room Metadata & Highlights (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="inline-block px-2.5 py-1 bg-[#dee8ff] text-[#002045] rounded text-xs font-bold">
                    {currentRoom.zone}
                  </div>
                  <h3 className="font-headline text-2xl font-bold text-[#002045]">
                    {currentRoom.title}
                  </h3>
                  <p className="text-[#43474e] text-sm leading-relaxed">
                    {currentRoom.desc}
                  </p>

                  <div className="border-t border-[#c4c6cf]/30 pt-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#002045]">
                      Architectural Highlights:
                    </h4>
                    <div className="space-y-2 text-xs text-[#43474e]">
                      {currentRoom.features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#ad3035] text-[18px]">
                            check
                          </span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const targetVilla = properties.find((p) => p.id === "showcase-1") || SHOWCASE_PROPERTIES[0];
                        if (targetVilla) {
                          setActiveModalImage(0);
                          setSelectedProperty(targetVilla);
                        } else if (listingsSectionRef.current) {
                          listingsSectionRef.current.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="w-full bg-[#002045] hover:bg-[#1a365d] text-white text-xs font-bold py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md active:scale-98"
                    >
                      <span>Check Villa Availability</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* ─── STITCH SECTION: FREQUENTLY ASKED QUESTIONS ─── */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-12 py-16 w-full" id="faqSection">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs uppercase font-bold tracking-wider text-[#ad3035]">
              Frequently Asked Questions
            </span>
            <h2 className="font-headline text-2xl md:text-3xl font-extrabold text-[#002045] mt-1.5">
              Everything You Need to Know
            </h2>
            <p className="text-[#43474e] text-sm mt-2">
              Clear answers for discerning guests and luxury homeowners.
            </p>
          </div>

          <div className="space-y-3.5" id="faqAccordion">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-[#c4c6cf]/50 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:border-[#002045]/40"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaqItem(idx)}
                    className="w-full px-6 py-4.5 text-left flex justify-between items-center hover:bg-[#f0f3ff] transition-colors cursor-pointer"
                  >
                    <span className="font-headline text-sm md:text-base font-bold text-[#002045]">
                      {faq.question}
                    </span>
                    <span
                      className={`material-symbols-outlined text-[#43474e] text-xl transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-[#ad3035]" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 pt-1 text-sm text-[#43474e] leading-relaxed border-t border-[#c4c6cf]/20 bg-[#f9f9ff] animate-fadeIn">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── STITCH SECTION 3: CALL TO ACTION BANNER ─── */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-12 py-12 w-full">
        <div className="bg-[#1a365d] rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between shadow-[0px_10px_30px_rgba(26,54,93,0.15)] border border-white/10 gap-6">
          <div className="text-center md:text-left">
            <h2 className="font-headline text-2xl md:text-3xl font-bold text-white mb-2">
              List your home and start earning today.
            </h2>
            <p className="text-base text-[#d6e3ff]">
              Join our curated collection of premium properties.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/owner/add-property")}
            className="font-headline text-sm font-bold bg-[#fe6c6b] hover:bg-[#ad3035] text-white px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-300 shadow-md whitespace-nowrap cursor-pointer hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* ─── Property Details Modal (Keyboard & Screen-Reader Accessible) ─── */}
      {selectedProperty && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-property-title"
          onClick={() => setSelectedProperty(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#c4c6cf]/40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image Carousel (Protected Media) */}
            <div className="relative h-64 md:h-80 bg-gray-900 overflow-hidden" data-protected-image="true">
              {(() => {
                const allImages = [selectedProperty.imgUrl, ...selectedProperty.additionalImages].filter(Boolean);
                const currentImg = allImages[activeModalImage] || selectedProperty.imgUrl;
                return (
                  <>
                    <img
                      src={currentImg}
                      alt={selectedProperty.title}
                      className="w-full h-full object-cover pointer-events-none select-none"
                    />
                    {/* Security Watermark Badge */}
                    <div className="absolute top-4 left-4 bg-black/65 backdrop-blur-md text-white/95 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md border border-white/20 pointer-events-none select-none">
                      <span className="material-symbols-outlined text-[13px] text-[#fe6c6b]">shield_lock</span>
                      <span>Namma Mane Protected Media</span>
                    </div>
                    {allImages.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                        {allImages.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveModalImage(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              activeModalImage === idx ? "bg-white scale-125" : "bg-white/50"
                            }`}
                            aria-label={`View image ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
              <button
                type="button"
                onClick={() => setSelectedProperty(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center font-bold hover:bg-black transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-[#ad3035] uppercase tracking-wider block mb-1">
                    {selectedProperty.houseType} &bull; {selectedProperty.badge}
                  </span>
                  <h3 id="modal-property-title" className="font-headline text-2xl font-bold text-[#002045]">
                    {selectedProperty.title}
                  </h3>
                  <p className="text-xs text-[#43474e] mt-0.5">
                    {selectedProperty.address || `${selectedProperty.area}, ${selectedProperty.city}`}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedProperty.state && (
                      <span className="text-[11px] bg-[#e7eeff] text-[#002045] font-semibold px-2.5 py-0.5 rounded-full border border-[#adc7f7]">
                        🏛️ {selectedProperty.state}
                      </span>
                    )}
                    {selectedProperty.district && (
                      <span className="text-[11px] bg-[#e7eeff] text-[#002045] font-semibold px-2.5 py-0.5 rounded-full border border-[#adc7f7]">
                        📍 {selectedProperty.district}
                      </span>
                    )}
                    {selectedProperty.taluk && (
                      <span className="text-[11px] bg-[#e7eeff] text-[#002045] font-semibold px-2.5 py-0.5 rounded-full border border-[#adc7f7]">
                        🏘️ {selectedProperty.taluk.split(" (")[0]}
                      </span>
                    )}
                    {selectedProperty.pincode && (
                      <span className="text-[11px] bg-[#ffdad8] text-[#ad3035] font-bold px-2.5 py-0.5 rounded-full">
                        📮 PIN {selectedProperty.pincode}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-headline text-2xl font-bold text-[#002045]">
                    ₹{selectedProperty.rent.toLocaleString()}
                  </span>
                  <span className="text-xs text-[#43474e] block">/ month</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#43474e] mb-1.5">
                  About This Home
                </h4>
                <p className="text-sm text-[#43474e] leading-relaxed">
                  {selectedProperty.description}
                </p>
              </div>

              {/* Facilities Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#43474e] mb-2">
                  Facilities & Amenities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProperty.facilities.map((fac, i) => (
                    <span
                      key={i}
                      className="text-xs font-medium bg-[#e7eeff] text-[#002045] px-3 py-1.5 rounded-lg"
                    >
                      ✓ {fac}
                    </span>
                  ))}
                </div>
              </div>

              {/* House Rules */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#43474e] mb-2">
                  House Rules
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProperty.rules.map((rule, i) => (
                    <span
                      key={i}
                      className="text-xs font-medium bg-gray-100 text-[#43474e] px-3 py-1 rounded-md"
                    >
                      • {rule}
                    </span>
                  ))}
                </div>
              </div>

              {/* Owner Contact / Direct Action */}
              <div className="pt-4 border-t border-[#c4c6cf]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-[#74777f] block">Verified Host</span>
                  <strong className="text-sm text-[#002045]">{selectedProperty.owner_name}</strong>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenChat(selectedProperty.owner_name)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-[#002045] text-[#002045] rounded-xl text-xs font-bold hover:bg-[#e7eeff] transition-colors cursor-pointer"
                  >
                    💬 Chat with Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInitiateBooking(selectedProperty)}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-[#ad3035] hover:bg-[#8c1620] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    Request & Offer Rent →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Rent Negotiation & Request Modal ─── */}
      {negotiationProperty && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          onClick={() => setNegotiationProperty(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-[#c4c6cf]/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold text-[#ad3035] uppercase tracking-wider block mb-1">
                  Direct Negotiation
                </span>
                <h3 className="font-headline text-xl font-bold text-[#002045]">
                  Submit Rental Offer
                </h3>
                <p className="text-xs text-[#43474e]">
                  For {negotiationProperty.title} &bull; Host: {negotiationProperty.owner_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNegotiationProperty(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-4">
              <div className="p-3.5 bg-[#f9f9ff] rounded-xl border border-[#c4c6cf]/40 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#43474e]">Listed Monthly Rent:</span>
                  <strong className="text-sm text-[#002045] font-bold">
                    ₹{negotiationProperty.rent.toLocaleString()}/mo
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#002045] uppercase tracking-wider mb-1">
                  Your Proposed Monthly Rent (₹)
                </label>
                <input
                  type="number"
                  value={offeredRent}
                  onChange={(e) => setOfferedRent(e.target.value)}
                  placeholder={`e.g. ${negotiationProperty.rent}`}
                  required
                  min="1000"
                  className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-gray-300 rounded-xl text-sm font-bold text-[#002045] focus:outline-none focus:border-[#002045]"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  You can keep the listed rent or propose your own price.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#002045] uppercase tracking-wider mb-1">
                  Message to Landlord (Optional)
                </label>
                <textarea
                  value={negotiationMessage}
                  onChange={(e) => setNegotiationMessage(e.target.value)}
                  placeholder="e.g. Hi, I work in tech nearby and am looking for a 12-month lease starting next week."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-gray-300 rounded-xl text-xs text-[#002045] focus:outline-none focus:border-[#002045]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNegotiationProperty(null)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-[#002045] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="flex-1 py-2.5 bg-[#ad3035] hover:bg-[#8c1620] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {bookingLoading ? "Submitting..." : "Send Request to Host →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 4K HDR Full Tour Modal ─── */}
      {isFullTourModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-5xl bg-[#001b3c] rounded-2xl overflow-hidden border border-white/20 shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#002045]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fe6c6b] animate-ping"></span>
                <div>
                  <h3 className="text-white font-headline font-bold text-base">
                    The Oceanfront Sanctuary &bull; 4K Spatial Tour
                  </h3>
                  <p className="text-xs text-[#adc7f7]">
                    {SPATIAL_ROOMS[activeRoomKey]?.title} &bull; {SPATIAL_ROOMS[activeRoomKey]?.zone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFullTourModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                aria-label="Close 360 tour"
              >
                ✕
              </button>
            </div>

            {/* Main Stage View */}
            <div className="relative flex-1 min-h-[380px] md:min-h-[500px] overflow-hidden bg-black flex items-center justify-center">
              <img
                src={SPATIAL_ROOMS[activeRoomKey]?.img}
                alt={SPATIAL_ROOMS[activeRoomKey]?.title}
                className="w-full h-full object-cover max-h-[65vh]"
              />
              {/* Center 360 Indicator */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#fe6c6b]">360</span>
                <span>Spatial View Active &bull; 4K Ultra HDR</span>
              </div>

              {/* Hotspot Pin */}
              <div className="absolute top-1/2 left-1/3 group/pin cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-[#fe6c6b] text-white flex items-center justify-center shadow-2xl animate-pulse">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                </div>
                <div className="absolute left-10 top-0 bg-white/95 text-[#002045] text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                  {SPATIAL_ROOMS[activeRoomKey]?.hotspot}
                </div>
              </div>
            </div>

            {/* Room Navigation Footer */}
            <div className="p-4 bg-[#001b3c] border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {Object.values(SPATIAL_ROOMS).map((room) => (
                  <button
                    key={room.key}
                    type="button"
                    onClick={() => handleSwitchRoom(room.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeRoomKey === room.key
                        ? "bg-[#fe6c6b] text-white"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    {room.tabLabel}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFullTourModalOpen(false);
                  const targetVilla = properties.find((p) => p.id === "showcase-1") || SHOWCASE_PROPERTIES[0];
                  if (targetVilla) {
                    setActiveModalImage(0);
                    setSelectedProperty(targetVilla);
                  }
                }}
                className="px-4 py-2 bg-white text-[#002045] font-bold text-xs rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Inquire About This Villa &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FLOATING RIGHT-SIDE VIBE SEARCH TRIGGER & DRAWER ─── */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        <button
          type="button"
          onClick={() => setIsVibeDrawerOpen(true)}
          className="bg-gradient-to-b from-[#ad3035] to-[#002045] hover:from-[#fe6c6b] text-white shadow-2xl px-2.5 py-4 rounded-l-2xl flex flex-col items-center gap-1.5 transition-all duration-300 border-l-2 border-y-2 border-white/40 cursor-pointer group hover:scale-105"
          title="Open AI Vibe Search"
        >
          <span className="material-symbols-outlined text-lg text-[#fe6c6b] group-hover:scale-125 transition-transform animate-bounce">
            auto_awesome
          </span>
          <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-bold tracking-wider uppercase">
            Vibe Search
          </span>
        </button>
      </div>

      {/* Right-Side Slide-Out Vibe Drawer */}
      {isVibeDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsVibeDrawerOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto border-l border-[#c4c6cf]/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#c4c6cf]/30 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ad3035] to-[#fe6c6b] text-white flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  </span>
                  <div>
                    <h3 className="font-headline font-bold text-base text-[#002045]">
                      AI Vibe Matcher
                    </h3>
                    <p className="text-xs text-[#74777f]">Right-Side Lifestyle Explorer</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVibeDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-[#002045] flex items-center justify-center font-bold text-sm cursor-pointer"
                  aria-label="Close vibe drawer"
                >
                  ✕
                </button>
              </div>

              {/* Form Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVibeSearch();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#43474e] mb-1.5">
                    Describe Your Ideal Living Vibe:
                  </label>
                  <textarea
                    value={vibeQuery}
                    onChange={(e) => setVibeQuery(e.target.value)}
                    placeholder="e.g. Quiet sunlit 2BHK villa with garden, ocean breeze, fast wifi & pet-friendly..."
                    rows={3}
                    className="w-full p-3 text-xs bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-[#002045] placeholder:text-[#74777f]/70 focus:outline-none focus:border-[#ad3035] focus:ring-2 focus:ring-[#ad3035]/15 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVibeSearching}
                  className="w-full bg-gradient-to-r from-[#ad3035] to-[#002045] hover:opacity-95 text-white font-bold text-xs py-3.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  <span>{isVibeSearching ? "Finding Matches..." : "Match Verified Homes →"}</span>
                </button>
              </form>

              {/* Popular Atmospheres in Drawer */}
              <div className="mt-7">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#74777f] mb-3">
                  Popular Vibes & Good Places:
                </h4>
                <div className="space-y-2.5">
                  {VIBE_PLACES.map((vibe) => (
                    <div
                      key={vibe.id}
                      onClick={() => handleVibeSearch(vibe.query)}
                      className="p-3 rounded-xl border border-[#c4c6cf]/40 hover:border-[#fe6c6b] hover:bg-[#fff5f5] transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-[#fe6c6b]">{vibe.icon}</span>
                          <span className="text-xs font-bold text-[#002045] group-hover:text-[#ad3035] transition-colors">
                            {vibe.title}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#74777f] mt-0.5">
                          📍 {vibe.places.slice(0, 2).join(" • ")}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-sm text-[#74777f] group-hover:translate-x-1 group-hover:text-[#ad3035] transition-all">
                        chevron_right
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#c4c6cf]/20 text-center">
              <p className="text-[11px] text-[#74777f]">100% Zero Brokerage Verified Properties Across India</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
