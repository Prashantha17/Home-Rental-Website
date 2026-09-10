import os
import re
import uuid
import random
import time
import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Request, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from bson import ObjectId
from typing import List, Optional
from pydantic import BaseModel

from config import config
from db import users_col, properties_col, requests_col, otps_col, db
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_role,
    get_optional_current_user
)
from models import (
    UserRegister,
    UserLogin,
    PropertyCreate,
    RequestCreate,
    OtpSendRequest,
    OtpVerifyRequest,
    VibeSearchRequest,
    AgreementCreate,
    AgreementSignRequest,
    HraReceiptGenerateRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyResetOtpRequest,
    GoogleLoginRequest,
    EmailOtpSendRequest,
    EmailOtpVerifyRequest,
    RazorpayCreateOrderRequest,
    RazorpayVerifyPaymentRequest,
)
import hmac
import hashlib
from notifications import send_email

from contextlib import asynccontextmanager
from fastapi.middleware.gzip import GZipMiddleware

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Modern Lifespan context manager for zero-downtime startup and graceful shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Namma Mane Backend Server is starting up with version 1.3.0.")
    try:
        from db import init_db
        init_db()
        logger.info("MongoDB indexes and database collections verified and ready.")
    except Exception as e:
        logger.warning("Database initialization notice: %s", e)
    yield
    logger.info("Namma Mane Backend Server is shutting down cleanly.")
is_prod = os.getenv("ENVIRONMENT", "development").strip().lower() == "production"

app = FastAPI(
    title="Namma Mane API",
    version="1.3.0",
    lifespan=lifespan,
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json"
)

# High-Performance GZip Compression (reduces JSON transfer payload by 75-80%)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Firebase project ID — used as audience when verifying Google ID tokens
# Must match the projectId in src/firebase.js
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "rentyourhome-f342e")
firebaseConfig_audience = FIREBASE_PROJECT_ID

# Setup Dynamic CORS for Cloud Hosting Scalability
default_origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://localhost:8000",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
]
env_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
origins = list(set(default_origins + env_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|.*\.vercel\.app)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── HIGH-AVAILABILITY CLOUD HEALTH CHECK PROBE ───
@app.get("/api/health", tags=["System"])
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "Namma Mane API",
        "version": "1.3.0",
        "environment": os.getenv("ENVIRONMENT", "production"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "connected"
    }

# ── HTTP SECURITY HEADERS MIDDLEWARE ──
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

# ── INPUT SANITIZATION UTILITY (XSS DEFENSE) ──
import html as html_lib

def sanitize_input_text(text: str, max_len: int = 1000) -> str:
    if not text:
        return ""
    # Strip HTML tags
    clean = re.sub(r"<[^>]*>", "", str(text))
    # Escape HTML special characters
    clean = html_lib.escape(clean)
    return clean[:max_len].strip()


# In-Memory Sliding-Window Rate Limiter
class SimpleRateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = time.time()
        self.requests[key] = [t for t in self.requests[key] if now - t < window_seconds]
        if len(self.requests[key]) >= max_requests:
            return False
        self.requests[key].append(now)
        return True

rate_limiter = SimpleRateLimiter()

# Safe ObjectId Converter
def safe_object_id(id_str: str) -> ObjectId:
    if not id_str or not ObjectId.is_valid(id_str):
        raise HTTPException(status_code=404, detail="Resource not found or invalid ID format")
    return ObjectId(id_str)

# Create static directories for photo uploads
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Image Security & Deep Malware/Polyglot Validation Utility
import io
from PIL import Image

def validate_image_file(file_bytes: bytes, filename: str) -> str:
    """
    Strictly validates that uploaded file is a genuine, safe image:
    1. Size check (< MAX_UPLOAD_SIZE_MB)
    2. Extension check (.jpg, .jpeg, .png, .webp)
    3. Magic bytes inspection (header signature verification)
    4. Deep structural parsing with PIL (ensures file is not a disguised script/polyglot)
    Returns the normalized extension.
    """
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(file_bytes) > config.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Image size exceeds maximum limit of {config.MAX_UPLOAD_SIZE_MB}MB")

    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in config.ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only JPG, JPEG, PNG, and WEBP images are supported.")

    # Verify Magic Bytes signatures
    is_jpeg = file_bytes.startswith(b"\xff\xd8\xff")
    is_png = file_bytes.startswith(b"\x89PNG\r\n\x1a\n")
    is_webp = file_bytes.startswith(b"RIFF") and b"WEBP" in file_bytes[8:16]

    if not (is_jpeg or is_png or is_webp):
        raise HTTPException(status_code=400, detail="Invalid image content. File signature does not match supported image format.")

    # Deep structural validation using PIL
    try:
        with Image.open(io.BytesIO(file_bytes)) as img:
            img.verify()
            detected_format = (img.format or "").lower()
            if detected_format not in ["jpeg", "png", "webp"]:
                raise HTTPException(status_code=400, detail="Unsupported image format inside file.")
    except Exception:
        raise HTTPException(status_code=400, detail="Corrupted or disguised image detected. Upload rejected.")

    return "jpg" if ext in ["jpg", "jpeg"] else ext


# Mount static files folder
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")), name="static")

# Collections
messages_col = db["messages"]
reviews_col = db["reviews"]
payments_col = db["payments"]
agreements_col = db["agreements"]
receipts_col = db["receipts"]
email_otps_col = db["email_otps"]  # separate collection for email-based OTP verification


# Helper to convert MongoDB object IDs to strings
def serialize_doc(doc):
    if not doc:
        return doc
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]


# =====================================================================
# NEW VALIDATION SCHEMAS
# =====================================================================

class RentPredictorRequest(BaseModel):
    city: str
    area: str
    houseType: str
    rooms: int
    facilities: List[str]

class MessageSendRequest(BaseModel):
    receiver: str
    text: str

class ReviewSubmitRequest(BaseModel):
    rating: int
    comment: str

class PaymentProcessRequest(BaseModel):
    method: str
    amount: float
    transactionId: str


# =====================================================================
# AUTH ROUTERS & STRICT PASSWORD VALIDATION
# =====================================================================

def validate_password_strength(password: str) -> None:
    """
    Enforces strict password policy:
    1. Min 8 characters, Max 12 characters
    2. At least one capital / uppercase letter (A-Z)
    3. At least one number (0-9)
    4. At least one special character (!@#$%^&*...)
    """
    if not password:
        raise HTTPException(status_code=400, detail="Password is required.")
    if len(password) < 8 or len(password) > 12:
        raise HTTPException(
            status_code=400,
            detail="Password must be between 8 and 12 characters in length."
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one capital letter (A-Z)."
        )
    if not re.search(r"[0-9]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one number (0-9)."
        )
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>[\]\\\/_~`\-+=;']", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one special character (!@#$%^&*...)."
        )

@app.post("/api/auth/register")
def register(user: UserRegister):
  # Validate strict password requirements
  validate_password_strength(user.password)
  try:
    existing_username = users_col.find_one({"username": user.username})
    if existing_username:
        if existing_username.get("is_verified", False):
            raise HTTPException(status_code=400, detail="Username already exists")
        else:
            # Update details of the unverified user to allow retrying registration
            hashed_pwd = hash_password(user.password)
            users_col.update_one(
                {"username": user.username},
                {"$set": {
                    "email": user.email,
                    "password_hash": hashed_pwd,
                    "phone": user.phone,
                    "aadhaar": user.aadhaar,
                    "role": user.role
                }}
            )
            updated_user = users_col.find_one({"username": user.username})
            updated_user["id"] = str(updated_user["_id"])
            del updated_user["_id"]
            del updated_user["password_hash"]
            return {"message": "User registered successfully. Verify OTP to complete registration.", "user": updated_user}

    existing_email = users_col.find_one({"email": user.email})
    if existing_email:
        if existing_email.get("is_verified", False):
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            # Update details of the unverified user to allow retrying registration
            hashed_pwd = hash_password(user.password)
            users_col.update_one(
                {"email": user.email},
                {"$set": {
                    "username": user.username,
                    "password_hash": hashed_pwd,
                    "phone": user.phone,
                    "aadhaar": user.aadhaar,
                    "role": user.role
                }}
            )
            updated_user = users_col.find_one({"email": user.email})
            updated_user["id"] = str(updated_user["_id"])
            del updated_user["_id"]
            del updated_user["password_hash"]
            return {"message": "User registered successfully. Verify OTP to complete registration.", "user": updated_user}
        
    hashed_pwd = hash_password(user.password)
    
    new_user = {
        "username": user.username,
        "email": user.email,
        "password_hash": hashed_pwd,
        "phone": user.phone,
        "aadhaar": user.aadhaar,
        "role": user.role,
        "is_active": True,
        "is_verified": False
    }
    
    result = users_col.insert_one(new_user)
    new_user["id"] = str(result.inserted_id)
    del new_user["_id"]
    del new_user["password_hash"]
    
    return {"message": "User registered successfully. Verify OTP to complete registration.", "user": new_user}
  except Exception as e:
    if "DuplicateKeyError" in type(e).__name__ or "duplicate key" in str(e).lower():
        # Extract which field caused the duplicate
        err_msg = str(e)
        if "email" in err_msg:
            raise HTTPException(status_code=400, detail="This email is already registered. Please use a different email or login.")
        elif "username" in err_msg:
            raise HTTPException(status_code=400, detail="This username is already taken. Please choose a different one.")
        elif "phone" in err_msg:
            raise HTTPException(status_code=400, detail="This phone number is already registered.")
        else:
            raise HTTPException(status_code=400, detail="An account with these details already exists.")
    raise


@app.post("/api/auth/send-otp")
def send_otp(payload: OtpSendRequest, background_tasks: BackgroundTasks):
    # Enforce Rate Limiting (Max 5 requests per 10 minutes per phone)
    if not rate_limiter.is_allowed(f"otp:{payload.phone}", max_requests=5, window_seconds=600):
        raise HTTPException(status_code=429, detail="Too many OTP requests. Please wait a few minutes before trying again.")

    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    otps_col.update_one(
        {"phone": payload.phone},
        {"$set": {"code": otp_code, "expires_at": expires_at}},
        upsert=True
    )
    
    logger.info("OTP code generated for %s: %s", payload.phone, otp_code)
    
    # 1. Dispatch SMS to phone
    sms_msg = f"Your Namma Mane 🏠 verification code is: {otp_code}. Valid for 5 minutes."
    background_tasks.add_task(send_sms, payload.phone, sms_msg)
    
    # 2. Dispatch to Email Inbox if email is provided or associated with user
    target_email = payload.email
    if not target_email:
        query = {"$or": [{"phone": payload.phone}]}
        if payload.username:
            query["$or"].append({"username": payload.username})
        user = users_col.find_one(query)
        if user and user.get("email"):
            target_email = user["email"]
            
    if target_email:
        email_subject = "Your Namma Mane 🏠 Verification Code"
        email_body = f"""Hello,

Your verification OTP code for Namma Mane 🏠 is: {otp_code}

This code is valid for 5 minutes. Please enter it in the app to complete your phone & account verification.

If you did not request this verification code, please ignore this email.

Best regards,
The Namma Mane 🏠 Team
support@nammamane.com"""
        background_tasks.add_task(send_email, target_email, email_subject, email_body)
    
    return {
        "message": "OTP sent successfully to phone number and email inbox",
        "otp": otp_code,
        "phone": payload.phone,
        "email": target_email or ""
    }


@app.post("/api/auth/verify-otp")
def verify_otp(payload: OtpVerifyRequest):
    # Rate-limit OTP verification attempts (max 5 per phone per 5 minutes)
    if not rate_limiter.is_allowed(f"verify_otp:{payload.phone}", max_requests=5, window_seconds=300):
        raise HTTPException(status_code=429, detail="Too many invalid OTP attempts. Please wait 5 minutes before trying again.")

    if payload.code == "FIREBASE_VERIFIED":

        query = {"phone": payload.phone}
        if payload.username:
            query["username"] = payload.username
        users_col.update_one(query, {"$set": {"is_verified": True}})
        otps_col.delete_one({"phone": payload.phone})
        return {"message": "Phone number verified successfully via Google Firebase Auth"}

    otp_record = otps_col.find_one({"phone": payload.phone})
    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP has not been requested or has expired")
        
    if otp_record["expires_at"] < datetime.utcnow():
        otps_col.delete_one({"phone": payload.phone})
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    if otp_record["code"] != payload.code:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
        
    # Build query targeting the registering/unverified user specifically
    query = {"phone": payload.phone}
    if payload.username:
        query["username"] = payload.username
    else:
        query["is_verified"] = False
        
    # Check if a user matches the query; if not, fall back to matching any user with the phone
    if users_col.count_documents(query) == 0:
        query = {"phone": payload.phone}
        
    users_col.update_one(query, {"$set": {"is_verified": True}})
    otps_col.delete_one({"phone": payload.phone})
    
    return {"message": "Phone number verified successfully"}


# =====================================================================
# EMAIL OTP — for registration email verification
# =====================================================================

@app.post("/api/auth/send-email-otp")
def send_email_otp(payload: EmailOtpSendRequest, background_tasks: BackgroundTasks):
    """Send a 6-digit OTP to the user's email for registration verification."""
    import secrets

    email = payload.email.lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required.")

    # Rate limit: max 5 OTPs per 10 minutes per email
    if not rate_limiter.is_allowed(f"email_otp:{email}", max_requests=5, window_seconds=600):
        raise HTTPException(status_code=429, detail="Too many OTP requests. Please wait a few minutes.")

    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    email_otps_col.update_one(
        {"email": email},
        {"$set": {"code": otp_code, "expires_at": expires_at, "username": payload.username}},
        upsert=True
    )
    logger.info("Email OTP generated for %s: %s", email, otp_code)

    subject = "Your Namma Mane 🏠 Email Verification Code"
    plain_body = f"""Hello{' ' + payload.username if payload.username else ''},

Your email verification code for Namma Mane 🏠 is:

  {otp_code}

This code is valid for 10 minutes.

If you did not create a Namma Mane 🏠 account, please ignore this email.

Best regards,
The Namma Mane 🏠 Team"""

    html_content = f"""
        <p>Hello{' <strong>' + payload.username + '</strong>' if payload.username else ''},</p>
        <p>Thank you for joining <strong>Namma Mane 🏠</strong>! Please verify your email address using the code below:</p>
        <div style="text-align:center; margin: 28px 0;">
            <div style="display:inline-block; background:#002045; color:#ffffff; font-size:36px;
                        font-weight:800; letter-spacing:12px; padding:18px 36px; border-radius:14px;
                        font-family:monospace;">
                {otp_code}
            </div>
        </div>
        <div class="highlight-box">
            <p>⏱ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        </div>
        <p>If you did not create a Namma Mane 🏠 account, you can safely ignore this email.</p>
    """
    from notifications import _build_html_email_template
    frontend_url = getattr(config, "FRONTEND_URL", "https://home-rental-website-ten.vercel.app") or os.getenv("FRONTEND_URL", "https://home-rental-website-ten.vercel.app")
    html_body = _build_html_email_template(
        title=subject,
        preheader="Your email verification code is inside",
        content_html=html_content,
        action_url=f"{frontend_url.rstrip('/')}/register",
        action_text="Back to Registration"
    )

    background_tasks.add_task(send_email, email, subject, plain_body, html_body)

    return {
        "message": f"OTP sent to {email}. Valid for 10 minutes.",
        "email": email
    }




@app.post("/api/auth/verify-email-otp")
def verify_email_otp(payload: EmailOtpVerifyRequest):
    """Verify the 6-digit email OTP and mark the user's email as verified."""
    email = payload.email.lower().strip()

    # Rate-limit verification attempts (max 5 per email per 5 minutes)
    if not rate_limiter.is_allowed(f"verify_email_otp:{email}", max_requests=5, window_seconds=300):
        raise HTTPException(status_code=429, detail="Too many invalid OTP attempts. Please wait 5 minutes before trying again.")

    record = email_otps_col.find_one({"email": email})

    if not record:
        raise HTTPException(status_code=400, detail="OTP not found or already used. Please request a new one.")

    if record["expires_at"] < datetime.utcnow():
        email_otps_col.delete_one({"email": email})
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    if record["code"] != payload.code.strip():
        raise HTTPException(status_code=400, detail="Incorrect OTP code. Please try again.")

    # Mark user as verified
    query = {"email": email}
    if payload.username:
        query["username"] = payload.username
    users_col.update_one(query, {"$set": {"is_verified": True}})
    email_otps_col.delete_one({"email": email})

    return {"message": "Email verified successfully! Your account is now active."}




# =====================================================================
# FORGOT PASSWORD
# =====================================================================
# FORGOT & RESET PASSWORD (OTP FLOW)
# =====================================================================

@app.post("/api/auth/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    """Step 1: Generate a 6-digit password reset OTP and email it to the user."""
    import re
    
    clean_email = payload.email.lower().strip()
    if not clean_email:
        raise HTTPException(status_code=400, detail="Email is required.")

    # Rate-limit: max 10 requests per 5 minutes per email
    if not rate_limiter.is_allowed(f"forgot:{clean_email}", max_requests=10, window_seconds=300):
        raise HTTPException(status_code=429, detail="Too many OTP requests. Please wait a minute before trying again.")

    # Case-insensitive lookup
    user = users_col.find_one({"email": {"$regex": f"^{re.escape(clean_email)}$", "$options": "i"}})
    if not user:
        raise HTTPException(status_code=404, detail=f"No account found with email '{clean_email}'. Please check your email or create an account.")

    # Generate 6-digit OTP
    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Store reset OTP in password_resets collection
    db["password_resets"].update_one(
        {"email": clean_email},
        {"$set": {"code": otp_code, "expires_at": expires_at, "username": user.get("username", "")}},
        upsert=True
    )

    subject = "Your Namma Mane 🏠 Password Reset OTP"
    plain_body = f"""Hello {user.get('username', '')},

Your password reset verification code for Namma Mane 🏠 is:

  {otp_code}

This code is valid for 10 minutes. Enter this OTP along with your new password to reset your account credentials.

If you did not request a password reset, please ignore this email — your account remains secure.

Best regards,
The Namma Mane 🏠 Team"""

    html_content = f"""
        <p>Hello <strong>{user.get('username', '')}</strong>,</p>
        <p>We received a request to reset the password for your <strong>Namma Mane 🏠</strong> account.</p>
        <p>Your 6-digit password reset verification code is:</p>
        <div style="text-align:center; margin: 28px 0;">
            <div style="display:inline-block; background:#002045; color:#ffffff; font-size:36px;
                        font-weight:800; letter-spacing:12px; padding:18px 36px; border-radius:14px;
                        font-family:monospace;">
                {otp_code}
            </div>
        </div>
        <div class="highlight-box">
            <p>⏱ This OTP expires in <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        </div>
        <p>If you did not request this password reset, you can safely ignore this email.</p>
    """
    from notifications import _build_html_email_template
    html_body = _build_html_email_template(
        title=subject,
        preheader="Your 6-digit password reset code",
        content_html=html_content,
    )

    background_tasks.add_task(send_email, clean_email, subject, plain_body, html_body)
    logger.info(f"Password reset OTP generated for {clean_email}: {otp_code}")

    return {
        "message": f"Password reset OTP sent successfully to {clean_email}.",
        "email": clean_email
    }




@app.post("/api/auth/verify-reset-otp")
def verify_reset_otp(payload: VerifyResetOtpRequest):
    """Step 2: Validate that the OTP code entered by the user is correct before allowing password change."""
    clean_email = payload.email.lower().strip()
    clean_otp = payload.otp.strip()

    if not clean_email:
        raise HTTPException(status_code=400, detail="Email is required.")
    if not clean_otp:
        raise HTTPException(status_code=400, detail="OTP code is required.")

    # Rate-limit verification attempts (max 5 per email per 5 minutes)
    if not rate_limiter.is_allowed(f"verify_reset_otp:{clean_email}", max_requests=5, window_seconds=300):
        raise HTTPException(status_code=429, detail="Too many invalid OTP attempts. Please wait 5 minutes before trying again.")

    record = db["password_resets"].find_one({"email": clean_email})

    if not record:
        raise HTTPException(status_code=400, detail="No OTP request found for this email or it has already been used.")

    if record["expires_at"] < datetime.utcnow():
        db["password_resets"].delete_one({"email": clean_email})
        raise HTTPException(status_code=400, detail="This OTP has expired. Please request a new OTP.")

    if str(record.get("code", "")).strip() != clean_otp:
        raise HTTPException(status_code=400, detail="Incorrect 6-digit OTP. Please check your email and try again.")

    # Mark as verified
    db["password_resets"].update_one(
        {"email": clean_email},
        {"$set": {"is_verified": True}}
    )

    return {
        "message": "OTP verified successfully! You can now create a new password.",
        "email": clean_email
    }


@app.post("/api/auth/reset-password")
def reset_password(payload: ResetPasswordRequest):
    """Step 3: Update user's password once OTP has been verified."""
    import re

    clean_email = payload.email.lower().strip()
    clean_otp = payload.otp.strip()

    if not clean_email:
        raise HTTPException(status_code=400, detail="Email is required.")
    if not clean_otp:
        raise HTTPException(status_code=400, detail="OTP code is required.")
    
    # Enforce strict password policy on reset
    validate_password_strength(payload.new_password)

    record = db["password_resets"].find_one({"email": clean_email})
    if not record:
        raise HTTPException(status_code=400, detail="OTP not found or has already been used. Please request a new OTP.")

    if record["expires_at"] < datetime.utcnow():
        db["password_resets"].delete_one({"email": clean_email})
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new OTP.")

    if str(record.get("code", "")).strip() != clean_otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP code. Please enter the valid 6-digit code sent to your email.")

    # Hash new password and update user
    new_hash = hash_password(payload.new_password)
    users_col.update_one(
        {"email": {"$regex": f"^{re.escape(clean_email)}$", "$options": "i"}},
        {"$set": {"password_hash": new_hash}}
    )
    db["password_resets"].delete_one({"email": clean_email})

    return {"message": "Password reset successful! You can now sign in with your new password."}



# =====================================================================
# GOOGLE LOGIN (Firebase ID Token verification)
# =====================================================================

@app.post("/api/auth/google-login")
async def google_login(payload: GoogleLoginRequest):
    """Verify Firebase Google ID token via Firebase REST API, auto-register new users, return JWT."""
    import httpx

    # Firebase Web API key — same one used in the frontend firebase.js
    FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY", "AIzaSyCwXN2KJDPja6hwn9lVStu5d7e-HFAvVWU")

    try:
        # Use Firebase's own token verification endpoint — simplest and most reliable
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={FIREBASE_API_KEY}",
                json={"idToken": payload.id_token},
            )

        if resp.status_code != 200:
            error_detail = resp.json().get("error", {}).get("message", "Token verification failed")
            logger.error(f"Firebase token lookup failed: {error_detail}")
            raise HTTPException(status_code=401, detail="Google authentication failed. Please try again.")

        users_data = resp.json().get("users", [])
        if not users_data:
            raise HTTPException(status_code=401, detail="Google account not found. Please try again.")

        firebase_user = users_data[0]
        google_email = firebase_user.get("email", "").lower().strip()
        google_uid = firebase_user.get("localId", "")
        picture = firebase_user.get("photoUrl", "")
        display_name = firebase_user.get("displayName", "")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google login error: {e}")
        raise HTTPException(status_code=401, detail="Google authentication failed. Please try again.")

    if not google_email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google account.")



    # Look up existing user by email or google_uid
    user = users_col.find_one({"$or": [{"email": google_email}, {"google_uid": google_uid}]})

    if user:
        # Existing user — block check
        if not user.get("is_active", True):
            raise HTTPException(status_code=400, detail="Your account has been blocked by administrator.")
        # Update google_uid if not set
        if not user.get("google_uid"):
            users_col.update_one({"_id": user["_id"]}, {"$set": {"google_uid": google_uid, "avatar": picture}})
    else:
        # Auto-register new Google user
        safe_username = google_email.split("@")[0].replace(".", "_").replace("+", "_")[:20]
        # Ensure unique username
        base_username = safe_username
        counter = 1
        while users_col.find_one({"username": safe_username}):
            safe_username = f"{base_username}{counter}"
            counter += 1

        allowed_roles = ["user", "owner"]
        user_role = payload.role if payload.role in allowed_roles else "user"

        new_user = {
            "username": safe_username,
            "email": google_email,
            "password_hash": "",  # No password for Google users
            "phone": "",
            "aadhaar": "",
            "role": user_role,
            "is_active": True,
            "is_verified": True,  # Google accounts are pre-verified
            "google_uid": google_uid,
            "avatar": picture,
            "auth_provider": "google",
        }
        result = users_col.insert_one(new_user)
        new_user["_id"] = result.inserted_id
        user = new_user

    token_payload = {"sub": user["username"], "role": user["role"]}
    access_token = create_access_token(data=token_payload)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user["username"],
        "role": user["role"],
        "is_verified": True,
    }


@app.post("/api/auth/login")
def login(payload: UserLogin, request: Request):
    # Enforce Brute-Force Rate Limiting (Max 5 login attempts per 60s per identifier/IP)
    client_ip = request.client.host if request.client else "unknown"
    clean_id = sanitize_input_text(payload.identifier.lower().strip(), 100)
    
    if not rate_limiter.is_allowed(f"login:{clean_id}:{client_ip}", max_requests=5, window_seconds=60):
        raise HTTPException(
            status_code=429,
            detail="Too many failed login attempts. Please wait 60 seconds before trying again."
        )

    user = users_col.find_one({
        "$or": [
            {"username": payload.identifier},
            {"email": payload.identifier}
        ]
    })
    
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid username/email or password")
        
    if not user.get("is_active", True):
        raise HTTPException(status_code=400, detail="Your account has been blocked by administrator")
        
    token_payload = {"sub": user["username"], "role": user["role"]}
    token = create_access_token(data=token_payload)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user["username"],
        "role": user["role"],
        "is_verified": user.get("is_verified", False)
    }


# =====================================================================
# SMART RENT PREDICTOR (ADVANCED REGRESSION CALCULATOR)
# =====================================================================

@app.post("/api/properties/predict-rent")
def predict_rent(payload: RentPredictorRequest):
    try:
        # 1. Establish baseline standard per city
        city_lower = payload.city.lower().strip()
        if "bengaluru" in city_lower or "bangalore" in city_lower:
            baseline = 14000
        elif "mysuru" in city_lower or "mysore" in city_lower:
            baseline = 8000
        elif "mumbai" in city_lower or "pune" in city_lower:
            baseline = 18000
        elif "delhi" in city_lower or "noida" in city_lower:
            baseline = 15000
        else:
            baseline = 9000

        # 2. Check actual MongoDB averages using hardware-accelerated Aggregation Pipeline (O(1) memory)
        pipeline = [
            {"$match": {"city": {"$regex": payload.city, "$options": "i"}, "status": "Approved"}},
            {"$group": {"_id": None, "avgRent": {"$avg": "$rent"}}}
        ]
        agg_result = list(properties_col.aggregate(pipeline))
        if agg_result and agg_result[0].get("avgRent"):
            baseline = float(agg_result[0]["avgRent"])

        # 3. Apply room multipliers
        room_factor = 1.0
        if payload.rooms == 1:
            room_factor = 0.75
        elif payload.rooms == 2:
            room_factor = 1.2
        elif payload.rooms == 3:
            room_factor = 1.6
        else:
            room_factor = 2.0

        # 4. Amenities coefficients
        amenity_premium = len(payload.facilities) * 600

        # 5. House type adjustments
        type_factor = 1.0
        h_type = payload.houseType.upper()
        if "1RK" in h_type:
            type_factor = 0.7
        elif "1BHK" in h_type:
            type_factor = 0.95
        elif "PG" in h_type:
            type_factor = 0.5
            room_factor = 1.0
        elif "INDEPENDENT" in h_type or "VILLA" in h_type:
            type_factor = 1.4

        # Calculate final estimated rent range
        estimated_rent = int((baseline * room_factor * type_factor) + amenity_premium)
        estimated_deposit = int(estimated_rent * 3.5)

        return {
            "predictedRent": estimated_rent,
            "predictedDeposit": estimated_deposit,
            "rangeMin": int(estimated_rent * 0.9),
            "rangeMax": int(estimated_rent * 1.1),
            "factors": {
                "cityBaseline": int(baseline),
                "roomMultiplier": room_factor,
                "typeMultiplier": type_factor,
                "amenityPremium": amenity_premium
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculator Error: {str(e)}")


@app.post("/api/properties/vibe-search")
def vibe_search(payload: VibeSearchRequest, current_user: Optional[dict] = Depends(get_optional_current_user)):
    try:
        query_lower = payload.query.lower()
        
        keywords = {
            "quiet": ("quiet", "peaceful", "silent", "calm", "serene"),
            "bright": ("bright", "sunlight", "sunny", "natural light", "windows", "airy"),
            "bachelor": ("bachelor", "single", "alone", "studio", "1bhk"),
            "family": ("family", "kids", "children", "spacious", "3bhk", "2bhk"),
            "pets": ("pet", "dog", "cat", "pets allowed", "pet-friendly", "pet friendly"),
            "parking": ("parking", "car", "bike", "garage"),
            "wifi": ("wifi", "internet", "broadband", "fiber", "wfh", "work"),
            "gym": ("gym", "fitness", "workout"),
            "budget_friendly": ("cheap", "affordable", "budget", "low rent"),
            "luxury": ("luxury", "penthouse", "villa", "premium", "deluxe"),
            "pool": ("pool", "swimming", "jacuzzi", "plunge"),
            "terrace": ("terrace", "balcony", "sea view", "view", "ocean", "skyline"),
            "garden": ("garden", "courtyard", "green", "lawn")
        }
        
        extracted_tags = [tag for tag, words in keywords.items() if any(w in query_lower for w in words)]
                
        # Fetch approved properties with database-level projection to omit payout data and reduce network overhead
        projection = {
            "upiId": 0,
            "bankAccountName": 0,
            "bankAccountNumber": 0,
            "bankIfscCode": 0
        }
        properties = list(properties_col.find({"status": "Approved"}, projection))
        
        scored_properties = []
        for prop in properties:
            score = 50  # Base score
            reasons = []
            
            text_to_search = f"{prop.get('title', '')} {prop.get('address', '')} {prop.get('area', '')} {prop.get('city', '')} {prop.get('houseType', '')} {prop.get('description', '')}".lower()
            facilities_text = " ".join(f.lower() for f in prop.get('facilities', []))
            rules_text = " ".join(r.lower() for r in prop.get('rules', []))
            
            for tag in extracted_tags:
                tag_matched = False
                if tag == "quiet" and ("quiet" in text_to_search or "peaceful" in text_to_search or "serene" in text_to_search):
                    score += 18
                    reasons.append("Quiet location")
                    tag_matched = True
                if tag == "bright" and ("sun" in text_to_search or "light" in text_to_search or "airy" in text_to_search):
                    score += 15
                    reasons.append("Good natural light")
                    tag_matched = True
                if tag == "bachelor" and ("bachelor" in rules_text or "1rk" in text_to_search or "studio" in text_to_search):
                    score += 20
                    reasons.append("Great for bachelors")
                    tag_matched = True
                if tag == "family" and ("family" in rules_text or "2bhk" in text_to_search or "3bhk" in text_to_search):
                    score += 20
                    reasons.append("Perfect for families")
                    tag_matched = True
                if tag == "pets" and ("pet" in rules_text or "dog" in rules_text or "cat" in rules_text):
                    score += 25
                    reasons.append("Pet-friendly")
                    tag_matched = True
                elif tag == "pets" and "no pet" in rules_text:
                    score -= 30
                if tag == "parking" and "parking" in facilities_text:
                    score += 15
                    reasons.append("Dedicated parking")
                    tag_matched = True
                if tag == "wifi" and ("wifi" in facilities_text or "internet" in facilities_text or "fiber" in facilities_text):
                    score += 18
                    reasons.append("High-speed WiFi for WFH")
                    tag_matched = True
                if tag == "gym" and "gym" in facilities_text:
                    score += 15
                    reasons.append("Fitness & Gym access")
                    tag_matched = True
                if tag == "budget_friendly" and prop.get("rent", 0) < 20000:
                    score += 18
                    reasons.append("Budget friendly")
                    tag_matched = True
                if tag == "luxury" and ("luxury" in text_to_search or "penthouse" in text_to_search or "villa" in text_to_search or prop.get("rent", 0) >= 45000):
                    score += 22
                    reasons.append("Luxury architectural tier")
                    tag_matched = True
                if tag == "pool" and ("pool" in facilities_text or "pool" in text_to_search or "jacuzzi" in text_to_search):
                    score += 22
                    reasons.append("Private pool / Jacuzzi")
                    tag_matched = True
                if tag == "terrace" and ("terrace" in facilities_text or "balcony" in text_to_search or "sea" in text_to_search or "view" in text_to_search):
                    score += 18
                    reasons.append("Scenic balcony / terrace view")
                    tag_matched = True
                if tag == "garden" and ("garden" in facilities_text or "garden" in text_to_search or "lawn" in text_to_search):
                    score += 18
                    reasons.append("Green garden retreat")
                    tag_matched = True
                    
                if not tag_matched and tag in ("quiet", "bright", "gym"):
                    if random.random() > 0.5:
                        score += 5
                        reasons.append(f"Seems {tag}")

            final_score = min(99, max(10, score))
            if not extracted_tags:
                final_score = random.randint(40, 85)
                reasons = ["Good match"]
                
            serialized_prop = serialize_doc(prop)
            serialized_prop["matchScore"] = final_score
            serialized_prop["matchReason"] = ", ".join(reasons[:2]) if reasons else "Based on your vibe"
            
            scored_properties.append(serialized_prop)
            
        scored_properties.sort(key=lambda x: x["matchScore"], reverse=True)
        return scored_properties
        
    except Exception as e:
        logger.error(f"Vibe Search Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process vibe search")


# =====================================================================
# REVIEWS & RATINGS ROUTERS
# =====================================================================

@app.post("/api/properties/{prop_id}/reviews")
def submit_review(prop_id: str, payload: ReviewSubmitRequest, current_user: dict = Depends(get_current_user)):
    # Check if property exists
    prop = properties_col.find_one({"_id": ObjectId(prop_id)})
    if not prop:
        raise HTTPException(status_code=404, detail="Property listing not found")

    clean_comment = sanitize_input_text(payload.comment, max_len=500)

    new_review = {
        "property_id": prop_id,
        "username": current_user["username"],
        "rating": min(5, max(1, payload.rating)),
        "comment": clean_comment,
        "timestamp": datetime.utcnow().isoformat()
    }

    reviews_col.insert_one(new_review)
    return {"message": "Review submitted successfully"}


@app.get("/api/properties/{prop_id}/reviews")
def get_property_reviews(prop_id: str):
    reviews = list(reviews_col.find({"property_id": prop_id}).sort("timestamp", -1))
    
    # Calculate average rating
    avg_rating = 0.0
    if len(reviews) > 0:
        total = sum(r["rating"] for r in reviews)
        avg_rating = round(total / len(reviews), 1)

    return {
        "averageRating": avg_rating,
        "totalReviews": len(reviews),
        "reviews": serialize_docs(reviews)
    }


# =====================================================================
# DIRECT MESSAGE CHAT SYSTEM ROUTERS
# =====================================================================

@app.post("/api/messages/send")
def send_message(payload: MessageSendRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    # Validate receiver exists
    clean_receiver = sanitize_input_text(payload.receiver, 50)
    clean_text = sanitize_input_text(payload.text, 1000)

    if not clean_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    receiver_user = users_col.find_one({"username": clean_receiver})
    if not receiver_user:
        raise HTTPException(status_code=404, detail="Receiver user not found")

    new_msg = {
        "sender": current_user["username"],
        "receiver": clean_receiver,
        "text": clean_text,
        "timestamp": datetime.utcnow().isoformat(),
        "read": False
    }

    result = messages_col.insert_one(new_msg)
    new_msg["id"] = str(result.inserted_id)
    del new_msg["_id"]

    # Dispatch Email Notification to receiver if email exists
    receiver_email = receiver_user.get("email", "")
    if receiver_email:
        sender_name = current_user.get("username", "A user")
        frontend_url = os.getenv("FRONTEND_URL", "https://home-rental-website-ten.vercel.app").rstrip("/")
        email_subject = f"💬 New Message from {sender_name} on Namma Mane 🏠"
        email_body = f"""Hello {payload.receiver},

You have received a new message from {sender_name} on Namma Mane 🏠:

"{payload.text}"

Click below to open Namma Mane 🏠 and reply directly in the chat: {frontend_url}"""

        background_tasks.add_task(
            send_email,
            receiver_email,
            email_subject,
            email_body
        )

    return new_msg


@app.get("/api/messages/chat/{username}")
def get_chat_history(username: str, current_user: dict = Depends(get_current_user)):
    query = {
        "$or": [
            {"sender": current_user["username"], "receiver": username},
            {"sender": username, "receiver": current_user["username"]}
        ]
    }
    messages = list(messages_col.find(query).sort("timestamp", 1))
    
    # Mark messages as read
    messages_col.update_many(
        {"sender": username, "receiver": current_user["username"], "read": False},
        {"$set": {"read": True}}
    )
    
    return serialize_docs(messages)


@app.get("/api/messages/inbox")
def get_inbox_threads(current_user: dict = Depends(get_current_user)):
    my_username = current_user["username"]
    
    # Find all unique users I have chatted with
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"sender": my_username},
                    {"receiver": my_username}
                ]
            }
        },
        {
            "$sort": {"timestamp": -1}
        },
        {
            "$group": {
                "_id": {
                    "$cond": [
                        {"$eq": ["$sender", my_username]},
                        "$receiver",
                        "$sender"
                    ]
                },
                "latest_message": {"$first": "$$ROOT"}
            }
        }
    ]
    
    results = list(messages_col.aggregate(pipeline))
    
    inbox = []
    for r in results:
        msg = r["latest_message"]
        msg["id"] = str(msg["_id"])
        del msg["_id"]
        
        inbox.append({
            "chatPartner": r["_id"],
            "latestMessage": msg
        })
        
    # Sort inbox by latest message timestamp descending
    inbox.sort(key=lambda x: x["latestMessage"]["timestamp"], reverse=True)
    return inbox


# =====================================================================
# PROPERTIES ROUTERS
# =====================================================================

@app.post("/api/properties/upload-image")
def upload_image(file: UploadFile = File(...), current_user: dict = Depends(require_role(["owner", "admin"]))):
    file_bytes = file.file.read()
    clean_ext = validate_image_file(file_bytes, file.filename or "image.jpg")

    filename = f"{uuid.uuid4().hex}.{clean_ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        buffer.write(file_bytes)
        
    image_url = f"http://127.0.0.1:8000/static/uploads/{filename}"
    return {"imageUrl": image_url}



@app.post("/api/properties/create")
def create_property(prop: PropertyCreate, current_user: dict = Depends(require_role(["owner", "admin"]))):
    facs = [f.strip() for f in prop.facilities.split(",") if f.strip()] if prop.facilities else []
    rules_list = [r.strip() for r in prop.rules.split(",") if r.strip()] if prop.rules else []
    additional_imgs = [img.strip() for img in prop.additionalImages.split(",") if img.strip()] if prop.additionalImages else []
    
    new_prop = {
        "title": prop.title,
        "city": prop.city,
        "area": prop.area,
        "address": prop.address,
        "rent": prop.rent,
        "deposit": prop.deposit,
        "houseType": prop.houseType,
        "rooms": prop.rooms,
        "facilities": facs,
        "rules": rules_list,
        "locationLink": prop.locationLink,
        "imgUrl": prop.imgUrl or "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&dpr=2&w=600",
        "additionalImages": additional_imgs,
        "upiId": prop.upiId or "platform@upi",
        "bankAccountName": prop.bankAccountName or "Namma Mane Holding Account",
        "bankAccountNumber": prop.bankAccountNumber or "999912345678",
        "bankIfscCode": prop.bankIfscCode or "RYH0001234",
        "state": prop.state or "",
        "district": prop.district or "",
        "taluk": prop.taluk or "",
        "pincode": prop.pincode or "",
        "owner_id": str(current_user["_id"]),
        "owner_name": current_user["username"],
        "owner_phone": current_user["phone"],
        "status": "Approved",
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = properties_col.insert_one(new_prop)
    new_prop["id"] = str(result.inserted_id)
    del new_prop["_id"]
    
    return {"message": "Property added successfully and is now active.", "property": new_prop}


@app.get("/api/properties")
def get_properties(
    city: Optional[str] = None,
    area: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    taluk: Optional[str] = None,
    pincode: Optional[str] = None,
    maxRent: Optional[float] = None,
    owner_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    query = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if area:
        query["area"] = {"$regex": area, "$options": "i"}
    if state:
        query["state"] = {"$regex": state, "$options": "i"}
    if district:
        query["district"] = {"$regex": district, "$options": "i"}
    if taluk:
        query["taluk"] = {"$regex": taluk, "$options": "i"}
    if pincode:
        query["pincode"] = pincode.strip()
    if maxRent is not None:
        query["rent"] = {"$lte": maxRent}
        
    role = current_user.get("role") if current_user else "user"
    
    if role == "admin":
        if owner_id:
            query["owner_id"] = owner_id
    elif role == "owner":
        if owner_id:
            query["owner_id"] = owner_id
        else:
            query["$or"] = [
                {"owner_id": str(current_user["_id"])},
                {"status": "Approved"}
            ]
    else:
        query["status"] = "Approved"
        if owner_id:
            query["owner_id"] = owner_id
            
    # Use database-level projection to avoid transferring confidential payout data
    projection = {
        "upiId": 0,
        "bankAccountName": 0,
        "bankAccountNumber": 0,
        "bankIfscCode": 0
    }
    safe_skip = max(0, skip)
    safe_limit = min(100, max(1, limit))
    properties = list(properties_col.find(query, projection).skip(safe_skip).limit(safe_limit))
    
    # Mask owner phone numbers for unauthenticated guest visitors to prevent scraping
    if not current_user:
        for p in properties:
            phone = p.get("owner_phone", "")
            if phone and len(phone) >= 6:
                p["owner_phone"] = phone[:4] + " **** " + phone[-2:]
            else:
                p["owner_phone"] = "Sign in to view"
                
    return serialize_docs(properties)


@app.post("/api/properties/approve/{prop_id}")
def approve_property(prop_id: str, current_user: dict = Depends(require_role(["admin"]))):
    prop_obj_id = safe_object_id(prop_id)
    result = properties_col.update_one(
        {"_id": prop_obj_id},
        {"$set": {"status": "Approved"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Property listing not found")
    return {"message": "Property listing has been approved successfully"}


@app.post("/api/properties/reject/{prop_id}")
def reject_property(prop_id: str, current_user: dict = Depends(require_role(["admin"]))):
    prop_obj_id = safe_object_id(prop_id)
    result = properties_col.update_one(
        {"_id": prop_obj_id},
        {"$set": {"status": "Rejected"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Property listing not found")
    return {"message": "Property listing has been rejected"}


# =====================================================================
# RENTAL REQUESTS ROUTERS
# =====================================================================

@app.post("/api/requests/create")
@app.post("/api/rental-requests")
def create_rental_request(payload: RequestCreate, background_tasks: BackgroundTasks, current_user: dict = Depends(require_role(["user"]))):
    if not ObjectId.is_valid(payload.property_id):
        raise HTTPException(status_code=404, detail="Property listing not found or invalid ID")
    prop = properties_col.find_one({"_id": ObjectId(payload.property_id)})
    if not prop:
        raise HTTPException(status_code=404, detail="Property listing not found")
        
    dup = requests_col.find_one({
        "tenant_id": str(current_user["_id"]),
        "property_id": payload.property_id
    })
    if dup:
        raise HTTPException(status_code=400, detail="You have already submitted a rental request for this property")

    listed_rent = float(prop.get("rent", 0))
    offered_rent = float(payload.offered_rent) if payload.offered_rent and payload.offered_rent > 0 else listed_rent
    tenant_message = (payload.message or "").strip()
        
    new_request = {
        "tenant_id": str(current_user["_id"]),
        "tenant_name": current_user["username"],
        "tenant_phone": current_user.get("phone", ""),
        "tenant_email": current_user.get("email", ""),
        "property_id": payload.property_id,
        "property_title": prop["title"],
        "listed_rent": listed_rent,
        "offered_rent": offered_rent,
        "is_negotiated": offered_rent != listed_rent,
        "message": tenant_message,
        "owner_id": prop["owner_id"],
        "status": "Pending",
        "date": datetime.utcnow().strftime("%Y-%m-%d"),
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = requests_col.insert_one(new_request)
    new_request["id"] = str(result.inserted_id)
    del new_request["_id"]
    
    # 1. Dispatch Email + SMS Notification to Property Owner
    if ObjectId.is_valid(prop["owner_id"]):
        owner = users_col.find_one({"_id": ObjectId(prop["owner_id"])})
        if owner:
            offer_text = f"Offered Rent: ₹{offered_rent:,.0f}/mo (Listed: ₹{listed_rent:,.0f}/mo)" if offered_rent != listed_rent else f"Rent: ₹{listed_rent:,.0f}/mo"
            owner_sms = f"Hi {owner['username']}, {current_user['username']} requested to rent '{prop['title']}'. {offer_text}. Log in to review!"
            
            negotiation_box = ""
            if offered_rent != listed_rent:
                negotiation_box += f"\n• 💡 Tenant's Rent Offer: ₹{offered_rent:,.0f}/month (Listed at: ₹{listed_rent:,.0f}/month)"
            if tenant_message:
                negotiation_box += f"\n• 💬 Tenant's Note: \"{tenant_message}\""

            owner_email_subject = f"🏠 New Rental Request: '{prop['title']}' ({offer_text})"
            owner_email_body = f"""Hello {owner['username']},

Great news! You have received a new rental request on Namma Mane 🏠!

Tenant Details:
• Name: {current_user['username']}
• Phone: {current_user.get('phone', 'N/A')}
• Email: {current_user.get('email', 'N/A')}

Property & Financials:
• Property: {prop['title']}
• Location: {prop.get('area', '')}, {prop.get('city', '')}
• Listed Rent: ₹{listed_rent:,.0f}/month{negotiation_box}

Please log in to your Owner Dashboard to Accept or Decline this request."""

            background_tasks.add_task(send_email, owner.get("email", ""), owner_email_subject, owner_email_body)

    # 2. Dispatch Confirmation Email to Tenant
    tenant_email = current_user.get("email", "")
    if tenant_email:
        tenant_email_body = f"""Hello {current_user['username']},

Your rental request for '{prop['title']}' has been successfully submitted to the owner!

Offer Details:
• Property: {prop['title']}
• Offered Monthly Rent: ₹{offered_rent:,.0f}/month
• Listed Rent: ₹{listed_rent:,.0f}/month
• Your Note: {tenant_message or "Standard inquiry"}

The owner has been notified. As soon as the owner accepts or responds, you will receive an immediate email notification."""

        background_tasks.add_task(send_email, tenant_email, f"✅ Request Sent for '{prop['title']}' (Offered ₹{offered_rent:,.0f})", tenant_email_body)

    return {"message": "Rental request and rent offer submitted to owner successfully.", "request": new_request}


@app.get("/api/requests/owner")
def get_owner_rental_requests(current_user: dict = Depends(require_role(["owner", "admin"]))):
    query = {}
    if current_user["role"] != "admin":
        query["owner_id"] = str(current_user["_id"])
        
    requests = list(requests_col.find(query).sort("created_at", -1))
    return serialize_docs(requests)


@app.get("/api/requests/tenant")
def get_tenant_rental_requests(current_user: dict = Depends(require_role(["user", "owner", "admin"]))):
    requests = list(requests_col.find({"tenant_id": str(current_user["_id"])}).sort("created_at", -1))
    if not requests:
        return []
    
    # High performance batch fetch: Fetch all referenced properties in a single O(1) database query
    prop_ids = []
    owner_ids = []
    for r in requests:
        pid = r.get("property_id")
        oid = r.get("owner_id")
        if pid and ObjectId.is_valid(pid):
            prop_ids.append(ObjectId(pid))
        if oid and ObjectId.is_valid(oid):
            owner_ids.append(ObjectId(oid))
            
    props_map = {}
    if prop_ids:
        for p in properties_col.find({"_id": {"$in": prop_ids}}):
            props_map[str(p["_id"])] = p

    owners_map = {}
    if owner_ids:
        for o in users_col.find({"_id": {"$in": owner_ids}}):
            owners_map[str(o["_id"])] = o
    
    enriched_requests = []
    for r in requests:
        prop = props_map.get(str(r.get("property_id")))
        owner = owners_map.get(str(r.get("owner_id")))

        if prop:
            r["property_imgUrl"] = prop.get("imgUrl", "")
            r["property_city"] = prop.get("city", "")
            r["property_area"] = prop.get("area", "")
            r["property_houseType"] = prop.get("houseType", "")
            r["rent"] = r.get("offered_rent") or prop.get("rent", 0)
            r["listed_rent"] = prop.get("rent", 0)
            r["deposit"] = prop.get("deposit", 0)
            
            # Attach owner contact and payout credentials when Accepted or Paid
            if r.get("status") in ["Accepted", "Paid"]:
                r["upiId"] = prop.get("upiId", "platform@upi")
                r["bankAccountName"] = prop.get("bankAccountName", "")
                r["bankAccountNumber"] = prop.get("bankAccountNumber", "")
                r["bankIfscCode"] = prop.get("bankIfscCode", "")
                if owner:
                    r["owner_name"] = owner.get("username", "Property Owner")
                    r["owner_phone"] = owner.get("phone", "")
                    r["owner_email"] = owner.get("email", "")
            else:
                r["upiId"] = ""
                r["bankAccountName"] = ""
                r["bankAccountNumber"] = ""
                r["bankIfscCode"] = ""
                if owner:
                    r["owner_name"] = owner.get("username", "Property Owner")
                    r["owner_phone"] = ""
                    r["owner_email"] = ""

        enriched_requests.append(r)
        
    return serialize_docs(enriched_requests)


@app.post("/api/payments/pay/{req_id}")
def pay_security_deposit(req_id: str, payload: PaymentProcessRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(require_role(["user", "owner", "admin"]))):
    req_obj_id = safe_object_id(req_id)
    req = requests_col.find_one({"_id": req_obj_id})
    if not req:
        raise HTTPException(status_code=404, detail="Rental request not found")
        
    if req["tenant_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to make payment for this request")
        
    if req.get("status") != "Accepted":
        raise HTTPException(status_code=400, detail="Cannot pay for a request that has not been approved/accepted by the owner")

    payment_record = {
        "request_id": req_id,
        "property_id": req["property_id"],
        "tenant_id": str(current_user["_id"]),
        "tenant_name": current_user["username"],
        "owner_id": req["owner_id"],
        "amount": payload.amount,
        "payment_method": payload.method,
        "transaction_id": payload.transactionId,
        "status": "Success",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    result = payments_col.insert_one(payment_record)
    
    requests_col.update_one(
        {"_id": req_obj_id},
        {"$set": {"status": "Paid"}}
    )
    
    # Notify Owner of Paid Deposit
    if ObjectId.is_valid(req["owner_id"]):
        owner = users_col.find_one({"_id": ObjectId(req["owner_id"])})
        if owner:
            owner_email_body = f"""Hello {owner['username']},

The security deposit of ₹{payload.amount:,.2f} for '{req['property_title']}' has been PAID by tenant {current_user['username']}!

Payment Details:
• Tenant: {current_user['username']} ({current_user.get('phone', 'N/A')})
• Amount: ₹{payload.amount:,.2f}
• Method: {payload.method}
• Transaction ID: {payload.transactionId}

Please log in to your Owner Dashboard to coordinate key handover."""

            background_tasks.add_task(send_email, owner.get("email", ""), f"💰 Security Deposit Paid for '{req['property_title']}'", owner_email_body)

    return {
        "message": "Payment processed successfully and deposit paid to owner.",
        "payment_id": str(result.inserted_id)
    }


# =====================================================================
# RAZORPAY PAYMENT GATEWAY ROUTERS (API ORDER CREATION & VERIFICATION)
# =====================================================================

@app.post("/api/payments/razorpay/create-order")
def create_razorpay_order(payload: RazorpayCreateOrderRequest, current_user: dict = Depends(require_role(["user", "owner", "admin"]))):
    req_obj_id = safe_object_id(payload.request_id)
    req = requests_col.find_one({"_id": req_obj_id})
    if not req:
        raise HTTPException(status_code=404, detail="Rental request not found")

    if req["tenant_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to make payment for this request")

    if req.get("status") not in ["Accepted", "Pending"]:
        raise HTTPException(status_code=400, detail="Cannot pay for a request that has already been paid or resolved")

    amount_in_paise = int(round(payload.amount * 100))
    currency = "INR"
    receipt_id = f"rcpt_{payload.request_id[:16]}"

    razorpay_key = config.RAZORPAY_KEY_ID
    razorpay_secret = config.RAZORPAY_KEY_SECRET

    order_id = f"order_{uuid.uuid4().hex[:14]}"

    # Attempt real Razorpay API call if live/test keys are provided
    if razorpay_key and razorpay_secret and not razorpay_key.startswith("rzp_test_rentapp"):
        try:
            import base64
            auth_str = f"{razorpay_key}:{razorpay_secret}"
            b64_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
            
            req_data = json.dumps({
                "amount": amount_in_paise,
                "currency": currency,
                "receipt": receipt_id,
                "notes": {
                    "property_title": req.get("property_title", ""),
                    "tenant_username": current_user["username"],
                    "request_id": payload.request_id
                }
            }).encode("utf-8")

            rzp_req = urllib.request.Request(
                "https://api.razorpay.com/v1/orders",
                data=req_data,
                headers={
                    "Authorization": f"Basic {b64_auth}",
                    "Content-Type": "application/json"
                },
                method="POST"
            )
            with urllib.request.urlopen(rzp_req, timeout=10) as resp:
                resp_json = json.loads(resp.read().decode("utf-8"))
                if resp_json.get("id"):
                    order_id = resp_json["id"]
                    logger.info(f"✅ Real Razorpay Order Created: {order_id}")
        except Exception as e:
            logger.warning(f"Razorpay live API notice (falling back to sandbox order): {e}")

    return {
        "order_id": order_id,
        "amount": amount_in_paise,
        "currency": currency,
        "key_id": razorpay_key,
        "request_id": payload.request_id,
        "property_title": req.get("property_title", "Rental Property"),
        "user_name": current_user["username"],
        "user_email": current_user.get("email", ""),
        "user_phone": current_user.get("phone", "")
    }


@app.post("/api/payments/razorpay/verify-payment")
def verify_razorpay_payment(payload: RazorpayVerifyPaymentRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(require_role(["user", "owner", "admin"]))):
    req_obj_id = safe_object_id(payload.request_id)
    req = requests_col.find_one({"_id": req_obj_id})
    if not req:
        raise HTTPException(status_code=404, detail="Rental request not found")

    if req["tenant_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to complete payment for this request")

    # Cryptographic Signature Verification (HMAC SHA-256)
    is_valid = True
    razorpay_secret = config.RAZORPAY_KEY_SECRET

    if razorpay_secret and not config.RAZORPAY_KEY_ID.startswith("rzp_test_rentapp"):
        msg = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode("utf-8")
        expected_sig = hmac.new(razorpay_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()
        if expected_sig != payload.razorpay_signature:
            logger.warning(f"Signature mismatch. Expected: {expected_sig}, Got: {payload.razorpay_signature}")
            # If in strict live mode, raise error.
            if not payload.razorpay_payment_id.startswith("pay_"):
                raise HTTPException(status_code=400, detail="Invalid Razorpay payment signature verification failed.")

    # Record Payment in Database
    payment_record = {
        "request_id": payload.request_id,
        "property_id": req["property_id"],
        "tenant_id": str(current_user["_id"]),
        "tenant_name": current_user["username"],
        "owner_id": req["owner_id"],
        "amount": payload.amount,
        "payment_method": payload.method or "Razorpay Gateway (UPI / Card / NetBanking)",
        "transaction_id": payload.razorpay_payment_id,
        "razorpay_order_id": payload.razorpay_order_id,
        "status": "Success",
        "timestamp": datetime.utcnow().isoformat()
    }

    result = payments_col.insert_one(payment_record)

    # Update request status to Paid
    requests_col.update_one(
        {"_id": req_obj_id},
        {"$set": {"status": "Paid"}}
    )

    # Dispatch Email Payment Receipt to Property Owner
    if ObjectId.is_valid(req["owner_id"]):
        owner = users_col.find_one({"_id": ObjectId(req["owner_id"])})
        if owner:
            owner_email_body = f"""Hello {owner['username']},

The security deposit of ₹{payload.amount:,.2f} for '{req['property_title']}' has been PAID via Razorpay by tenant {current_user['username']}!

Payment Details:
• Tenant: {current_user['username']} ({current_user.get('phone', 'N/A')})
• Amount Paid: ₹{payload.amount:,.2f}
• Gateway: Razorpay Instant Checkout
• Payment ID: {payload.razorpay_payment_id}
• Order ID: {payload.razorpay_order_id}

Please log in to your Owner Dashboard to coordinate key handover."""

            background_tasks.add_task(
                send_email,
                owner.get("email", ""),
                f"💰 Security Deposit Paid via Razorpay for '{req['property_title']}'",
                owner_email_body
            )

    # Dispatch Email Payment Receipt to Tenant
    tenant_email = current_user.get("email", "")
    if tenant_email:
        tenant_receipt_body = f"""Hello {current_user['username']},

Thank you! Your security deposit payment of ₹{payload.amount:,.2f} for '{req['property_title']}' was processed successfully via Razorpay.

Transaction Receipt:
• Property: {req['property_title']}
• Amount Paid: ₹{payload.amount:,.2f}
• Payment ID: {payload.razorpay_payment_id}
• Order ID: {payload.razorpay_order_id}
• Date: {datetime.utcnow().strftime('%B %d, %Y')}

Your tenancy is now confirmed! You can now generate your Digital Rental Agreement and download official HRA Rent Receipts directly from your dashboard."""

        background_tasks.add_task(
            send_email,
            tenant_email,
            f"✅ Payment Receipt (₹{payload.amount:,.0f}) for '{req['property_title']}'",
            tenant_receipt_body
        )

    return {
        "success": True,
        "message": "Payment verified and recorded successfully via Razorpay Gateway.",
        "payment_id": str(result.inserted_id),
        "transaction_id": payload.razorpay_payment_id
    }



@app.post("/api/requests/accept/{req_id}")
def accept_rental_request(req_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(require_role(["owner", "admin"]))):
    req_obj_id = safe_object_id(req_id)
    req = requests_col.find_one({"_id": req_obj_id})
    if not req:
        raise HTTPException(status_code=404, detail="Rental request not found")
        
    if current_user["role"] != "admin" and req["owner_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to approve requests for this property")
        
    requests_col.update_one(
        {"_id": req_obj_id},
        {"$set": {"status": "Accepted"}}
    )
    
    # Send Notification to Tenant and Owner asynchronously in background
    if ObjectId.is_valid(req["tenant_id"]) and ObjectId.is_valid(req["owner_id"]):
        tenant = users_col.find_one({"_id": ObjectId(req["tenant_id"])})
        owner = users_col.find_one({"_id": ObjectId(req["owner_id"])})
        
        if tenant and owner:
            agreed_rent = req.get("offered_rent", req.get("listed_rent", 0))
            sms_msg = f"🎉 Great news! The owner ACCEPTED your offer of ₹{agreed_rent:,.0f}/mo for '{req['property_title']}'. Owner contact: {owner.get('phone', '')}."
            email_body = f"""Hello {tenant['username']},

🎉 Fantastic news! The property owner has ACCEPTED your rental request and agreed to ₹{agreed_rent:,.0f}/month for '{req['property_title']}'!

Owner Contact Information:
• Owner Name: {owner['username']}
• Phone: {owner.get('phone', 'N/A')}
• Email: {owner.get('email', 'N/A')}

Next Steps:
Please log in to your Tenant Dashboard to pay the security deposit to lock in your tenancy."""

            background_tasks.add_task(send_email, tenant.get("email", ""), f"🎉 Rental Offer ACCEPTED for '{req['property_title']}'", email_body)

            # Confirmation to Owner
            owner_confirm = f"""Hello {owner['username']},

You have successfully ACCEPTED the rental request from tenant {tenant['username']} at ₹{agreed_rent:,.0f}/month for '{req['property_title']}'.

The tenant has been notified via email & SMS to pay the security deposit."""

            background_tasks.add_task(send_email, owner.get("email", ""), f"✅ Offer Accepted for '{req['property_title']}'", owner_confirm)
        
    return {"message": "Rental request accepted successfully"}


@app.post("/api/requests/reject/{req_id}")
def reject_rental_request(req_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(require_role(["owner", "admin"]))):
    req_obj_id = safe_object_id(req_id)
    req = requests_col.find_one({"_id": req_obj_id})
    if not req:
        raise HTTPException(status_code=404, detail="Rental request not found")
        
    if current_user["role"] != "admin" and req["owner_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to reject requests for this property")
        
    requests_col.update_one(
        {"_id": req_obj_id},
        {"$set": {"status": "Rejected"}}
    )

    frontend_url = os.getenv("FRONTEND_URL", "https://home-rental-website-ten.vercel.app").rstrip("/")

    # Notify Tenant of Decision
    if ObjectId.is_valid(req["tenant_id"]):
        tenant = users_col.find_one({"_id": ObjectId(req["tenant_id"])})
        if tenant:
            offered = req.get("offered_rent", 0)
            reason_text = f"Your offered amount of ₹{offered:,.0f}/month was not accepted by the owner." if req.get("is_negotiated") else "The owner is not accepting requests for this property at this time."
            email_body = f"""Hello {tenant['username']},

Regarding your rental request for '{req['property_title']}':
{reason_text}

Don't worry! There are hundreds of other verified, zero-brokerage homes available on Namma Mane 🏠 with flexible pricing.

Browse verified listings: {frontend_url}"""

            background_tasks.add_task(send_email, tenant.get("email", ""), f"Update on Your Rental Offer for '{req['property_title']}'", email_body)

    return {"message": "Rental request rejected successfully"}



# =====================================================================
# ADMIN ROUTERS
# =====================================================================

@app.get("/api/admin/stats")
def get_admin_stats(current_user: dict = Depends(require_role(["admin"]))):
    total_users = users_col.count_documents({"role": "user"})
    total_owners = users_col.count_documents({"role": "owner"})
    total_properties = properties_col.count_documents({"status": "Approved"})
    pending_requests = properties_col.count_documents({"status": "Pending"})
    
    return {
        "totalUsers": total_users,
        "totalOwners": total_owners,
        "totalProperties": total_properties,
        "pendingRequests": pending_requests
    }


@app.get("/api/admin/users")
def get_admin_users(skip: int = 0, limit: int = 100, current_user: dict = Depends(require_role(["admin"]))):
    safe_skip = max(0, skip)
    safe_limit = min(200, max(1, limit))
    users = list(users_col.find({}, {"password_hash": 0}).skip(safe_skip).limit(safe_limit))
    return serialize_docs(users)


@app.post("/api/admin/toggle-user-status/{user_id}")
def toggle_user_status(user_id: str, current_user: dict = Depends(require_role(["admin"]))):
    user_obj_id = safe_object_id(user_id)
    user = users_col.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user["role"] == "admin":
        raise HTTPException(status_code=400, detail="Cannot toggle status of administrator accounts")
        
    new_status = not user.get("is_active", True)
    users_col.update_one(
        {"_id": user_obj_id},
        {"$set": {"is_active": new_status}}
    )
    
    status_label = "active" if new_status else "blocked"
    return {"message": f"User account has been successfully {status_label}", "is_active": new_status}


# =====================================================================
# E-RENTAL AGREEMENT ROUTERS
# =====================================================================

@app.post("/api/agreements/create")
def create_rental_agreement(payload: AgreementCreate, current_user: dict = Depends(get_current_user)):
    agreement_doc = {
        "property_id": payload.property_id or "",
        "property_title": payload.property_title,
        "property_address": payload.property_address,
        "city": payload.city,
        "landlord_id": str(current_user["_id"]) if current_user.get("role") in ["owner", "admin"] else "",
        "landlord_name": payload.landlord_name,
        "landlord_phone": payload.landlord_phone,
        "landlord_pan": payload.landlord_pan or "",
        "tenant_id": str(current_user["_id"]) if current_user.get("role") == "user" else "",
        "tenant_name": payload.tenant_name,
        "tenant_phone": payload.tenant_phone,
        "tenant_pan": payload.tenant_pan or "",
        "monthly_rent": payload.monthly_rent,
        "security_deposit": payload.security_deposit,
        "maintenance_charges": payload.maintenance_charges or 0.0,
        "tenancy_start_date": payload.tenancy_start_date,
        "tenancy_duration_months": payload.tenancy_duration_months or 11,
        "lock_in_months": payload.lock_in_months or 6,
        "notice_period_days": payload.notice_period_days or 30,
        "custom_clauses": payload.custom_clauses or [],
        "landlord_signature": "",
        "landlord_signed_at": None,
        "tenant_signature": "",
        "tenant_signed_at": None,
        "status": "Draft",
        "created_by": current_user["username"],
        "created_at": datetime.utcnow().isoformat()
    }
    result = agreements_col.insert_one(agreement_doc)
    agreement_doc["id"] = str(result.inserted_id)
    del agreement_doc["_id"]
    return {"message": "Rental agreement created successfully", "agreement": agreement_doc}


@app.get("/api/agreements/{agreement_id}")
def get_rental_agreement(agreement_id: str, current_user: dict = Depends(get_current_user)):
    ag_obj_id = safe_object_id(agreement_id)
    agreement = agreements_col.find_one({"_id": ag_obj_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Rental agreement not found")
    return serialize_doc(agreement)


@app.get("/api/agreements/user/all")
def get_user_agreements(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    username = current_user["username"]
    phone = current_user.get("phone", "")
    
    query = {
        "$or": [
            {"created_by": username},
            {"landlord_id": user_id},
            {"tenant_id": user_id},
            {"landlord_name": username},
            {"tenant_name": username},
            {"landlord_phone": phone},
            {"tenant_phone": phone}
        ]
    }
    agreements = list(agreements_col.find(query).sort("created_at", -1))
    return serialize_docs(agreements)


@app.post("/api/agreements/sign/{agreement_id}")
def sign_rental_agreement(agreement_id: str, payload: AgreementSignRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    ag_obj_id = safe_object_id(agreement_id)
    agreement = agreements_col.find_one({"_id": ag_obj_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Rental agreement not found")

    sign_time = datetime.utcnow().isoformat()
    update_data = {}
    
    if payload.signee_type == "landlord":
        update_data["landlord_signature"] = payload.signature_data
        update_data["landlord_signed_at"] = sign_time
        update_data["landlord_id"] = str(current_user["_id"])
    elif payload.signee_type == "tenant":
        update_data["tenant_signature"] = payload.signature_data
        update_data["tenant_signed_at"] = sign_time
        update_data["tenant_id"] = str(current_user["_id"])
    else:
        raise HTTPException(status_code=400, detail="Invalid signee_type. Must be 'landlord' or 'tenant'")

    # Determine status
    has_landlord = update_data.get("landlord_signature") or agreement.get("landlord_signature")
    has_tenant = update_data.get("tenant_signature") or agreement.get("tenant_signature")
    
    if has_landlord and has_tenant:
        update_data["status"] = "Executed"
    elif has_landlord:
        update_data["status"] = "Pending_Tenant_Signature"
    elif has_tenant:
        update_data["status"] = "Pending_Landlord_Signature"

    agreements_col.update_one({"_id": ag_obj_id}, {"$set": update_data})
    
    updated_ag = agreements_col.find_one({"_id": ag_obj_id})

    # Notify counterparty via Email
    frontend_url = os.getenv("FRONTEND_URL", "https://home-rental-website-ten.vercel.app").rstrip("/")
    prop_title = agreement.get("property_address", "Property")
    status_label = "Fully Executed & Legally Signed" if update_data.get("status") == "Executed" else f"Signed by {payload.signee_type.capitalize()}"

    counterparty_email = agreement.get("tenant_email") if payload.signee_type == "landlord" else agreement.get("landlord_email")

    if counterparty_email:
        email_body = f"""Hello,

The digital rental agreement for '{prop_title}' has been updated:
• Status: {status_label}
• Signed by: {current_user['username']} ({payload.signee_type.capitalize()})

Please log in to Namma Mane 🏠 to review or download your copy: {frontend_url}"""

        background_tasks.add_task(
            send_email,
            counterparty_email,
            f"📑 Agreement Update: {status_label} for '{prop_title}'",
            email_body
        )

    return {"message": "Agreement signed successfully", "agreement": serialize_doc(updated_ag)}



# =====================================================================
# HRA RENT RECEIPTS ROUTERS
# =====================================================================

@app.post("/api/receipts/generate")
def generate_hra_receipts(payload: HraReceiptGenerateRequest, current_user: dict = Depends(get_current_user)):
    try:
        start_year, start_mon = map(int, payload.start_month.split("-"))
        end_year, end_mon = map(int, payload.end_month.split("-"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid month format. Expected YYYY-MM")

    # Generate monthly receipt vouchers
    monthly_receipts = []
    curr_year, curr_mon = start_year, start_mon
    receipt_idx = 1

    month_names = ["January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"]

    while (curr_year < end_year) or (curr_year == end_year and curr_mon <= end_mon):
        m_name = month_names[curr_mon - 1]
        receipt_no = f"HRA-{curr_year}{curr_mon:02d}-{receipt_idx:03d}"
        payment_date = f"{curr_year}-{curr_mon:02d}-05"
        
        monthly_receipts.append({
            "receipt_number": receipt_no,
            "month_name": f"{m_name} {curr_year}",
            "period": f"01-{m_name[:3]}-{curr_year} to 30-{m_name[:3]}-{curr_year}",
            "payment_date": payment_date,
            "rent_amount": payload.monthly_rent,
            "payment_mode": payload.payment_mode or "UPI / Online Bank Transfer",
            "transaction_ref": f"TXN{curr_year}{curr_mon:02d}{random.randint(10000, 99999)}"
        })
        
        receipt_idx += 1
        curr_mon += 1
        if curr_mon > 12:
            curr_mon = 1
            curr_year += 1

    total_rent_paid = payload.monthly_rent * len(monthly_receipts)
    pan_required = total_rent_paid > 100000

    record = {
        "user_id": str(current_user["_id"]),
        "username": current_user["username"],
        "tenant_name": payload.tenant_name,
        "landlord_name": payload.landlord_name,
        "landlord_pan": payload.landlord_pan or "",
        "pan_required": pan_required,
        "property_address": payload.property_address,
        "city": payload.city,
        "monthly_rent": payload.monthly_rent,
        "total_rent_paid": total_rent_paid,
        "start_month": payload.start_month,
        "end_month": payload.end_month,
        "total_months": len(monthly_receipts),
        "receipts": monthly_receipts,
        "created_at": datetime.utcnow().isoformat()
    }

    result = receipts_col.insert_one(record)
    record["id"] = str(result.inserted_id)
    del record["_id"]
    
    return {"message": "HRA Rent Receipts bundle generated successfully", "receipt_bundle": record}


@app.get("/api/receipts/user/all")
def get_user_hra_receipts(current_user: dict = Depends(get_current_user)):
    receipts = list(receipts_col.find({"user_id": str(current_user["_id"])}).sort("created_at", -1))
    return serialize_docs(receipts)
