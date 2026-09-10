import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()

mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "rentalapp")

# Mask password for safe console logging
masked_uri = mongo_uri
if "@" in mongo_uri and "://" in mongo_uri:
    prefix, rest = mongo_uri.split("://", 1)
    creds, host = rest.split("@", 1)
    if ":" in creds:
        user, _ = creds.split(":", 1)
        masked_uri = f"{prefix}://{user}:******@{host}"

print(f"Connecting to MongoDB: {masked_uri}")
print(f"Target Database: {db_name}")

try:
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=7000)
    # The ismaster command is cheap and does not require auth.
    client.admin.command("ping")
    print("SUCCESS: Successfully connected to MongoDB Atlas Cloud Cluster!")
    
    db = client[db_name]
    collections = db.list_collection_names()
    print(f"Collections found in '{db_name}': {collections}")
    sys.exit(0)
except Exception as e:
    print(f"\nCONNECTION FAILED:")
    print(f"Error: {e}")
    sys.exit(1)
