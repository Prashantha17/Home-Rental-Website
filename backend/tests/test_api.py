# rent-backend/tests/test_api.py
import sys
import os
import pytest

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from fastapi import HTTPException
from main import app, validate_password_strength, validate_image_file

from auth import hash_password, verify_password, create_access_token, users_col

client = TestClient(app)

def test_password_hashing_and_verification():
    raw_pwd = "StrongPass1!"
    hashed = hash_password(raw_pwd)
    assert hashed != raw_pwd
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_strict_password_validation():
    # 1. Valid passwords (8-12 chars, 1 uppercase, 1 digit, 1 special char)
    valid_passwords = [
        "Namma@2026",
        "Secret#12",
        "A1b2c3d$",
        "Pass_2026",
        "Home!9876",
        "Abcdef1!"
    ]
    for pwd in valid_passwords:
        # Should not raise exception
        validate_password_strength(pwd)

    # 2. Too short (< 8 chars)
    with pytest.raises(HTTPException) as exc_info:
        validate_password_strength("Pass1!")
    assert exc_info.value.status_code == 400
    assert "8 and 12" in exc_info.value.detail

    # 3. Too long (> 12 chars)
    with pytest.raises(HTTPException) as exc_info:
        validate_password_strength("SuperSecret2026!#")
    assert exc_info.value.status_code == 400
    assert "8 and 12" in exc_info.value.detail

    # 4. Missing capital letter
    with pytest.raises(HTTPException) as exc_info:
        validate_password_strength("secret@123")
    assert exc_info.value.status_code == 400
    assert "capital" in exc_info.value.detail.lower()

    # 5. Missing number
    with pytest.raises(HTTPException) as exc_info:
        validate_password_strength("Secret@abc")
    assert exc_info.value.status_code == 400
    assert "number" in exc_info.value.detail.lower()

    # 6. Missing special character
    with pytest.raises(HTTPException) as exc_info:
        validate_password_strength("Secret2026")
    assert exc_info.value.status_code == 400
    assert "special character" in exc_info.value.detail.lower()

def test_get_properties_with_pagination():
    response = client.get("/api/properties?skip=0&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) <= 5
    if len(data) > 0:
        first_prop = data[0]
        assert "title" in first_prop
        assert "rent" in first_prop
        # Payout data must NOT be exposed to public tenants
        assert "bankAccountNumber" not in first_prop

def test_admin_token_and_stats():
    admin_token = create_access_token({"sub": "admin", "role": "admin"})

    stats_res = client.get("/api/admin/stats", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "totalUsers" in stats
    assert "totalProperties" in stats
    assert "pendingRequests" in stats

def test_unauthorized_admin_access():
    res = client.get("/api/admin/stats")
    assert res.status_code == 401

def test_rent_prediction_calculator():
    payload = {
        "city": "Bengaluru",
        "area": "Whitefield",
        "houseType": "2BHK",
        "rooms": 2,
        "facilities": ["Car Parking", "Lift", "WiFi"]
    }
    res = client.post("/api/properties/predict-rent", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "predictedRent" in data
    assert data["predictedRent"] > 0
    assert "predictedDeposit" in data
    assert "rangeMin" in data
    assert "rangeMax" in data

def test_invalid_object_id_returns_404():
    admin_token = create_access_token({"sub": "admin", "role": "admin"})
    res = client.post("/api/properties/approve/invalid_id_format", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert res.status_code == 404

def test_e_rental_agreement_flow():
    user_token = create_access_token({"sub": "tenant_rahul", "role": "user"})
    
    # 1. Create Agreement Draft
    agreement_payload = {
        "property_title": "Modern 2BHK Flat",
        "property_address": "402 Palm Grove, Indiranagar",
        "city": "Bengaluru",
        "landlord_name": "Priya Sharma",
        "landlord_phone": "+919876501234",
        "landlord_pan": "ABCDE1234F",
        "tenant_name": "Rahul Verma",
        "tenant_phone": "+919123456789",
        "tenant_pan": "XYZPQ9876K",
        "monthly_rent": 25000,
        "security_deposit": 75000,
        "maintenance_charges": 2500,
        "tenancy_start_date": "2026-04-01",
        "tenancy_duration_months": 11,
        "lock_in_months": 6,
        "notice_period_days": 30,
        "custom_clauses": ["No commercial activity allowed on premises."]
    }
    create_res = client.post("/api/agreements/create", json=agreement_payload, headers={
        "Authorization": f"Bearer {user_token}"
    })
    assert create_res.status_code == 200
    agreement_data = create_res.json()["agreement"]
    ag_id = agreement_data["id"]
    assert ag_id is not None
    assert agreement_data["status"] == "Draft"

    # 2. Fetch by ID
    get_res = client.get(f"/api/agreements/{ag_id}", headers={
        "Authorization": f"Bearer {user_token}"
    })
    assert get_res.status_code == 200
    assert get_res.json()["property_title"] == "Modern 2BHK Flat"

    # 3. Sign as Tenant
    sign_res = client.post(f"/api/agreements/sign/{ag_id}", json={
        "signature_data": "DIGITALLY_SIGNED:RAHUL VERMA",
        "signee_type": "tenant"
    }, headers={
        "Authorization": f"Bearer {user_token}"
    })
    assert sign_res.status_code == 200
    assert sign_res.json()["agreement"]["status"] == "Pending_Landlord_Signature"

def test_hra_receipts_generation():
    user_token = create_access_token({"sub": "tenant_rahul", "role": "user"})

    receipt_payload = {
        "landlord_name": "Priya Sharma",
        "landlord_pan": "ABCDE1234F",
        "tenant_name": "Rahul Verma",
        "property_address": "402 Palm Grove, Indiranagar",
        "city": "Bengaluru",
        "monthly_rent": 25000,
        "start_month": "2025-04",
        "end_month": "2026-03",
        "payment_mode": "UPI / Bank Transfer"
    }

    res = client.post("/api/receipts/generate", json=receipt_payload, headers={
        "Authorization": f"Bearer {user_token}"
    })
    assert res.status_code == 200
    bundle = res.json()["receipt_bundle"]
    assert bundle["total_months"] == 12
    assert bundle["total_rent_paid"] == 300000
    assert bundle["pan_required"] is True
    assert len(bundle["receipts"]) == 12
    assert bundle["receipts"][0]["receipt_number"].startswith("HRA-")

def test_rental_request_bidirectional_notifications():
    # 1. Fetch available property
    props_res = client.get("/api/properties")
    assert props_res.status_code == 200
    props = props_res.json()
    assert len(props) > 0
    prop_id = props[0]["id"]

    # 2. Tenant creates rental request -> Triggers Owner Notification
    tenant_token = create_access_token({"sub": "tenant_rahul", "role": "user"})
    req_res = client.post("/api/requests/create", json={"property_id": prop_id}, headers={
        "Authorization": f"Bearer {tenant_token}"
    })
    assert req_res.status_code in [200, 400]  # 200 if new, 400 if duplicate already exists

    # 3. Owner accepts request -> Triggers Tenant Notification
    admin_token = create_access_token({"sub": "admin", "role": "admin"})
    owner_reqs_res = client.get("/api/requests/owner", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert owner_reqs_res.status_code == 200
    owner_reqs = owner_reqs_res.json()
    if len(owner_reqs) > 0:
        req_id = owner_reqs[0]["id"]
        accept_res = client.post(f"/api/requests/accept/{req_id}", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert accept_res.status_code == 200

def test_rent_negotiation_flow_and_rejection():
    # Ensure test user exists in db
    if not users_col.find_one({"username": "tenant_negotiator_99"}):
        users_col.insert_one({
            "username": "tenant_negotiator_99",
            "email": "negotiator@example.com",
            "phone": "+919876543210",
            "role": "user",
            "is_active": True
        })

    # 1. Fetch available property
    props_res = client.get("/api/properties")
    props = props_res.json()
    assert len(props) > 0
    prop = props[0]
    
    # 2. Create unique test tenant token
    negotiator_token = create_access_token({"sub": "tenant_negotiator_99", "role": "user"})

    # 3. Submit request with negotiated offer strictly less than listed rent + custom note
    listed_val = float(prop.get("rent", 20000))
    discounted_offer = max(1000.0, listed_val - 2000.0)

    negotiated_payload = {
        "property_id": prop["id"],
        "offered_rent": discounted_offer,
        "message": "Hi, we are looking for a 2-year lease, could you please consider this discounted offer?"
    }
    create_res = client.post("/api/requests/create", json=negotiated_payload, headers={
        "Authorization": f"Bearer {negotiator_token}"
    })
    if create_res.status_code == 200:
        req_data = create_res.json()["request"]
        assert req_data["offered_rent"] == discounted_offer
        assert req_data["is_negotiated"] is True
        assert "2-year lease" in req_data["message"]
        req_id = req_data["id"]

        # 4. Owner rejects the offer
        admin_token = create_access_token({"sub": "admin", "role": "admin"})
        reject_res = client.post(f"/api/requests/reject/{req_id}", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert reject_res.status_code == 200


def test_image_security_and_magic_bytes():
    import io
    from PIL import Image

    # 1. Valid in-memory JPEG
    img = Image.new("RGB", (100, 100), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    valid_bytes = buf.getvalue()

    ext = validate_image_file(valid_bytes, "photo.jpg")
    assert ext == "jpg"

    # 2. Fake image (malicious script disguised with .jpg extension)
    malicious_bytes = b"<?php echo 'malicious payload'; ?>"
    with pytest.raises(HTTPException) as exc_info:
        validate_image_file(malicious_bytes, "exploit.jpg")
    assert exc_info.value.status_code == 400
    assert "Invalid image content" in exc_info.value.detail

    # 3. Disguised text file
    fake_png = b"\x89PNG\r\n\x1a\nCorrupted or fake PNG stream"
    with pytest.raises(HTTPException) as exc_info:
        validate_image_file(fake_png, "fake.png")
    assert exc_info.value.status_code == 400

    # 4. Disallowed extension
    with pytest.raises(HTTPException) as exc_info:
        validate_image_file(valid_bytes, "script.svg")
    assert exc_info.value.status_code == 400


def test_otp_verification_rate_limiting():
    phone = "+919999999999"
    for attempt in range(5):
        client.post("/api/auth/verify-otp", json={"phone": phone, "code": f"12345{attempt}"})

    # 6th attempt should be blocked by rate limiter with 429
    blocked_res = client.post("/api/auth/verify-otp", json={"phone": phone, "code": "999999"})
    assert blocked_res.status_code == 429
    assert "Too many" in blocked_res.json()["detail"]


def test_api_docs_available_in_development():
    # In development mode, OpenAPI docs should be available
    res = client.get("/docs")
    assert res.status_code == 200



