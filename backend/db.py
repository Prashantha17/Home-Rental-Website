import os
import logging
from pymongo import MongoClient
import bcrypt

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
from config import config

MONGO_URI = config.MONGO_URI
DB_NAME = config.DB_NAME

try:
    # High performance connection pool configuration for sub-millisecond connection reuse
    client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=8000,
        maxPoolSize=50,
        minPoolSize=5,
        maxIdleTimeMS=45000,
        connectTimeoutMS=8000,
        socketTimeoutMS=8000
    )

    db = client[DB_NAME]
    # Ping database to trigger connection verification
    client.admin.command('ping')
    logger.info("Connected to MongoDB at %s successfully with optimized connection pool.", MONGO_URI)
except Exception as e:
    logger.error("Could not connect to MongoDB. Make sure MongoDB service is running. Error: %s", e)
    raise e

# Collections
users_col = db["users"]
properties_col = db["properties"]
requests_col = db["requests"]
otps_col = db["otps"]
messages_col = db["messages"]
reviews_col = db["reviews"]
payments_col = db["payments"]
agreements_col = db["agreements"]
receipts_col = db["receipts"]
email_otps_col = db["email_otps"]

# Initialize database, indexes and seed default admin/properties
def init_db():
    try:
        # Create optimized B-Tree and Compound Indexes for O(log N) / O(1) query lookups
        users_col.create_index("username", unique=True)
        users_col.create_index("email", unique=True)
        users_col.create_index("phone")
        users_col.create_index("role")

        # TTL Index: Automatically purges expired OTPs with zero space overhead O(1)
        otps_col.create_index("phone", unique=True)
        otps_col.create_index("expires_at", expireAfterSeconds=0)

        # Properties Indexes: High-Scale Filtering by Status, Hierarchy, Pincode, Rent, Vibe
        properties_col.create_index([("status", 1), ("city", 1), ("rent", 1)])
        properties_col.create_index([("city", 1), ("area", 1)])
        properties_col.create_index("pincode")
        properties_col.create_index([("status", 1), ("pincode", 1)])
        properties_col.create_index([("status", 1), ("state", 1), ("district", 1), ("taluk", 1)])
        properties_col.create_index([("status", 1), ("houseType", 1)])
        properties_col.create_index([("status", 1), ("created_at", -1)])
        properties_col.create_index("vibe_tags")
        properties_col.create_index("owner_id")
        properties_col.create_index("owner_name")

        # Requests Indexes: Sub-millisecond lookups for tenant/owner dashboards
        requests_col.create_index("tenant_id")
        requests_col.create_index("owner_id")
        requests_col.create_index("property_id")
        requests_col.create_index([("tenant_id", 1), ("property_id", 1)])

        # Messages Indexes: Fast chat thread fetching and instant unread updates
        messages_col.create_index([("sender", 1), ("receiver", 1), ("timestamp", 1)])
        messages_col.create_index([("receiver", 1), ("sender", 1), ("timestamp", 1)])
        messages_col.create_index([("receiver", 1), ("read", 1)])
        messages_col.create_index([("sender", 1), ("timestamp", -1)])
        messages_col.create_index([("receiver", 1), ("timestamp", -1)])

        # Reviews Indexes
        reviews_col.create_index([("property_id", 1), ("timestamp", -1)])

        # Payments Indexes
        payments_col.create_index("request_id")
        payments_col.create_index("tenant_id")
        payments_col.create_index("owner_id")

        # Legal Rental Agreements & HRA Receipts Indexes
        agreements_col.create_index("tenant_id")
        agreements_col.create_index("owner_id")
        agreements_col.create_index("property_id")
        receipts_col.create_index("tenant_id")
        receipts_col.create_index("owner_id")

        # Email OTPs TTL index (auto purges expired verification codes)
        email_otps_col.create_index("email")
        email_otps_col.create_index("expires_at", expireAfterSeconds=0)

        # Seed default Admin if not exists (env-configurable for production security)
        if users_col.count_documents({"role": "admin"}) == 0:
            raw_admin_pwd = os.getenv("ADMIN_INITIAL_PASSWORD", "admin123")
            admin_pwd = raw_admin_pwd.encode('utf-8')
            hashed_pwd = bcrypt.hashpw(admin_pwd, bcrypt.gensalt()).decode('utf-8')
            admin_user = {
                "username": "admin",
                "email": "admin@nammamane.com",
                "password_hash": hashed_pwd,
                "phone": "+919999999999",
                "aadhaar": "0000-0000-0000",
                "role": "admin",
                "is_active": True,
                "is_verified": True
            }
            users_col.insert_one(admin_user)
            logger.info("Seeded default admin user: admin")

        # Seed default Owner if not exists
        if users_col.count_documents({"username": "owner_priya"}) == 0:
            owner_pwd = b"owner123"
            hashed_pwd = bcrypt.hashpw(owner_pwd, bcrypt.gensalt()).decode('utf-8')
            owner_user = {
                "username": "owner_priya",
                "email": "priya@example.com",
                "password_hash": hashed_pwd,
                "phone": "+919876501234",
                "aadhaar": "1234-5678-9012",
                "role": "owner",
                "is_active": True,
                "is_verified": True
            }
            users_col.insert_one(owner_user)
            logger.info("Seeded default owner user: owner_priya / owner123")

        # Seed default Tenant if not exists
        if users_col.count_documents({"username": "tenant_rahul"}) == 0:
            tenant_pwd = b"tenant123"
            hashed_pwd = bcrypt.hashpw(tenant_pwd, bcrypt.gensalt()).decode('utf-8')
            tenant_user = {
                "username": "tenant_rahul",
                "email": "rahul@example.com",
                "password_hash": hashed_pwd,
                "phone": "+919876543210",
                "aadhaar": "9876-5432-1098",
                "role": "user",
                "is_active": True,
                "is_verified": True
            }
            users_col.insert_one(tenant_user)
            logger.info("Seeded default tenant user: tenant_rahul / tenant123")

        # Seed initial listings if empty
        if properties_col.count_documents({}) == 0:
            owner = users_col.find_one({"username": "owner_priya"})
            owner_id = str(owner["_id"]) if owner else "default_owner_id"

            mock_properties = [
                {
                    "title": "2BHK Family Flat",
                    "city": "Bengaluru",
                    "area": "BTM Layout",
                    "address": "45, 7th Cross, BTM 2nd Stage, Bengaluru",
                    "rent": 18000,
                    "deposit": 60000,
                    "rooms": 2,
                    "houseType": "2BHK",
                    "facilities": ["Car Parking", "24x7 Water Supply", "Elevator", "Power Backup"],
                    "rules": ["Families only", "No smoking", "Pets allowed"],
                    "locationLink": "https://maps.google.com/?q=BTM+Layout+Bengaluru",
                    "imgUrl": "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&dpr=2&w=600",
                    "additionalImages": [
                        "https://images.pexels.com/photos/2029667/pexels-photo-2029667.jpeg?auto=compress&dpr=2&w=600",
                        "https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg?auto=compress&dpr=2&w=600"
                    ],
                    "upiId": "priya@okhdfcbank",
                    "bankAccountName": "Priya K",
                    "bankAccountNumber": "987654321012",
                    "bankIfscCode": "HDFC0001234",
                    "owner_id": owner_id,
                    "owner_name": "Priya K",
                    "owner_phone": "+919876501234",
                    "status": "Approved"
                },
                {
                    "title": "1RK for Bachelor",
                    "city": "Mysuru",
                    "area": "VV Mohalla",
                    "address": "12, Temple Road, VV Mohalla, Mysuru",
                    "rent": 9000,
                    "deposit": 30000,
                    "rooms": 1,
                    "houseType": "1RK",
                    "facilities": ["Bike Parking", "Geyser", "WiFi"],
                    "rules": ["Bachelors only", "No loud music after 10 PM"],
                    "locationLink": "https://maps.google.com/?q=VV+Mohalla+Mysuru",
                    "imgUrl": "https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&dpr=2&w=600",
                    "additionalImages": [
                        "https://images.pexels.com/photos/2631746/pexels-photo-2631746.jpeg?auto=compress&dpr=2&w=600"
                    ],
                    "upiId": "priya@okhdfcbank",
                    "bankAccountName": "Priya K",
                    "bankAccountNumber": "987654321012",
                    "bankIfscCode": "HDFC0001234",
                    "owner_id": owner_id,
                    "owner_name": "Priya K",
                    "owner_phone": "+919876501234",
                    "status": "Pending"
                }
            ]
            properties_col.insert_many(mock_properties)
            logger.info("Seeded initial property listings")

    except Exception as e:
        logger.error("Error initializing collections: %s", e)

# Run initialization
init_db()
