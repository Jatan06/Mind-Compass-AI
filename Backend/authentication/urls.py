from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView, GoogleLoginView, 
    ForgotPasswordView, VerifyResetOTPView, ResetPasswordView, VerifyEmailView, ResendVerificationView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('google-login/', GoogleLoginView.as_view(), name='auth_google_login'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth_forgot_password'),
    path('verify-reset-otp/', VerifyResetOTPView.as_view(), name='auth_verify_reset_otp'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth_reset_password'),
    path('verify-email/', VerifyEmailView.as_view(), name='auth_verify_email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='auth_resend_verification'),
    path('refresh/', TokenRefreshView.as_view(), name='auth_token_refresh'),
]

