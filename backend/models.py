from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    phone: str
    aadhaar: str
    role: str = "user"  # "user" (tenant), "owner", "admin"

class UserLogin(BaseModel):
    identifier: str  # username or email
    password: str

class PropertyCreate(BaseModel):
    title: str
    city: str
    area: str
    address: str
    rent: float
    deposit: float
    houseType: str
    rooms: int
    facilities: Optional[str] = ""
    rules: Optional[str] = ""
    locationLink: Optional[str] = ""
    imgUrl: Optional[str] = ""
    additionalImages: Optional[str] = ""
    upiId: Optional[str] = ""
    bankAccountName: Optional[str] = ""
    bankAccountNumber: Optional[str] = ""
    bankIfscCode: Optional[str] = ""
    state: Optional[str] = ""
    district: Optional[str] = ""
    taluk: Optional[str] = ""
    pincode: Optional[str] = ""

class RequestCreate(BaseModel):
    property_id: str
    offered_rent: Optional[float] = None
    message: Optional[str] = ""


class OtpSendRequest(BaseModel):
    phone: str
    email: Optional[str] = None
    username: Optional[str] = None

class OtpVerifyRequest(BaseModel):
    phone: str
    code: str
    username: Optional[str] = None

class VibeSearchRequest(BaseModel):
    query: str

class AgreementCreate(BaseModel):
    property_id: Optional[str] = ""
    property_title: str
    property_address: str
    city: str
    landlord_name: str
    landlord_phone: str
    landlord_pan: Optional[str] = ""
    tenant_name: str
    tenant_phone: str
    tenant_pan: Optional[str] = ""
    monthly_rent: float
    security_deposit: float
    maintenance_charges: Optional[float] = 0.0
    tenancy_start_date: str  # YYYY-MM-DD
    tenancy_duration_months: Optional[int] = 11
    lock_in_months: Optional[int] = 6
    notice_period_days: Optional[int] = 30
    custom_clauses: Optional[List[str]] = []

class AgreementSignRequest(BaseModel):
    signature_data: str  # DataURL or typed legal name
    signee_type: str    # "landlord" or "tenant"

class HraReceiptGenerateRequest(BaseModel):
    landlord_name: str
    landlord_pan: Optional[str] = ""
    tenant_name: str
    property_address: str
    city: str
    monthly_rent: float
    start_month: str  # e.g., "2025-04"
    end_month: str    # e.g., "2026-03"
    payment_mode: Optional[str] = "UPI / Online Bank Transfer"

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

class VerifyResetOtpRequest(BaseModel):
    email: str
    otp: str



class GoogleLoginRequest(BaseModel):
    id_token: str
    role: Optional[str] = "user"  # role hint for new users: "user" or "owner"

class EmailOtpSendRequest(BaseModel):
    email: str
    username: Optional[str] = ""

class EmailOtpVerifyRequest(BaseModel):
    email: str
    code: str
    username: Optional[str] = ""

class RazorpayCreateOrderRequest(BaseModel):
    request_id: str
    amount: float

class RazorpayVerifyPaymentRequest(BaseModel):
    request_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    amount: float
    method: Optional[str] = "Razorpay (UPI / Card / NetBanking)"


