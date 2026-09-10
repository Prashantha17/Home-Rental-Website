// src/data/indiaLocations.js

/**
 * Curated hierarchy of Indian States -> Districts -> Taluks/Sub-divisions,
 * along with popular PIN codes for automatic lookup.
 */
export const INDIA_LOCATIONS = {
  Karnataka: {
    "Bengaluru Urban": [
      "Indiranagar (Bengaluru East)",
      "BTM Layout (Bengaluru South)",
      "Koramangala (Bengaluru South)",
      "HSR Layout (Bengaluru South)",
      "Whitefield (K.R. Puram)",
      "Jayanagar (Bengaluru South)",
      "Malleshwaram (Bengaluru North)",
      "Yelahanka",
      "Electronic City (Anekal)",
      "Hebbal (Bengaluru North)",
      "Rajajinagar",
      "Marathahalli",
      "Bellandur",
      "Bannerghatta Road (Anekal)",
      "Anekal"
    ],
    "Bengaluru Rural": [
      "Devanahalli",
      "Doddaballapura",
      "Hosakote",
      "Nelamangala"
    ],
    Mysuru: [
      "VV Mohalla (Mysuru City)",
      "Jayalakshmipuram",
      "Gokulam",
      "Kuvempunagar",
      "Hunsur",
      "Nanjangud",
      "T. Narasipura",
      "K.R. Nagar"
    ],
    "Dakshina Kannada": [
      "Mangaluru City",
      "Bantwal",
      "Belthangady",
      "Puttur",
      "Sullia",
      "Kadaba",
      "Moodabidri"
    ],
    Udupi: [
      "Udupi",
      "Manipal",
      "Kundapura",
      "Karkala",
      "Kaup",
      "Brahmavara",
      "Byndoor"
    ],
    Dharwad: [
      "Hubballi Urban",
      "Hubballi Rural",
      "Dharwad",
      "Navalgund",
      "Kalghatgi",
      "Kundgol"
    ],
    Belagavi: [
      "Belagavi City",
      "Gokak",
      "Chikkodi",
      "Bailhongal",
      "Athani",
      "Saundatti",
      "Khanapur"
    ]
  },
  Maharashtra: {
    "Mumbai Suburban": [
      "Bandra West",
      "Bandra East",
      "Andheri West",
      "Andheri East",
      "Juhu",
      "Borivali",
      "Malad",
      "Goregaon",
      "Powai",
      "Kurla"
    ],
    "Mumbai City": [
      "Colaba",
      "Marine Lines",
      "Worli",
      "Lower Parel",
      "Dadar",
      "Byculla",
      "Fort"
    ],
    Pune: [
      "Kothrud",
      "Viman Nagar",
      "Baner",
      "Hinjawadi (Mulshi)",
      "Kalyani Nagar",
      "Wakad (Haveli)",
      "Aundh",
      "Hadapsar",
      "Koregaon Park",
      "Shivajinagar"
    ],
    Thane: [
      "Thane West",
      "Ghodbunder Road",
      "Kalyan",
      "Dombivli",
      "Mira-Bhayandar",
      "Navi Mumbai (Airoli/Vashi)"
    ],
    Nagpur: [
      "Nagpur Urban",
      "Dharampeth",
      "Ramdaspeth",
      "Hingna",
      "Kamptee"
    ]
  },
  Goa: {
    "North Goa": [
      "Assagao (Bardez)",
      "Anjuna (Bardez)",
      "Panaji (Tiswadi)",
      "Candolim (Bardez)",
      "Calangute (Bardez)",
      "Mapusa (Bardez)",
      "Porvorim",
      "Pernem",
      "Bicholim"
    ],
    "South Goa": [
      "Margao (Salcete)",
      "Colva (Salcete)",
      "Benaulim (Salcete)",
      "Vasco da Gama (Mormugao)",
      "Canacona",
      "Quepem"
    ]
  },
  "Tamil Nadu": {
    Chennai: [
      "Adyar",
      "Velachery",
      "T. Nagar",
      "Anna Nagar",
      "Thiruvanmiyur",
      "OMR (Sholinganallur)",
      "Mylapore",
      "Besant Nagar",
      "Guindy"
    ],
    Coimbatore: [
      "RS Puram",
      "Gandhipuram",
      "Peelamedu",
      "Saravanampatti",
      "Singanallur",
      "Pollachi"
    ],
    Kanchipuram: [
      "Tambaram",
      "Chromepet",
      "Pallavaram",
      "Kanchipuram Urban",
      "Sriperumbudur"
    ]
  },
  "Delhi NCR": {
    "New Delhi": [
      "Connaught Place",
      "Chanakyapuri",
      "Vasant Kunj",
      "Hauz Khas",
      "Saket",
      "Greater Kailash",
      "Lajpat Nagar",
      "Dwarka"
    ],
    Gurugram: [
      "DLF Phase 1-5",
      "Golf Course Road",
      "Sohna Road",
      "Sector 56",
      "Cyber City",
      "Palam Vihar"
    ],
    "Gautam Buddha Nagar (Noida)": [
      "Noida Sector 62",
      "Noida Sector 18",
      "Noida Expressway (Sector 137)",
      "Greater Noida West",
      "Pari Chowk"
    ]
  },
  Telangana: {
    Hyderabad: [
      "Gachibowli (Serilingampally)",
      "Hitec City (Madhapur)",
      "Banjara Hills",
      "Jubilee Hills",
      "Kondapur",
      "Kukatpally",
      "Begumpet",
      "Secunderabad"
    ],
    "Rangareddy": [
      "Rajendranagar",
      "Shamshabad",
      "Manikonda",
      "Narsingi"
    ]
  },
  Kerala: {
    Ernakulam: [
      "Kochi (Marine Drive)",
      "Kakkanad (Infopark)",
      "Edappally",
      "Aluva",
      "Fort Kochi",
      "Kadavanthra"
    ],
    Thiruvananthapuram: [
      "Technopark (Kazhakkoottam)",
      "Vellayambalam",
      "Kowdiar",
      "Pattom",
      "Thampanoor"
    ]
  },
  Gujarat: {
    Ahmedabad: [
      "Bodakdev",
      "Satellite",
      "SG Highway",
      "Vastrapur",
      "Prahlad Nagar",
      "Navrangpura",
      "Maninagar"
    ],
    Surat: [
      "Athwa",
      "Vesu",
      "Adajan",
      "Varachha",
      "Piplod"
    ]
  }
};

/**
 * Built-in dictionary of well-known 6-digit Indian PIN codes
 * for lightning-fast zero-latency offline resolution.
 */
export const KNOWN_PINCODES = {
  // Bengaluru
  "560038": { state: "Karnataka", district: "Bengaluru Urban", taluk: "Indiranagar (Bengaluru East)", city: "Bengaluru" },
  "560068": { state: "Karnataka", district: "Bengaluru Urban", taluk: "BTM Layout (Bengaluru South)", city: "Bengaluru" },
  "560034": { state: "Karnataka", district: "Bengaluru Urban", taluk: "Koramangala (Bengaluru South)", city: "Bengaluru" },
  "560102": { state: "Karnataka", district: "Bengaluru Urban", taluk: "HSR Layout (Bengaluru South)", city: "Bengaluru" },
  "560066": { state: "Karnataka", district: "Bengaluru Urban", taluk: "Whitefield (K.R. Puram)", city: "Bengaluru" },
  "560041": { state: "Karnataka", district: "Bengaluru Urban", taluk: "Jayanagar (Bengaluru South)", city: "Bengaluru" },
  "560003": { state: "Karnataka", district: "Bengaluru Urban", taluk: "Malleshwaram (Bengaluru North)", city: "Bengaluru" },
  "560064": { state: "Karnataka", district: "Bengaluru Urban", taluk: "Yelahanka", city: "Bengaluru" },
  "560100": { state: "Karnataka", district: "Bengaluru Urban", taluk: "Electronic City (Anekal)", city: "Bengaluru" },
  "560024": { state: "Karnataka", district: "Bengaluru Urban", taluk: "Hebbal (Bengaluru North)", city: "Bengaluru" },
  "560010": { state: "Karnataka", district: "Bengaluru Urban", taluk: "Rajajinagar", city: "Bengaluru" },
  "560037": { state: "Karnataka", district: "Bengaluru Urban", taluk: "Marathahalli", city: "Bengaluru" },
  "560103": { state: "Karnataka", district: "Bengaluru Urban", taluk: "Bellandur", city: "Bengaluru" },
  "560076": { state: "Karnataka", district: "Bengaluru Urban", taluk: "Bannerghatta Road (Anekal)", city: "Bengaluru" },

  // Mysuru
  "570002": { state: "Karnataka", district: "Mysuru", taluk: "VV Mohalla (Mysuru City)", city: "Mysuru" },
  "570012": { state: "Karnataka", district: "Mysuru", taluk: "Jayalakshmipuram", city: "Mysuru" },
  "570023": { state: "Karnataka", district: "Mysuru", taluk: "Kuvempunagar", city: "Mysuru" },

  // Mumbai
  "400050": { state: "Maharashtra", district: "Mumbai Suburban", taluk: "Bandra West", city: "Mumbai" },
  "400051": { state: "Maharashtra", district: "Mumbai Suburban", taluk: "Bandra East", city: "Mumbai" },
  "400053": { state: "Maharashtra", district: "Mumbai Suburban", taluk: "Andheri West", city: "Mumbai" },
  "400069": { state: "Maharashtra", district: "Mumbai Suburban", taluk: "Andheri East", city: "Mumbai" },
  "400049": { state: "Maharashtra", district: "Mumbai Suburban", taluk: "Juhu", city: "Mumbai" },
  "400092": { state: "Maharashtra", district: "Mumbai Suburban", taluk: "Borivali", city: "Mumbai" },
  "400076": { state: "Maharashtra", district: "Mumbai Suburban", taluk: "Powai", city: "Mumbai" },
  "400018": { state: "Maharashtra", district: "Mumbai City", taluk: "Worli", city: "Mumbai" },
  "400013": { state: "Maharashtra", district: "Mumbai City", taluk: "Lower Parel", city: "Mumbai" },
  "400005": { state: "Maharashtra", district: "Mumbai City", taluk: "Colaba", city: "Mumbai" },

  // Pune
  "411038": { state: "Maharashtra", district: "Pune", taluk: "Kothrud", city: "Pune" },
  "411014": { state: "Maharashtra", district: "Pune", taluk: "Viman Nagar", city: "Pune" },
  "411045": { state: "Maharashtra", district: "Pune", taluk: "Baner", city: "Pune" },
  "411057": { state: "Maharashtra", district: "Pune", taluk: "Hinjawadi (Mulshi)", city: "Pune" },
  "411006": { state: "Maharashtra", district: "Pune", taluk: "Koregaon Park", city: "Pune" },

  // Goa
  "403507": { state: "Goa", district: "North Goa", taluk: "Assagao (Bardez)", city: "Goa" },
  "403509": { state: "Goa", district: "North Goa", taluk: "Anjuna (Bardez)", city: "Goa" },
  "403001": { state: "Goa", district: "North Goa", taluk: "Panaji (Tiswadi)", city: "Goa" },
  "403515": { state: "Goa", district: "North Goa", taluk: "Calangute (Bardez)", city: "Goa" },
  "403601": { state: "Goa", district: "South Goa", taluk: "Margao (Salcete)", city: "Goa" },
  "403802": { state: "Goa", district: "South Goa", taluk: "Vasco da Gama (Mormugao)", city: "Goa" },

  // Chennai
  "600020": { state: "Tamil Nadu", district: "Chennai", taluk: "Adyar", city: "Chennai" },
  "600042": { state: "Tamil Nadu", district: "Chennai", taluk: "Velachery", city: "Chennai" },
  "600017": { state: "Tamil Nadu", district: "Chennai", taluk: "T. Nagar", city: "Chennai" },
  "600040": { state: "Tamil Nadu", district: "Chennai", taluk: "Anna Nagar", city: "Chennai" },
  "600096": { state: "Tamil Nadu", district: "Chennai", taluk: "OMR (Sholinganallur)", city: "Chennai" },

  // Delhi NCR
  "110001": { state: "Delhi NCR", district: "New Delhi", taluk: "Connaught Place", city: "New Delhi" },
  "110070": { state: "Delhi NCR", district: "New Delhi", taluk: "Vasant Kunj", city: "New Delhi" },
  "110016": { state: "Delhi NCR", district: "New Delhi", taluk: "Hauz Khas", city: "New Delhi" },
  "110048": { state: "Delhi NCR", district: "New Delhi", taluk: "Greater Kailash", city: "New Delhi" },
  "110075": { state: "Delhi NCR", district: "New Delhi", taluk: "Dwarka", city: "New Delhi" },
  "122002": { state: "Delhi NCR", district: "Gurugram", taluk: "DLF Phase 1-5", city: "Gurugram" },
  "201301": { state: "Delhi NCR", district: "Gautam Buddha Nagar (Noida)", taluk: "Noida Sector 18", city: "Noida" },

  // Hyderabad
  "500032": { state: "Telangana", district: "Hyderabad", taluk: "Gachibowli (Serilingampally)", city: "Hyderabad" },
  "500081": { state: "Telangana", district: "Hyderabad", taluk: "Hitec City (Madhapur)", city: "Hyderabad" },
  "500034": { state: "Telangana", district: "Hyderabad", taluk: "Banjara Hills", city: "Hyderabad" }
};

/**
 * Resolves a 6-digit Indian PIN code to location details.
 * Uses local fast lookup first, then falls back to public Postal PIN API.
 */
export async function lookupPincode(pincode) {
  const pin = String(pincode || "").trim();
  if (!/^\d{6}$/.test(pin)) {
    return null;
  }

  // 1. Instant local cache lookup
  if (KNOWN_PINCODES[pin]) {
    return {
      pincode: pin,
      ...KNOWN_PINCODES[pin],
      source: "local"
    };
  }

  // 2. Fetch from public Postal PIN code API as fallback
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    if (!res.ok) return null;
    const data = await res.json();

    if (Array.isArray(data) && data[0] && data[0].Status === "Success" && data[0].PostOffice?.length > 0) {
      const office = data[0].PostOffice[0];
      return {
        pincode: pin,
        state: office.State,
        district: office.District,
        taluk: office.Block && office.Block !== "NA" ? office.Block : office.Name,
        city: office.Division || office.District,
        source: "api"
      };
    }
  } catch (err) {
    console.warn("Postal API lookup error:", err);
  }

  return null;
}
