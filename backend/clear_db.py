import sys
import os
from pymongo import MongoClient

# Ensure root dir is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from config import config
from auth import hash_password

def clear_all_database():
    print(f"Connecting to MongoDB at: {config.MONGO_URI}")
    client = MongoClient(config.MONGO_URI, serverSelectionTimeoutMS=5000)
    
    try:
        # Ping
        client.admin.command('ping')
        print("Connected to MongoDB successfully.")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return False

    db = client[config.DB_NAME]
    
    collections = db.list_collection_names()
    print(f"Existing collections in '{config.DB_NAME}': {collections}")

    for col_name in collections:
        count = db[col_name].count_documents({})
        db[col_name].drop()
        print(f"  Dropped collection: '{col_name}' ({count} records deleted)")

    print("\nAll collections dropped and database wiped clean.")

    # Re-create default essential seed: Default Admin User
    admin_user = {
        "username": "admin",
        "email": "admin@nammamane.com",
        "phone": "+919876500000",
        "password": hash_password("admin123"),
        "role": "admin",
        "is_active": True,
        "created_at": "2026-01-01T00:00:00"
    }
    db.users.insert_one(admin_user)
    print("\nRe-seeded default Admin Account:")
    print("   Username: admin")
    print("   Password: admin123")
    print("   Role: admin")

    print("\nDatabase is now completely clean and ready to use.")
    return True

if __name__ == "__main__":
    clear_all_database()
