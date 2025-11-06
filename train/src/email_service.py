# email_service.py - Email sending service with Gmail support
from dotenv import load_dotenv  # ← THÊM DÒNG NÀY
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

load_dotenv()  # ← THÊM DÒNG NÀY NGAY SAU IMPORT

logger = logging.getLogger(__name__)

# Email Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USERNAME)
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Property Valuation AI")


def create_email_html(subject: str, heading: str, content: str, button_text: str, button_url: str) -> str:
    """Create beautiful HTML email template"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7fafc; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7fafc; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                                    🏠 Property Valuation AI
                                </h1>
                                <p style="color: #e9d5ff; margin: 10px 0 0 0; font-size: 14px;">
                                    Định giá bất động sản thông minh
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">
                                    {heading}
                                </h2>
                                <p style="color: #4a5568; line-height: 1.6; font-size: 16px; margin: 0 0 30px 0;">
                                    {content}
                                </p>
                                
                                <!-- Button -->
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center">
                                            <a href="{button_url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                                {button_text}
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
                                    Hoặc copy link sau vào trình duyệt:<br>
                                    <a href="{button_url}" style="color: #667eea; word-break: break-all;">
                                        {button_url}
                                    </a>
                                </p>
                                
                                <p style="color: #a0aec0; font-size: 13px; margin: 20px 0 0 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                                    ⏰ Link này sẽ hết hạn sau 24 giờ
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                                    © 2025 Property Valuation AI
                                </p>
                                <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                                    Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """Send email using SMTP"""
    
    # Check if email is configured
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        logger.warning("Email credentials not configured. Skipping email send.")
        print(f"⚠️  Email not configured. Would send to: {to_email}")
        print(f"📧 Subject: {subject}")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        msg['To'] = to_email
        
        # Add text and HTML parts
        if text_content:
            part1 = MIMEText(text_content, 'plain', 'utf-8')
            msg.attach(part1)
        
        part2 = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(part2)
        
        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication failed: {str(e)}")
        print(f"❌ Gmail authentication failed. Please check:")
        print(f"   1. Enable 2-Factor Authentication on your Gmail")
        print(f"   2. Generate App Password: https://myaccount.google.com/apppasswords")
        print(f"   3. Use App Password (16 characters) in SMTP_PASSWORD")
        raise Exception(f"Gmail authentication failed. Please use App Password: {str(e)}")
        
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error: {str(e)}")
        raise Exception(f"Failed to send email: {str(e)}")
        
    except Exception as e:
        logger.error(f"Unexpected error sending email: {str(e)}")
        raise Exception(f"Email service error: {str(e)}")


async def send_verification_email(email: str, token: str, AUTH_API_URL: str) -> bool:
    """Send email verification"""
    verification_url = f"{AUTH_API_URL}/api/auth/verify-email?token={token}"
    
    html_content = create_email_html(
        subject="Xác thực email của bạn",
        heading="Chào mừng bạn! 🎉",
        content="Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấn vào nút bên dưới để xác thực email và kích hoạt tài khoản của bạn.",
        button_text="✅ Xác thực Email",
        button_url=verification_url
    )
    
    text_content = f"""
    Chào mừng bạn đến với Property Valuation AI!
    
    Vui lòng xác thực email bằng cách truy cập link sau:
    {verification_url}
    
    Link này sẽ hết hạn sau 24 giờ.
    """
    
    return await send_email(
        to_email=email,
        subject="Xác thực email - Property Valuation AI",
        html_content=html_content,
        text_content=text_content
    )


async def send_password_reset_email(email: str, token: str, AUTH_GUI_URL: str) -> bool:
    """Send password reset email"""
    reset_url = f"{AUTH_GUI_URL}/reset-password?token={token}"
    
    html_content = create_email_html(
        subject="Đặt lại mật khẩu",
        heading="Yêu cầu đặt lại mật khẩu 🔐",
        content="Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tạo mật khẩu mới.",
        button_text="🔑 Đặt lại mật khẩu",
        button_url=reset_url
    )
    
    text_content = f"""
    Yêu cầu đặt lại mật khẩu
    
    Vui lòng truy cập link sau để đặt lại mật khẩu:
    {reset_url}
    
    Link này sẽ hết hạn sau 1 giờ.
    
    Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
    """
    
    return await send_email(
        to_email=email,
        subject="Đặt lại mật khẩu - Property Valuation AI",
        html_content=html_content,
        text_content=text_content
    )


# Test function
async def test_email_config():
    """Test email configuration"""
    print("\n🧪 Testing email configuration...")
    print(f"SMTP Host: {SMTP_HOST}")
    print(f"SMTP Port: {SMTP_PORT}")
    print(f"SMTP Username: {SMTP_USERNAME}")
    print(f"SMTP Password: {'*' * len(SMTP_PASSWORD) if SMTP_PASSWORD else 'NOT SET'}")
    
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("\n❌ Email not configured!")
        print("Please set SMTP_USERNAME and SMTP_PASSWORD in .env file")
        return False
    
    try:
        # Test connection
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        print("✅ Email configuration is valid!")
        return True
    except Exception as e:
        print(f"❌ Email test failed: {str(e)}")
        return False


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_email_config())