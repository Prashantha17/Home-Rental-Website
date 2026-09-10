import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Security Configuration
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "SUPER_SECRET_KEY_FOR_RENT_APP_FASTAPI_PROD_2026").strip()
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256").strip()
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440").strip())

    # Database Configuration
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017").strip()
    DB_NAME = os.getenv("DB_NAME", "rentdb").strip()

    # Uploads & Storage Configuration
    MAX_UPLOAD_SIZE_MB = 5
    ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

    # Notification API Keys
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
    TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "").strip()


    
    SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "").strip()
    SENDER_EMAIL = os.getenv("SENDER_EMAIL", "noreply@nammamane.com").strip()
    
    # 100% Free Gmail SMTP Configuration
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com").strip()
    SMTP_PORT = int(os.getenv("SMTP_PORT", "465").strip())
    SMTP_EMAIL = os.getenv("SMTP_EMAIL", "hmp7964@gmail.com").strip()
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "yoqstghwbqqtadfg").strip()

    # Free Indian Fast2SMS Gateway Configuration
    FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "LmvhRTirWucJZV25AjC7nG8kqYaS1DbzoxBN06f9pOyH3UQFEPOLgyF0me4x78QHkdstKBThCwYANlPz").strip()


    # Resend & Brevo HTTPS Email Gateway Configuration
    RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
    RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "Namma Mane <onboarding@resend.dev>").strip()
    BREVO_API_KEY = os.getenv("BREVO_API_KEY", "").strip()
    BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "hmp7964@gmail.com").strip()

    # Razorpay Payment Gateway Configuration (Free Test Mode Support)
    RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_rentapp2026").strip()
    RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "mock_razorpay_secret_key_2026").strip()

config = Config()
