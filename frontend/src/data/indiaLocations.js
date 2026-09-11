// src/data/indiaLocations.js

/**
 * Curated hierarchy of Indian States -> Districts -> Taluks/Sub-divisions,
 * along with popular PIN codes for automatic lookup.
 */
export const INDIA_LOCATIONS = {
  Karnataka: {
    "Bagalkote": [
      "Bagalkote",
      "Badami",
      "Bilagi",
      "Hungund",
      "Jamkhandi",
      "Mudhol",
      "Guledagudda",
      "Ilkal",
      "Rabkavi Banhatti"
    ],
    "Ballari": [
      "Ballari City",
      "Ballari Rural",
      "Kampli",
      "Kurugodu",
      "Sanduru",
      "Siruguppa"
    ],
    "Belagavi": [
      "Belagavi City",
      "Gokak",
      "Chikkodi",
      "Bailhongal",
      "Athani",
      "Saundatti",
      "Khanapur",
      "Ramdurg",
      "Raybag",
      "Hukkeri",
      "Mudalagi",
      "Kittur",
      "Nippani",
      "Kagawad"
    ],
    "Bengaluru Rural": [
      "Devanahalli",
      "Doddaballapura",
      "Hosakote",
      "Nelamangala"
    ],
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
    "Bidar": [
      "Bidar",
      "Basavakalyan",
      "Bhalki",
      "Humnabad",
      "Aurad",
      "Hulsoor",
      "Kamalnagar"
    ],
    "Chamarajanagar": [
      "Chamarajanagar",
      "Gundlupete",
      "Kollegala",
      "Yelandur",
      "Hanur"
    ],
    "Chikkaballapura": [
      "Chikkaballapura",
      "Bagepalli",
      "Chintamani",
      "Gauribidanur",
      "Gudibanda",
      "Sidlaghatta"
    ],
    "Chikkamagaluru": [
      "Chikkamagaluru",
      "Kadur",
      "Koppa",
      "Mudigere",
      "Narasimharajapura",
      "Sringeri",
      "Tarikere",
      "Ajjampura"
    ],
    "Chitradurga": [
      "Chitradurga",
      "Challakere",
      "Hiriyur",
      "Holalkere",
      "Hosadurga",
      "Molakalmuru"
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
    "Davanagere": [
      "Davanagere City",
      "Harihara",
      "Honnali",
      "Channagiri",
      "Jagalur",
      "Nyamathi"
    ],
    "Dharwad": [
      "Hubballi Urban",
      "Hubballi Rural",
      "Dharwad",
      "Navalgund",
      "Kalghatgi",
      "Kundgol",
      "Alnavar",
      "Annigeri"
    ],
    "Gadag": [
      "Gadag-Betageri",
      "Nargund",
      "Ron",
      "Shirahatti",
      "Mundargi",
      "Gajendragad",
      "Lakshmeshwar"
    ],
    "Hassan": [
      "Hassan",
      "Alur",
      "Arkalgud",
      "Arsikere",
      "Belur",
      "Channarayapatna",
      "Holenarasipura",
      "Sakleshpur"
    ],
    "Haveri": [
      "Haveri",
      "Byadgi",
      "Hangal",
      "Hirekerur",
      "Ranebennuru",
      "Savanur",
      "Shiggaon",
      "Rattihalli"
    ],
    "Kalaburagi (Gulbarga)": [
      "Kalaburagi City",
      "Afzalpur",
      "Aland",
      "Chincholi",
      "Chitapur",
      "Jevargi",
      "Sedam",
      "Kamalapur",
      "Yadrami",
      "Shahabad",
      "Kalgi"
    ],
    "Kodagu (Coorg)": [
      "Madikeri",
      "Somwarpet",
      "Virajpet",
      "Kushalnagar",
      "Ponnampet"
    ],
    "Kolar": [
      "Kolar",
      "Bangarapet",
      "Malur",
      "Mulbagal",
      "Srinivaspura",
      "KGF (Robertsonpet)"
    ],
    "Koppal": [
      "Koppal",
      "Gangavathi",
      "Kushtagi",
      "Yelburga",
      "Karatagi",
      "Kukanoor",
      "Kanakagiri"
    ],
    "Mandya": [
      "Mandya",
      "Maddur",
      "Malavalli",
      "Pandavapura",
      "Nagamangala",
      "Krishnarajpet (K.R. Pete)",
      "Srirangapatna"
    ],
    "Mysuru": [
      "Mysuru City",
      "VV Mohalla",
      "Jayalakshmipuram",
      "Gokulam",
      "Kuvempunagar",
      "Hunsur",
      "Nanjangud",
      "T. Narasipura",
      "K.R. Nagar",
      "H.D. Kote",
      "Periyapatna",
      "Saragur",
      "Saligrama"
    ],
    "Raichur": [
      "Raichur",
      "Devadurga",
      "Lingsugur",
      "Manvi",
      "Sindhanur",
      "Maski",
      "Sirwar"
    ],
    "Ramanagara": [
      "Ramanagara",
      "Channapatna",
      "Kanakapura",
      "Magadi",
      "Harohalli"
    ],
    "Shivamogga (Shimoga)": [
      "Shivamogga City",
      "Bhadravathi",
      "Hosanagara",
      "Sagara",
      "Shikaripura",
      "Soraba",
      "Thirthahalli"
    ],
    "Tumakuru (Tumkur)": [
      "Tumakuru City",
      "Chikkanayakanahalli",
      "Gubbi",
      "Koratagere",
      "Kunigal",
      "Madhugiri",
      "Pavagada",
      "Sira",
      "Tiptur",
      "Turuvekere"
    ],
    "Udupi": [
      "Udupi",
      "Manipal",
      "Kundapura",
      "Karkala",
      "Kaup",
      "Brahmavara",
      "Byndoor",
      "Hebri"
    ],
    "Uttara Kannada (Karwar)": [
      "Karwar",
      "Ankola",
      "Kumta",
      "Honnavar",
      "Bhatkal",
      "Sirsi",
      "Siddapur",
      "Yellapur",
      "Dandeli",
      "Haliyal",
      "Joida",
      "Mundgod"
    ],
    "Vijayanagara": [
      "Hosapete",
      "Harapanahalli",
      "Huvina Hadagali",
      "Hagari Bommanahalli",
      "Kotturu",
      "Kudligi"
    ],
    "Vijayapura (Bijapur)": [
      "Vijayapura City",
      "Basavana Bagewadi",
      "Indi",
      "Muddebihal",
      "Sindagi",
      "Chadchan",
      "Devar Hippargi",
      "Kolhar",
      "Nidagundi",
      "Tikota",
      "Babaleshwar",
      "Talikoti"
    ],
    "Yadgir": [
      "Yadgir",
      "Shahapur",
      "Surapur (Shorapur)",
      "Gurmitkal",
      "Hunasagi",
      "Wadgera"
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
      "Secunderabad",
      "Madhapur",
      "Gachibowli"
    ],
    Rangareddy: [
      "Rajendranagar",
      "Shamshabad",
      "Manikonda",
      "Narsingi",
      "Attapur",
      "Gopanpally"
    ],
    "Medchal-Malkajgiri": [
      "Malkajgiri",
      "Kompally",
      "Alwal",
      "Kukatpally",
      "Medchal"
    ],
    Warangal: [
      "Warangal Urban",
      "Hanamkonda",
      "Kazipet"
    ]
  },
  "Andhra Pradesh": {
    Visakhapatnam: [
      "Gajuwaka",
      "Madhurawada",
      "MVP Colony",
      "Siripuram",
      "Dwaraka Nagar",
      "Seethammadhara",
      "Bheemunipatnam"
    ],
    "NTR (Vijayawada)": [
      "Benz Circle",
      "Governorpet",
      "Bhavanipuram",
      "Gunadala",
      "Patamata"
    ],
    Guntur: [
      "Guntur City",
      "Broadpet",
      "Arundelpet",
      "Nallapadu",
      "Mangalagiri"
    ],
    Tirupati: [
      "Tirupati City",
      "Alipiri",
      "Chandragiri",
      "Renigunta",
      "Sri Kalahasti"
    ],
    Kurnool: [
      "Kurnool City",
      "Nandyal Road",
      "Adoni",
      "Yemmiganur"
    ],
    Ananthapuramu: [
      "Anantapur City",
      "Hindupur",
      "Guntakal",
      "Dharmavaram"
    ]
  },
  Kerala: {
    Ernakulam: [
      "Kochi (Marine Drive)",
      "Kakkanad (Infopark)",
      "Edappally",
      "Aluva",
      "Fort Kochi",
      "Kadavanthra",
      "Palarivattom",
      "Vyttila"
    ],
    Thiruvananthapuram: [
      "Technopark (Kazhakkoottam)",
      "Vellayambalam",
      "Kowdiar",
      "Pattom",
      "Thampanoor",
      "Sreekaryam"
    ],
    Kozhikode: [
      "Kozhikode City",
      "Mananchira",
      "Mavoor Road",
      "West Hill",
      "Beypore"
    ],
    Thrissur: [
      "Thrissur City",
      "Round South",
      "Ollur",
      "Guruvayur"
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
      "Maninagar",
      "Bopal",
      "Thaltej"
    ],
    Surat: [
      "Athwa",
      "Vesu",
      "Adajan",
      "Varachha",
      "Piplod",
      "Pal"
    ],
    Vadodara: [
      "Alkapuri",
      "Gotri",
      "Fatehgunj",
      "Manjalpur",
      "Vasna Road"
    ],
    Rajkot: [
      "Kalawad Road",
      "University Road",
      "Yagnik Road",
      "150 Feet Ring Road"
    ],
    Gandhinagar: [
      "Sector 1-30",
      "Infocity",
      "Koba",
      "Kudasan"
    ]
  },
  Rajasthan: {
    Jaipur: [
      "Malviya Nagar",
      "Vaishali Nagar",
      "Mansarovar",
      "C-Scheme",
      "Jagatpura",
      "Raja Park",
      "Tonk Road"
    ],
    Jodhpur: [
      "Shastri Nagar",
      "Ratanada",
      "Sardarpura",
      "Pal Road"
    ],
    Udaipur: [
      "Fatehpura",
      "Hiran Magri",
      "Panchwati",
      "Sukher",
      "Shobhagpura"
    ],
    Kota: [
      "Vigyan Nagar",
      "Talwandi",
      "Mahaveer Nagar",
      "Dadabari"
    ]
  },
  "Uttar Pradesh": {
    Lucknow: [
      "Gomti Nagar",
      "Hazratganj",
      "Aliganj",
      "Indira Nagar",
      "Mahanagar",
      "Alambagh",
      "Vibhuti Khand"
    ],
    Kanpur: [
      "Civil Lines",
      "Swaroop Nagar",
      "Kakadeo",
      "Kidwai Nagar",
      "Govind Nagar"
    ],
    Varanasi: [
      "Sigra",
      "Bhelupur",
      "Lanka",
      "Cantonment",
      "Shivpur"
    ],
    Agra: [
      "Tajganj",
      "Sanjay Place",
      "Dayal Bagh",
      "Kamla Nagar"
    ],
    Prayagraj: [
      "Civil Lines",
      "Georgetown",
      "Tagore Town",
      "Katra"
    ]
  },
  "West Bengal": {
    Kolkata: [
      "Salt Lake (Bidhannagar)",
      "New Town (Rajarhat)",
      "Park Street",
      "Ballygunge",
      "Alipore",
      "Gariahat",
      "Behala",
      "Dum Dum"
    ],
    Howrah: [
      "Howrah Station Area",
      "Shibpur",
      "Bally",
      "Liluah"
    ],
    Darjeeling: [
      "Darjeeling Town",
      "Siliguri (Pradhan Nagar)",
      "Siliguri (Sevoke Road)",
      "Kurseong"
    ]
  },
  "Madhya Pradesh": {
    Indore: [
      "Vijay Nagar",
      "Palasia",
      "AB Road",
      "Bhawarkua",
      "Saket",
      "Super Corridor"
    ],
    Bhopal: [
      "Arera Colony",
      "MP Nagar",
      "Kolar Road",
      "Hoshangabad Road",
      "Shahpura"
    ],
    Gwalior: [
      "City Centre",
      "Lashkar",
      "Morar",
      "Thatipur"
    ],
    Jabalpur: [
      "Civil Lines",
      "Wright Town",
      "Napier Town",
      "Vijay Nagar"
    ]
  },
  Punjab: {
    Ludhiana: [
      "Model Town",
      "Sarabha Nagar",
      "Ferozepur Road",
      "BRS Nagar",
      "Civil Lines"
    ],
    Amritsar: [
      "Ranjit Avenue",
      "Mall Road",
      "Green Avenue",
      "Lawrence Road"
    ],
    "SAS Nagar (Mohali)": [
      "Phase 1-11",
      "Sector 68-71",
      "Sector 82 (Aerocity)",
      "Kharar"
    ],
    Jalandhar: [
      "Model Town",
      "Civil Lines",
      "Urban Estate Phase 1-2",
      "Cantt Road"
    ]
  },
  Haryana: {
    Gurugram: [
      "DLF Phase 1-5",
      "Golf Course Road",
      "Sohna Road",
      "Sector 56-57",
      "Cyber City",
      "Palam Vihar",
      "South City"
    ],
    Faridabad: [
      "Sector 14-16",
      "Greenfield",
      "Neharpar (Greater Faridabad)",
      "NIT 1-5"
    ],
    Panchkula: [
      "Sector 1-21",
      "MDC Sector 4-6",
      "Pinjore"
    ]
  },
  Bihar: {
    Patna: [
      "Boring Road",
      "Kankarbagh",
      "Bailey Road",
      "Rajendra Nagar",
      "Patliputra Colony",
      "Ashiana Nagar"
    ],
    Gaya: [
      "Civil Lines",
      "AP Colony",
      "Rampur",
      "Bodh Gaya"
    ],
    Muzaffarpur: [
      "Mithanpura",
      "Kalyani",
      "Brahmpura",
      "Ahiyapur"
    ]
  },
  Odisha: {
    Khordha: [
      "Bhubaneswar (Saheed Nagar)",
      "Bhubaneswar (Patia)",
      "Bhubaneswar (Jayadev Vihar)",
      "Bhubaneswar (Nayapalli)",
      "Bhubaneswar (Khandagiri)"
    ],
    Cuttack: [
      "CDA Sector 1-11",
      "Badambadi",
      "Link Road",
      "Buxi Bazaar"
    ]
  },
  Jharkhand: {
    Ranchi: [
      "Lalpur",
      "Doranda",
      "Harmu Housing Colony",
      "Morabadi",
      "Ashok Nagar",
      "Kanke Road"
    ],
    "East Singhbhum": [
      "Jamshedpur (Bistupur)",
      "Jamshedpur (Sakchi)",
      "Jamshedpur (Kadma)",
      "Jamshedpur (Sonari)",
      "Telco Colony"
    ],
    Dhanbad: [
      "Bank More",
      "Saraidhela",
      "Hirapur",
      "Steel Gate"
    ]
  },
  Assam: {
    "Kamrup Metropolitan": [
      "Guwahati (GS Road)",
      "Guwahati (Dispur)",
      "Guwahati (Zoo Road)",
      "Guwahati (Ulubari)",
      "Guwahati (Beltola)",
      "Guwahati (Jalukbari)"
    ],
    Dibrugarh: [
      "Chowkidinghee",
      "Amolapatty",
      "Thana Chariali"
    ]
  },
  Uttarakhand: {
    Dehradun: [
      "Rajpur Road",
      "Jakhan",
      "Dalanwala",
      "Vasant Vihar",
      "Sahastradhara Road",
      "Clement Town"
    ],
    Haridwar: [
      "Ranipur More",
      "Jwalapur",
      "Kankhal",
      "Shivalik Nagar"
    ],
    Nainital: [
      "Haldwani (Kaladhungi Road)",
      "Haldwani (Nainital Road)",
      "Kathgodam",
      "Mallital"
    ]
  },
  "Himachal Pradesh": {
    Shimla: [
      "Mall Road",
      "Sanjauli",
      "Chotta Shimla",
      "Kasumpti",
      "New Shimla"
    ],
    Kangra: [
      "Dharamshala",
      "McLeodGanj",
      "Palampur",
      "Kangra Town"
    ],
    Kullu: [
      "Manali Town",
      "Old Manali",
      "Kullu Town"
    ]
  },
  Chandigarh: {
    Chandigarh: [
      "Sector 1-10 (North Chandigarh)",
      "Sector 15-22 (Central)",
      "Sector 35-38 (South)",
      "Sector 43-46",
      "Manimajra / IT Park"
    ]
  },
  Puducherry: {
    Puducherry: [
      "White Town (French Quarter)",
      "Heritage Town",
      "Lawspet",
      "Auroville Area",
      "Muthialpet"
    ]
  },
  "Jammu and Kashmir": {
    Srinagar: [
      "Rajbagh",
      "Lal Chowk",
      "Hyderpora",
      "Sanat Nagar",
      "Bemina"
    ],
    Jammu: [
      "Gandhi Nagar",
      "Channi Himmat",
      "Trikuta Nagar",
      "Bahu Plaza",
      "Janipur"
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

  // All Karnataka Districts
  "575001": { state: "Karnataka", district: "Dakshina Kannada", taluk: "Mangaluru City", city: "Mangaluru" },
  "576101": { state: "Karnataka", district: "Udupi", taluk: "Udupi", city: "Udupi" },
  "576104": { state: "Karnataka", district: "Udupi", taluk: "Manipal", city: "Manipal" },
  "580001": { state: "Karnataka", district: "Dharwad", taluk: "Dharwad", city: "Dharwad" },
  "580020": { state: "Karnataka", district: "Dharwad", taluk: "Hubballi Urban", city: "Hubballi" },
  "590001": { state: "Karnataka", district: "Belagavi", taluk: "Belagavi City", city: "Belagavi" },
  "583101": { state: "Karnataka", district: "Ballari", taluk: "Ballari City", city: "Ballari" },
  "585101": { state: "Karnataka", district: "Kalaburagi (Gulbarga)", taluk: "Kalaburagi City", city: "Kalaburagi" },
  "577001": { state: "Karnataka", district: "Davanagere", taluk: "Davanagere City", city: "Davanagere" },
  "577201": { state: "Karnataka", district: "Shivamogga (Shimoga)", taluk: "Shivamogga City", city: "Shivamogga" },
  "572101": { state: "Karnataka", district: "Tumakuru (Tumkur)", taluk: "Tumakuru City", city: "Tumakuru" },
  "586101": { state: "Karnataka", district: "Vijayapura (Bijapur)", taluk: "Vijayapura City", city: "Vijayapura" },
  "587101": { state: "Karnataka", district: "Bagalkote", taluk: "Bagalkote", city: "Bagalkote" },
  "573201": { state: "Karnataka", district: "Hassan", taluk: "Hassan", city: "Hassan" },
  "584101": { state: "Karnataka", district: "Raichur", taluk: "Raichur", city: "Raichur" },
  "583201": { state: "Karnataka", district: "Vijayanagara", taluk: "Hosapete", city: "Hosapete" },
  "571201": { state: "Karnataka", district: "Kodagu (Coorg)", taluk: "Madikeri", city: "Madikeri" },
  "581301": { state: "Karnataka", district: "Uttara Kannada (Karwar)", taluk: "Karwar", city: "Karwar" },
  "571401": { state: "Karnataka", district: "Mandya", taluk: "Mandya", city: "Mandya" },
  "563101": { state: "Karnataka", district: "Kolar", taluk: "Kolar", city: "Kolar" },
  "562159": { state: "Karnataka", district: "Ramanagara", taluk: "Ramanagara", city: "Ramanagara" },
  "561207": { state: "Karnataka", district: "Chikkaballapura", taluk: "Chikkaballapura", city: "Chikkaballapura" },
  "577101": { state: "Karnataka", district: "Chikkamagaluru", taluk: "Chikkamagaluru", city: "Chikkamagaluru" },
  "577501": { state: "Karnataka", district: "Chitradurga", taluk: "Chitradurga", city: "Chitradurga" },
  "582101": { state: "Karnataka", district: "Gadag", taluk: "Gadag-Betageri", city: "Gadag" },
  "581110": { state: "Karnataka", district: "Haveri", taluk: "Haveri", city: "Haveri" },
  "583227": { state: "Karnataka", district: "Koppal", taluk: "Koppal", city: "Koppal" },
  "585202": { state: "Karnataka", district: "Yadgir", taluk: "Yadgir", city: "Yadgir" },
  "585401": { state: "Karnataka", district: "Bidar", taluk: "Bidar", city: "Bidar" },
  "571313": { state: "Karnataka", district: "Chamarajanagar", taluk: "Chamarajanagar", city: "Chamarajanagar" },

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
