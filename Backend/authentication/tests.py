from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from datetime import timedelta

from .services import AuthService
from .models import PasswordResetToken, EmailVerificationToken
from users.models import UserProfile

User = get_user_model()

class RegistrationValidationTestCase(TestCase):
    def test_successful_registration(self):
        user, tokens = AuthService.register_user(
            username="Valid_User1",
            email="ValidEmail@example.com",
            password="StrongPassword123!",
            password_confirm="StrongPassword123!"
        )
        self.assertEqual(user.username, "valid_user1")  # lowercase check
        self.assertEqual(user.email, "validemail@example.com")  # lowercase check
        self.assertFalse(user.profile.is_email_verified)
        self.assertIn("access", tokens)
        self.assertIn("refresh", tokens)

    def test_invalid_username_rules(self):
        # Username too short
        with self.assertRaises(ValidationError) as ctx:
            AuthService.register_user("usr", "test@example.com", "Pass1234!", "Pass1234!")
        self.assertIn("username", ctx.exception.detail)
        
        # Starts with a number
        with self.assertRaises(ValidationError) as ctx:
            AuthService.register_user("1user", "test@example.com", "Pass1234!", "Pass1234!")
        self.assertIn("username", ctx.exception.detail)
        
        # Invalid characters/spaces
        with self.assertRaises(ValidationError) as ctx:
            AuthService.register_user("user name", "test@example.com", "Pass1234!", "Pass1234!")
        self.assertIn("username", ctx.exception.detail)

    def test_invalid_email_rules(self):
        # Invalid RFC format
        with self.assertRaises(ValidationError) as ctx:
            AuthService.register_user("testuser", "invalid-email@", "Pass1234!", "Pass1234!")
        self.assertIn("email", ctx.exception.detail)
        
        # Empty email
        with self.assertRaises(ValidationError) as ctx:
            AuthService.register_user("testuser", "", "Pass1234!", "Pass1234!")
        self.assertIn("email", ctx.exception.detail)

    def test_password_complexity_rules(self):
        # Too short
        with self.assertRaises(ValidationError) as ctx:
            AuthService.register_user("testuser", "test@example.com", "P1!", "P1!")
        self.assertIn("password", ctx.exception.detail)
        
        # No capital letter
        with self.assertRaises(ValidationError) as ctx:
            AuthService.register_user("testuser", "test@example.com", "low12345!", "low12345!")
        self.assertIn("password", ctx.exception.detail)
        
        # No special character
        with self.assertRaises(ValidationError) as ctx:
            AuthService.register_user("testuser", "test@example.com", "NoSpecial123", "NoSpecial123")
        self.assertIn("password", ctx.exception.detail)
        
        # Matches username
        with self.assertRaises(ValidationError) as ctx:
            AuthService.register_user("testuser", "test@example.com", "testuser", "testuser")
        self.assertIn("password", ctx.exception.detail)

        # Mismatch confirm
        with self.assertRaises(ValidationError) as ctx:
            AuthService.register_user("testuser", "test@example.com", "Pass1234!", "Pass1234?Different")
        self.assertIn("password_confirm", ctx.exception.detail)


class LoginValidationTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="loginuser",
            email="loginuser@example.com",
            password="StrongPassword123!"
        )

    def test_login_with_username_success(self):
        user, tokens = AuthService.authenticate_user("loginuser", "StrongPassword123!")
        self.assertEqual(user, self.user)
        self.assertIn("access", tokens)

    def test_login_with_email_success(self):
        user, tokens = AuthService.authenticate_user("LOGINUSER@EXAMPLE.COM", "StrongPassword123!")
        self.assertEqual(user, self.user)
        self.assertIn("access", tokens)

    def test_login_invalid_password(self):
        with self.assertRaises(ValidationError) as ctx:
            AuthService.authenticate_user("loginuser", "WrongPassword!")
        self.assertIn("non_field_errors", ctx.exception.detail)

    def test_login_inactive_user(self):
        self.user.is_active = False
        self.user.save()
        with self.assertRaises(ValidationError) as ctx:
            AuthService.authenticate_user("loginuser", "StrongPassword123!")
        self.assertIn("non_field_errors", ctx.exception.detail)


class GoogleOAuthTestCase(TestCase):
    def test_mock_google_login_success(self):
        # Verify mock token path handles user creation & token generation
        user, tokens = AuthService.authenticate_google_user(
            google_token="mock-google-token-xyz12345",
            email="googletest@example.com",
            name="Google Test User"
        )
        self.assertEqual(user.email, "googletest@example.com")
        self.assertEqual(user.username, "googletest")
        self.assertTrue(user.profile.is_email_verified)
        self.assertIn("access", tokens)

    def test_google_login_invalid_token_rejected(self):
        # Non-mock token will attempt live Google auth which fails without a valid net payload
        with self.assertRaises(ValidationError) as ctx:
            AuthService.authenticate_google_user(google_token="real_unverified_token")
        self.assertIn("token", ctx.exception.detail)


class EmailVerificationTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="verifyuser",
            email="verifyuser@example.com",
            password="StrongPassword123!"
        )
        UserProfile.objects.get_or_create(user=self.user)

    def test_verification_lifecycle(self):
        # Generate token
        token_obj = AuthService.send_verification_email(self.user)
        self.assertEqual(token_obj.user, self.user)
        self.assertFalse(self.user.profile.is_email_verified)
        
        # Verify email using generated token
        verified_user = AuthService.verify_email(token_obj.token)
        self.assertEqual(verified_user, self.user)
        self.assertTrue(verified_user.profile.is_email_verified)
        
        # Check token marked used
        token_obj.refresh_from_db()
        self.assertTrue(token_obj.is_used)

    def test_expired_verification_token(self):
        token_obj = AuthService.send_verification_email(self.user)
        # Shift expires_at into the past
        token_obj.expires_at = timezone.now() - timedelta(minutes=1)
        token_obj.save()
        
        with self.assertRaises(ValidationError) as ctx:
            AuthService.verify_email(token_obj.token)
        self.assertIn("token", ctx.exception.detail)


class PasswordResetTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="resetuser",
            email="resetuser@example.com",
            password="OldPassword123!"
        )
        UserProfile.objects.get_or_create(user=self.user)

    def test_reset_lifecycle(self):
        # 1. Request reset OTP
        reset_token_obj, otp_code = AuthService.send_password_reset_otp("resetuser@example.com")
        self.assertEqual(reset_token_obj.user, self.user)
        
        # 2. Verify OTP
        token_str = AuthService.verify_password_reset_otp("resetuser@example.com", otp_code)
        self.assertTrue(token_str)

        # 3. Reset with new password
        AuthService.reset_password_with_otp(
            email_address="resetuser@example.com",
            otp_code=otp_code,
            new_password="NewStrongPassword123!",
            new_password_confirm="NewStrongPassword123!"
        )
        
        # 4. Authenticate with new password
        user, tokens = AuthService.authenticate_user("resetuser", "NewStrongPassword123!")
        self.assertEqual(user, self.user)
        
        # Check token is marked used
        reset_token_obj.refresh_from_db()
        self.assertTrue(reset_token_obj.is_used)

    def test_expired_reset_token(self):
        reset_token_obj, otp_code = AuthService.send_password_reset_otp("resetuser@example.com")
        reset_token_obj.expires_at = timezone.now() - timedelta(minutes=1)
        reset_token_obj.save()
        
        with self.assertRaises(ValidationError) as ctx:
            AuthService.verify_password_reset_otp("resetuser@example.com", otp_code)
        self.assertIn("otp", ctx.exception.detail)

    def test_invalid_reset_password_rules(self):
        reset_token_obj, otp_code = AuthService.send_password_reset_otp("resetuser@example.com")
        AuthService.verify_password_reset_otp("resetuser@example.com", otp_code)
        
        # Password fails validation rules (missing uppercase/special char or matches username)
        with self.assertRaises(ValidationError) as ctx:
            AuthService.reset_password_with_otp("resetuser@example.com", otp_code, "resetuser", "resetuser")
        self.assertIn("password", ctx.exception.detail)
