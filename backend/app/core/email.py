import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


def send_password_reset_email(to_email: str, temp_password: str, role: str) -> bool:
    """
    Send a password-reset email containing the temporary password.
    Returns True on success, False if SMTP is not configured or fails.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # SMTP not configured – fall back silently
        return False

    from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
    subject = f"Boutique Staffing Portal – Password Reset ({role.title()})"

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; max-width: 500px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); padding: 1.5rem; border-radius: 8px 8px 0 0; text-align: center; color: #fff;">
            <h2 style="margin: 0;">🔑 Password Reset</h2>
        </div>
        <div style="padding: 1.5rem; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Hello,</p>
            <p>We received a password reset request for your <strong>{role.title()}</strong> account.</p>
            <p>Your temporary password is:</p>
            <div style="text-align: center; margin: 1rem 0;">
                <span style="display: inline-block; padding: 0.75rem 1.5rem; background: #f8f9fa; border: 2px dashed #28a745; border-radius: 8px; font-family: monospace; font-size: 1.3rem; font-weight: bold; letter-spacing: 2px;">
                    {temp_password}
                </span>
            </div>
            <p>Please log in with this password and change it immediately from your <strong>Profile</strong> page.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 1.5rem 0;" />
            <p style="font-size: 0.85rem; color: #888;">If you did not request a password reset, please ignore this email or contact support.</p>
            <p style="font-size: 0.85rem; color: #888;">— Boutique Staffing Portal</p>
        </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email
    msg.attach(MIMEText(f"Your temporary password is: {temp_password}", "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(from_email, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send reset email to {to_email}: {e}")
        return False
