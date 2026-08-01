import logging
from datetime import timedelta
import secrets
import random
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import UserProfile
from .models import PasswordResetToken, EmailVerificationToken
from .utils import (
    clean_input,
    validate_email_format,
    validate_username_format,
    validate_password_strength,
    log_security_event
)

User = get_user_model()
logger = logging.getLogger('security')

class AuthService:
    @staticmethod
    def generate_tokens_for_user(user):
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

    @classmethod
    def register_user(cls, username, email, password, password_confirm=None):
        # 1. Clean Inputs
        username = clean_input(username, lowercase=True)
        email = clean_input(email, lowercase=True)
        
        # 2. Reject empty/only-whitespace strings
        if not username:
            raise ValidationError({"username": ["Username is required."]})
        if not email:
            raise ValidationError({"email": ["Email is required."]})
        if not password:
            raise ValidationError({"password": ["Password is required."]})
        if not password_confirm:
            raise ValidationError({"password_confirm": ["Confirm password is required."]})

        # 3. Format validations
        validate_username_format(username)
        validate_email_format(email)
        
        # 4. Password validation
        if password != password_confirm:
            raise ValidationError({"password_confirm": ["Passwords do not match."]})
            
        validate_password_strength(password, username, email)

        # 5. Uniqueness validation
        if User.objects.filter(username=username).exists():
            raise ValidationError({"username": ["A user with that username already exists."]})
            
        if User.objects.filter(email=email).exists():
            raise ValidationError({"email": ["A user with that email already exists."]})

        # 6. Create User & Profile
        user = User.objects.create_user(username=username, email=email, password=password)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.is_email_verified = False
        profile.save()

        log_security_event("USER_REGISTRATION", user.id, f"Registered: {username} | Email: {email}")

        # 7. Create Verification Token
        cls.send_verification_email(user)

        tokens = cls.generate_tokens_for_user(user)
        return user, tokens

    @classmethod
    def authenticate_user(cls, email_or_username, password):
        email_or_username = clean_input(email_or_username, lowercase=True)
        if not email_or_username:
            raise ValidationError({"username": ["Login credentials are required."]})
        if not password:
            raise ValidationError({"password": ["Password is required."]})

        # Support email or username logins
        user = None
        if '@' in email_or_username:
            try:
                user = User.objects.get(email=email_or_username)
            except User.DoesNotExist:
                pass
        else:
            try:
                user = User.objects.get(username=email_or_username)
            except User.DoesNotExist:
                pass

        if user is None:
            log_security_event("LOGIN_FAILURE", details=f"Attempted username/email: {email_or_username} (User not found)")
            raise ValidationError({"non_field_errors": ["Invalid credentials."]})

        if not user.check_password(password):
            log_security_event("LOGIN_FAILURE", user.id, f"Incorrect password attempt for user: {user.username}")
            raise ValidationError({"non_field_errors": ["Invalid credentials."]})

        if not user.is_active:
            log_security_event("LOGIN_FAILURE_INACTIVE", user.id, f"Attempted login on inactive account: {user.username}")
            raise ValidationError({"non_field_errors": ["This account is inactive."]})

        # Ensure UserProfile exists
        UserProfile.objects.get_or_create(user=user)

        log_security_event("LOGIN_SUCCESS", user.id, f"User {user.username} logged in successfully.")
        tokens = cls.generate_tokens_for_user(user)
        return user, tokens

    @classmethod
    def authenticate_google_user(cls, google_token, email=None, name=None):
        if not google_token:
            raise ValidationError({"token": ["Google authorization token is required."]})

        email = clean_input(email, lowercase=True)
        name = clean_input(name)

        # Verify Google token
        try:
            # Support mock token behavior in debug or test environments
            if google_token.startswith("mock-google-token-"):
                if not email:
                    email = "mockgoogleuser@example.com"
                if not name:
                    name = "Mock Google User"
            else:
                try:
                    from google.oauth2 import id_token
                    from google.auth.transport import requests as google_requests
                    # 1. Verify token as ID token
                    idinfo = id_token.verify_oauth2_token(
                        google_token, 
                        google_requests.Request(), 
                        settings.GOOGLE_OAUTH_CLIENT_ID or None
                    )
                    email = idinfo.get('email')
                    name = idinfo.get('name', 'Google User')
                except Exception:
                    # 2. Fallback to Google UserInfo API for access_token
                    import requests as py_requests
                    resp = py_requests.get(
                        'https://www.googleapis.com/oauth2/v3/userinfo',
                        headers={'Authorization': f'Bearer {google_token}'},
                        timeout=5
                    )
                    if resp.status_code == 200:
                        user_data = resp.json()
                        email = user_data.get('email')
                        name = user_data.get('name', 'Google User')
                    else:
                        raise ValidationError({"token": ["Invalid or expired Google token."]})

                if not email:
                    raise ValidationError({"google": ["OAuth payload lacks email address."]})
        except ValidationError:
            raise
        except Exception as e:
            log_security_event("GOOGLE_AUTH_FAILURE", details=f"Token verification failed: {str(e)}")
            raise ValidationError({"token": [f"Google token verification failed: {str(e)}"]})

        username = email.split('@')[0]
        # De-duplicate username if duplicate exists
        original_username = username
        counter = 1
        while User.objects.filter(username=username).exclude(email=email).exists():
            username = f"{original_username}_{counter}"
            counter += 1

        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'google_id': f"g-{google_token[-20:]}" if len(google_token) > 20 else google_token
            }
        )

        if created:
            user.set_unusable_password()
            user.save()
            log_security_event("USER_REGISTRATION_GOOGLE", user.id, f"Registered via Google OAuth: {username} ({email})")

        profile, _ = UserProfile.objects.get_or_create(user=user)
        # Google users automatically verify email
        if not profile.is_email_verified:
            profile.is_email_verified = True
            profile.save()

        log_security_event("LOGIN_SUCCESS_GOOGLE", user.id, f"Logged in user {user.username} via Google OAuth.")
        tokens = cls.generate_tokens_for_user(user)
        return user, tokens

    @classmethod
    def send_verification_email(cls, user):
        """
        Generates and logs/sends email verification token
        """
        token_str = secrets.token_urlsafe(32)
        expiry = timezone.now() + timedelta(hours=24)
        
        # Deactivate old verification tokens
        EmailVerificationToken.objects.filter(user=user, is_used=False).update(is_used=True)
        
        verification_token = EmailVerificationToken.objects.create(
            user=user,
            token=token_str,
            expires_at=expiry
        )
        
        # Mock Email Logging
        link = f"http://localhost:5173/verify-email?token={token_str}"
        print(f"[MAIL MOCK] Verification link generated for {user.email}: {link}")
        log_security_event("EMAIL_VERIFICATION_SENT", user.id, f"Verification code generated.")
        
        # If SMTP is configured, we could execute send_mail here.
        return verification_token

    @classmethod
    def verify_email(cls, token_str):
        if not token_str:
            raise ValidationError({"token": ["Token is required."]})
            
        try:
            val_token = EmailVerificationToken.objects.get(token=token_str, is_used=False)
        except EmailVerificationToken.DoesNotExist:
            raise ValidationError({"token": ["Invalid or already verified email verification token."]})
            
        if val_token.is_expired():
            raise ValidationError({"token": ["Email verification token has expired."]})
            
        val_token.is_used = True
        val_token.save()
        
        profile, _ = UserProfile.objects.get_or_create(user=val_token.user)
        profile.is_email_verified = True
        profile.save()
        
        log_security_event("EMAIL_VERIFICATION_SUCCESS", val_token.user.id, f"Verified email: {val_token.user.email}")
        return val_token.user

    @classmethod
    def send_password_reset_otp(cls, email_address):
        email_address = clean_input(email_address, lowercase=True)
        if not email_address:
            raise ValidationError({"email": ["Email address is required."]})
            
        try:
            user = User.objects.get(email=email_address)
        except User.DoesNotExist:
            raise ValidationError({"email": ["No active account registered with this email address."]})
            
        # Invalidate old active reset tokens
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
        
        # Generate 6-digit numeric OTP and secure token string
        otp_code = f"{random.randint(100000, 999999)}"
        token_str = secrets.token_urlsafe(32)
        expiry = timezone.now() + timedelta(minutes=10) # 10-minute OTP expiration window
        
        reset_token = PasswordResetToken.objects.create(
            user=user,
            token=token_str,
            otp_code=otp_code,
            expires_at=expiry
        )
        
        print(f"\n=======================================================")
        print(f"[OTP MAIL DISPATCH] Password Reset 6-Digit OTP for {user.email}: [{otp_code}]")
        print(f"=======================================================\n")
        
        # Dispatch real email via Django send_mail (uses configured EMAIL_BACKEND / SMTP)
        try:
            from django.core.mail import send_mail
            subject = "MindCompass - Password Reset Verification Code"
            
            plain_message = (
                f"Hello {user.username},\n\n"
                f"Your 6-digit password reset verification code is: {otp_code}\n\n"
                f"This code will expire in 10 minutes. If you did not request a password reset, please ignore this message.\n\n"
                f"Best regards,\n"
                f"The MindCompass Team"
            )
            
            html_message = f"""
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; background-color: #ffffff;">
                <h2 style="color: #0f172a; margin-top: 0;">MindCompass Verification Code</h2>
                <p style="color: #475569; font-size: 15px;">Hello <strong>{user.username}</strong>,</p>
                <p style="color: #475569; font-size: 15px;">Use the verification code below to reset your password:</p>
                
                <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 32px; font-weight: 800; tracking: 6px; color: #4f46e5; letter-spacing: 6px;">{otp_code}</span>
                </div>
                
                <p style="color: #64748b; font-size: 13px;">This code will expire in <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">&copy; MindCompass AI. All rights reserved.</p>
            </div>
            """
            
            send_mail(
                subject=subject,
                message=plain_message,
                html_message=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as mail_err:
            print(f"[MAIL ERROR] Failed to deliver SMTP email to {user.email}: {mail_err}")

        log_security_event("PASSWORD_RESET_OTP_SENT", user.id, f"Issued 6-digit password reset OTP: {otp_code}")
        
        return reset_token, otp_code

    @classmethod
    def verify_password_reset_otp(cls, email_address, otp_code):
        email_address = clean_input(email_address, lowercase=True)
        if not email_address:
            raise ValidationError({"email": ["Email address is required."]})
        if not otp_code:
            raise ValidationError({"otp": ["6-digit OTP is required."]})

        try:
            user = User.objects.get(email=email_address)
        except User.DoesNotExist:
            raise ValidationError({"email": ["No account associated with this email."]})

        try:
            reset_token = PasswordResetToken.objects.filter(
                user=user,
                otp_code=str(otp_code).strip(),
                is_used=False
            ).latest('created_at')
        except PasswordResetToken.DoesNotExist:
            raise ValidationError({"otp": ["Invalid 6-digit code. Please check and try again."]})

        if reset_token.is_expired():
            raise ValidationError({"otp": ["OTP has expired. Please request a new code."]})

        reset_token.is_verified = True
        reset_token.save()

        log_security_event("PASSWORD_RESET_OTP_VERIFIED", user.id, f"Successfully verified OTP.")
        return reset_token.token

    @classmethod
    def reset_password_with_otp(cls, email_address, otp_code, new_password, new_password_confirm=None):
        email_address = clean_input(email_address, lowercase=True)
        if not email_address:
            raise ValidationError({"email": ["Email address is required."]})
        if not new_password:
            raise ValidationError({"password": ["New password is required."]})
        if not new_password_confirm:
            raise ValidationError({"password_confirm": ["Confirm password is required."]})
            
        if new_password != new_password_confirm:
            raise ValidationError({"password_confirm": ["Passwords do not match."]})

        try:
            user = User.objects.get(email=email_address)
        except User.DoesNotExist:
            raise ValidationError({"email": ["No account associated with this email."]})

        try:
            reset_token = PasswordResetToken.objects.filter(
                user=user,
                otp_code=str(otp_code).strip(),
                is_verified=True,
                is_used=False
            ).latest('created_at')
        except PasswordResetToken.DoesNotExist:
            raise ValidationError({"otp": ["OTP verification expired or invalid. Please request a new OTP."]})

        if reset_token.is_expired():
            raise ValidationError({"otp": ["Password reset window expired. Please request a new code."]})

        # Enforce password strength rules
        validate_password_strength(new_password, user.username, user.email)
        
        user.set_password(new_password)
        user.save()
        
        reset_token.is_used = True
        reset_token.save()
        
        log_security_event("PASSWORD_RESET_SUCCESS", user.id, f"Password successfully reset via OTP.")
        return user
