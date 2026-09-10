import os
import logging
from config import config

try:
    from twilio.rest import Client
except ImportError:
    Client = None

try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
except ImportError:
    SendGridAPIClient = None
    Mail = None

# Setup logging
logger = logging.getLogger("NotificationsService")
logger.setLevel(logging.INFO)

def format_phone_number(phone: str) -> str:
    cleaned = phone.strip().replace(" ", "").replace("-", "")
    if not cleaned.startswith("+"):
        if len(cleaned) == 10:
            cleaned = f"+91{cleaned}"  # Default to India +91 if 10 digits
        else:
            cleaned = f"+{cleaned}"
    return cleaned

# Pre-initialize clients once at module startup
twilio_client = None
if Client and config.TWILIO_ACCOUNT_SID and config.TWILIO_AUTH_TOKEN:
    try:
        twilio_client = Client(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)
    except Exception as e:
        logger.warning(f"Could not pre-initialize Twilio client: {e}")

sendgrid_client = None
if SendGridAPIClient and config.SENDGRID_API_KEY:
    try:
        sendgrid_client = SendGridAPIClient(config.SENDGRID_API_KEY)
    except Exception as e:
        logger.warning(f"Could not pre-initialize SendGrid client: {e}")

import threading
import time
import json
import urllib.request
import urllib.error
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def get_10_digit_phone(phone: str) -> str:
    cleaned = phone.strip().replace(" ", "").replace("-", "").replace("+", "")
    if cleaned.startswith("91") and len(cleaned) == 12:
        cleaned = cleaned[2:]
    return cleaned

def _extract_otp_digits(message: str) -> str:
    import re
    match = re.search(r"\b\d{6}\b", message)
    return match.group(0) if match else "123456"

def _dispatch_fast2sms(phone_10_digit: str, message: str):
    if config.FAST2SMS_API_KEY:
        try:
            logger.info(f"🚀 Real Fast2SMS API triggered for Indian mobile: {phone_10_digit}")
            url = "https://www.fast2sms.com/dev/bulkV2"
            otp_code = _extract_otp_digits(message)
            
            # 1. Try OTP Route (Fast2SMS Quick OTP)
            payload_otp = {
                "route": "otp",
                "variables_values": otp_code,
                "numbers": phone_10_digit
            }
            
            req_data = json.dumps(payload_otp).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={
                    "authorization": config.FAST2SMS_API_KEY,
                    "Content-Type": "application/json",
                    "User-Agent": "NammaMane-App/1.0"
                },
                method="POST"
            )
            
            try:
                with urllib.request.urlopen(req, timeout=5) as response:
                    res_body = response.read().decode("utf-8")
                    res_json = json.loads(res_body)
                    if res_json.get("return") is True:
                        logger.info(f"✅ Real SMS sent via Fast2SMS OTP Route to {phone_10_digit}! ID: {res_json.get('request_id')}")
                        return True
            except urllib.error.HTTPError as he:
                err_content = he.read().decode("utf-8")
                logger.warning(f"Fast2SMS OTP Route Notice: {err_content}")
            
            # 2. Try Quick Message Route (q)
            payload_q = {
                "route": "q",
                "message": message,
                "language": "english",
                "flash": 0,
                "numbers": phone_10_digit
            }
            req_q_data = json.dumps(payload_q).encode("utf-8")
            req_q = urllib.request.Request(
                url,
                data=req_q_data,
                headers={
                    "authorization": config.FAST2SMS_API_KEY,
                    "Content-Type": "application/json",
                    "User-Agent": "NammaMane-App/1.0"
                },
                method="POST"
            )
            try:
                with urllib.request.urlopen(req_q, timeout=5) as response_q:
                    res_body_q = response_q.read().decode("utf-8")
                    res_json_q = json.loads(res_body_q)
                    if res_json_q.get("return") is True:
                        logger.info(f"✅ Real SMS sent via Fast2SMS Quick Route to {phone_10_digit}! ID: {res_json_q.get('request_id')}")
                        return True
            except urllib.error.HTTPError as he_q:
                err_content_q = he_q.read().decode("utf-8")
                logger.warning(f"Fast2SMS Quick Route Notice: {err_content_q}")

        except Exception as e:
            logger.error(f"❌ Failed to dispatch Fast2SMS to {phone_10_digit}: {e}")

def _dispatch_real_sms(formatted_phone: str, message: str, retry_count: int = 0):
    if twilio_client and config.TWILIO_PHONE_NUMBER:
        try:
            logger.info(f"🚀 Real Twilio API triggered for SMS to {formatted_phone}")
            message_obj = twilio_client.messages.create(
                body=message,
                from_=config.TWILIO_PHONE_NUMBER,
                to=formatted_phone
            )
            logger.info(f"✅ Real SMS sent via Twilio! SID: {message_obj.sid}")
        except Exception as e:
            err_str = str(e)
            if "20429" in err_str or "rate limit" in err_str.lower():
                if retry_count < 2:
                    logger.warning(f"⚠️ Twilio rate limit reached. Retrying SMS to {formatted_phone} in 1.5s...")
                    time.sleep(1.5)
                    return _dispatch_real_sms(formatted_phone, message, retry_count + 1)
            logger.error(f"❌ Failed to send real SMS via Twilio to {formatted_phone}: {err_str}")

def send_sms(phone: str, message: str):
    """
    Sends real SMS via Fast2SMS (Indian numbers) or Twilio, and logs simulated SMS.
    """
    formatted_phone = format_phone_number(phone)
    phone_10_digit = get_10_digit_phone(phone)
    
    # Priority 1: Fast2SMS (Free Indian SMS Gateway)
    if config.FAST2SMS_API_KEY:
        threading.Thread(target=_dispatch_fast2sms, args=(phone_10_digit, message), daemon=True).start()
    # Priority 2: Twilio
    elif twilio_client and config.TWILIO_PHONE_NUMBER:
        threading.Thread(target=_dispatch_real_sms, args=(formatted_phone, message), daemon=True).start()

    logger.info("=" * 60)
    logger.info(f"📱 SMS NOTIFICATION DISPATCHED TO: {formatted_phone}")
    logger.info("-" * 60)
    logger.info(message)
    logger.info("=" * 60)
    return True

def _build_html_email_template(title: str, preheader: str, content_html: str, action_url: str = None, action_text: str = "Open Website") -> str:
    """
    Returns an ultra-modern, responsive HTML email template with Namma Mane 🏠 branding.
    """
    if not action_url or "localhost" in action_url:
        default_front = getattr(config, "FRONTEND_URL", "https://home-rental-website-ten.vercel.app") or "https://home-rental-website-ten.vercel.app"
        if action_url and "/register" in action_url:
            action_url = f"{default_front.rstrip('/')}/register"
        elif action_url and "/forgot-password" in action_url:
            action_url = f"{default_front.rstrip('/')}/forgot-password"
        else:
            action_url = default_front.rstrip('/')
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6fb; margin: 0; padding: 0; }}
        .email-container {{ max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,32,69,0.08); border: 1px solid #e2e8f0; }}
        .email-header {{ background: #002045; color: #ffffff; padding: 28px 24px; text-align: center; }}
        .email-header h1 {{ margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }}
        .email-header p {{ margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; }}
        .email-body {{ padding: 32px 28px; color: #1e293b; line-height: 1.6; font-size: 14px; }}
        .highlight-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #002045; border-radius: 8px; padding: 16px; margin: 20px 0; }}
        .cta-btn {{ display: inline-block; background: #ad3035; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 10px; margin-top: 24px; font-size: 14px; text-align: center; }}
        .email-footer {{ background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Namma Mane 🏠</h1>
            <p>{preheader}</p>
        </div>
        <div class="email-body">
            {content_html}
            <div style="text-align: center;">
                <a href="{action_url}" class="cta-btn">{action_text}</a>
            </div>
        </div>
        <div class="email-footer">
            <p>Namma Mane 🏠 &bull; Find your home which matches your vibe &bull; Zero Brokerage</p>
            <p>If you have questions, reach us at support@nammamane.com</p>
        </div>
    </div>
</body>
</html>"""

def _dispatch_smtp_email(email: str, subject: str, plain_body: str, html_body: str = None):
    smtp_email = os.getenv("SMTP_EMAIL", config.SMTP_EMAIL).strip()
    smtp_password = os.getenv("SMTP_PASSWORD", config.SMTP_PASSWORD).strip()
    smtp_server = os.getenv("SMTP_SERVER", config.SMTP_SERVER).strip() or "smtp.gmail.com"
    smtp_port = int(os.getenv("SMTP_PORT", str(config.SMTP_PORT)).strip() or 587)

    if smtp_email and smtp_password:
        try:
            logger.info(f"🚀 Real Gmail SMTP dispatching email to: {email} (Subject: {subject})")
            msg = MIMEMultipart("alternative")
            msg["From"] = f"Namma Mane 🏠 <{smtp_email}>"
            msg["To"] = email
            msg["Subject"] = subject
            
            msg.attach(MIMEText(plain_body, "plain"))
            if html_body:
                msg.attach(MIMEText(html_body, "html"))
            
            # Prioritize port 465 (SMTP_SSL) for cloud environments
            if smtp_port == 465:
                with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
                    server.login(smtp_email, smtp_password)
                    server.sendmail(smtp_email, email, msg.as_string())
            else:
                try:
                    with smtplib.SMTP(smtp_server, smtp_port, timeout=15) as server:
                        server.starttls()
                        server.login(smtp_email, smtp_password)
                        server.sendmail(smtp_email, email, msg.as_string())
                except Exception:
                    logger.info("Port 587 failed, falling back to port 465 SSL...")
                    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
                        server.login(smtp_email, smtp_password)
                        server.sendmail(smtp_email, email, msg.as_string())

            logger.info(f"✅ Real Email sent via SMTP to {email} successfully!")
        except Exception as e:
            logger.error(f"❌ Failed to send real Email via SMTP to {email}: {e}", exc_info=True)
    else:
        logger.warning(f"⚠️ SMTP credentials missing! (SMTP_EMAIL={'set' if smtp_email else 'empty'}, SMTP_PASSWORD={'set' if smtp_password else 'empty'})")


def _dispatch_resend_email(email: str, subject: str, html_body: str, plain_body: str) -> bool:
    api_key = getattr(config, "RESEND_API_KEY", "") or os.getenv("RESEND_API_KEY", "").strip()
    if not api_key:
        return False
    try:
        import urllib.request
        import urllib.error
        import json

        from_email = getattr(config, "RESEND_FROM_EMAIL", "Namma Mane <onboarding@resend.dev>") or "Namma Mane <onboarding@resend.dev>"
        payload = {
            "from": from_email,
            "to": [email],
            "subject": subject,
            "html": html_body,
            "text": plain_body
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=data,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "NammaManeBackend/1.0"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=12.0) as resp:
            resp_body = resp.read().decode("utf-8")
            if resp.status in [200, 201]:
                logger.info(f"✅ Real Email sent via Resend HTTPS API to {email} successfully! Details: {resp_body}")
                return True
            else:
                logger.warning(f"⚠️ Resend API responded with status {resp.status}: {resp_body}")
    except urllib.error.HTTPError as e:
        error_content = e.read().decode("utf-8", errors="ignore")
        logger.error(f"❌ Resend API HTTP error {e.code}: {error_content}")
    except Exception as e:
        logger.error(f"❌ Resend API dispatch error: {e}")
    return False

def _dispatch_brevo_email(email: str, subject: str, html_body: str, plain_body: str) -> bool:
    api_key = getattr(config, "BREVO_API_KEY", "") or os.getenv("BREVO_API_KEY", "").strip()
    if not api_key:
        return False
    try:
        import urllib.request
        import urllib.error
        import json

        sender_email = getattr(config, "BREVO_SENDER_EMAIL", "hmp7964@gmail.com") or "hmp7964@gmail.com"
        payload = {
            "sender": {"name": "Namma Mane 🏠", "email": sender_email},
            "to": [{"email": email}],
            "subject": subject,
            "htmlContent": html_body,
            "textContent": plain_body
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=data,
            headers={
                "api-key": api_key,
                "Content-Type": "application/json",
                "User-Agent": "NammaManeBackend/1.0"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=12.0) as resp:
            resp_body = resp.read().decode("utf-8")
            if resp.status in [200, 201]:
                logger.info(f"✅ Real Email sent via Brevo HTTPS API to {email} successfully! Details: {resp_body}")
                return True
            else:
                logger.warning(f"⚠️ Brevo API responded with status {resp.status}: {resp_body}")
    except urllib.error.HTTPError as e:
        error_content = e.read().decode("utf-8", errors="ignore")
        logger.error(f"❌ Brevo API HTTP error {e.code}: {error_content}")
    except Exception as e:
        logger.error(f"❌ Brevo API dispatch error: {e}")
    return False

def send_email(email: str, subject: str, body: str, html_body: str = None):
    """
    Sends real email via Resend HTTPS API, Brevo, SendGrid, or Gmail SMTP fallback.
    """
    if not email:
        return False

    smtp_email = os.getenv("SMTP_EMAIL", config.SMTP_EMAIL).strip()
    smtp_password = os.getenv("SMTP_PASSWORD", config.SMTP_PASSWORD).strip()

    # Auto-generate HTML wrapper if not explicitly passed
    if not html_body:
        html_paragraphs = "".join([f"<p>{line}</p>" for line in body.split("\n\n") if line.strip()])
        html_body = _build_html_email_template(
            title=subject,
            preheader="Notification from Namma Mane 🏠",
            content_html=html_paragraphs
        )

    # Priority 1: Brevo HTTPS API (Port 443 — Universal recipient delivery to ANY email)
    brevo_key = getattr(config, "BREVO_API_KEY", "") or os.getenv("BREVO_API_KEY", "")
    if brevo_key:
        if _dispatch_brevo_email(email, subject, html_body, body):
            return True

    # Priority 2: Resend HTTPS API (Port 443)
    resend_key = getattr(config, "RESEND_API_KEY", "") or os.getenv("RESEND_API_KEY", "")
    if resend_key:
        if _dispatch_resend_email(email, subject, html_body, body):
            return True

    # Priority 3: SendGrid API
    if sendgrid_client and Mail and config.SENDER_EMAIL:
        try:
            logger.info(f"🚀 Real SendGrid API triggered for Email to {email}")
            message_obj = Mail(
                from_email=config.SENDER_EMAIL,
                to_emails=email,
                subject=subject,
                html_content=html_body,
                plain_text_content=body
            )
            response = sendgrid_client.send(message_obj)
            logger.info(f"✅ Real Email sent via SendGrid! Status: {response.status_code}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to send real Email via SendGrid: {e}")

    # Priority 4: Gmail SMTP (Fallback)
    if smtp_email and smtp_password:
        _dispatch_smtp_email(email, subject, body, html_body)

    logger.info("=" * 70)
    logger.info(f"📧 EMAIL NOTIFICATION DISPATCHED TO: {email}")
    logger.info(f"SUBJECT: {subject}")
    logger.info("-" * 70)
    logger.info(body)
    logger.info("=" * 70)
    return True


