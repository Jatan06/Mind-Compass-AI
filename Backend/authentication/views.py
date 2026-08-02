from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth import get_user_model
from users.serializers import UserSerializer
from .services import AuthService

User = get_user_model()

def validation_error_response(exc, default_message="Validation failed"):
    """
    Standard format generator for validation errors.
    Formats ValidationError detail dict into:
    {
        "success": false,
        "message": default_message,
        "errors": {
            "field": ["detail"]
        }
    }
    """
    errors_dict = {}
    if hasattr(exc, 'detail') and isinstance(exc.detail, dict):
        for field, detail_list in exc.detail.items():
            if isinstance(detail_list, list):
                errors_dict[field] = [str(d) for d in detail_list]
            else:
                errors_dict[field] = [str(detail_list)]
    elif hasattr(exc, 'detail') and isinstance(exc.detail, list):
        errors_dict['non_field_errors'] = [str(d) for d in exc.detail]
    else:
        errors_dict['non_field_errors'] = [str(exc)]
        
    return Response({
        "success": False,
        "message": default_message,
        "errors": errors_dict
    }, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        password_confirm = request.data.get('password_confirm')

        try:
            user, tokens = AuthService.register_user(
                username=username,
                email=email,
                password=password,
                password_confirm=password_confirm
            )
            serializer = UserSerializer(user)
            return Response({
                "success": True,
                "message": "Registration successful. Please verify your email.",
                "user": serializer.data,
                "tokens": tokens
            }, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return validation_error_response(e, "Registration validation failed")
        except Exception as e:
            return Response({
                "success": False,
                "message": "An unexpected error occurred during registration.",
                "errors": {"non_field_errors": [str(e)]}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email_or_username = request.data.get('email') or request.data.get('username')
        password = request.data.get('password')

        try:
            user, tokens = AuthService.authenticate_user(email_or_username, password)
            serializer = UserSerializer(user)
            return Response({
                "success": True,
                "message": "Login successful.",
                "user": serializer.data,
                "tokens": tokens
            }, status=status.HTTP_200_OK)
        except ValidationError as e:
            return validation_error_response(e, "Login validation failed")
        except Exception as e:
            return Response({
                "success": False,
                "message": "An unexpected error occurred during login.",
                "errors": {"non_field_errors": [str(e)]}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({
                "success": False,
                "message": "Logout failed",
                "errors": {"refresh": ["Refresh token is required."]}
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({
                "success": True,
                "message": "Successfully logged out."
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "success": False,
                "message": "Logout failed",
                "errors": {"refresh": [f"Invalid refresh token: {str(e)}"]}
            }, status=status.HTTP_400_BAD_REQUEST)

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        email = request.data.get('email')
        name = request.data.get('name')

        try:
            user, tokens = AuthService.authenticate_google_user(token, email, name)
            serializer = UserSerializer(user)
            return Response({
                "success": True,
                "message": "Google authentication successful.",
                "user": serializer.data,
                "tokens": tokens
            }, status=status.HTTP_200_OK)
        except ValidationError as e:
            return validation_error_response(e, "Google authentication failed")
        except Exception as e:
            return Response({
                "success": False,
                "message": "An unexpected error occurred during Google authentication.",
                "errors": {"non_field_errors": [str(e)]}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        try:
            AuthService.send_password_reset_email(email)
            return Response({
                "success": True,
                "message": "If user account matches, a password reset link has been dispatched."
            }, status=status.HTTP_200_OK)
        except ValidationError as e:
            return validation_error_response(e, "Forgot password request failed")
        except Exception as e:
            return Response({
                "success": False,
                "message": "An unexpected error occurred processing password reset request.",
                "errors": {"non_field_errors": [str(e)]}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        password = request.data.get('password')
        password_confirm = request.data.get('password_confirm')

        try:
            AuthService.reset_password(token, password, password_confirm)
            return Response({
                "success": True,
                "message": "Password has been reset successfully."
            }, status=status.HTTP_200_OK)
        except ValidationError as e:
            return validation_error_response(e, "Password reset failed")
        except Exception as e:
            return Response({
                "success": False,
                "message": "An unexpected error occurred during password reset.",
                "errors": {"non_field_errors": [str(e)]}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get('token')
        try:
            AuthService.verify_email(token)
            return Response({
                "success": True,
                "message": "Email verified successfully."
            }, status=status.HTTP_200_OK)
        except ValidationError as e:
            return validation_error_response(e, "Email verification failed")
        except Exception as e:
            return Response({
                "success": False,
                "message": "An unexpected error occurred during email verification.",
                "errors": {"non_field_errors": [str(e)]}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ResendVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({
                "success": False,
                "message": "Resend failed",
                "errors": {"email": ["Email address is required."]}
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            try:
                user = User.objects.get(email=email.strip().lower())
            except User.DoesNotExist:
                raise ValidationError({"email": ["No account matching this email address was found."]})
            
            profile = user.profile
            if profile.is_email_verified:
                return Response({
                    "success": False,
                    "message": "Email is already verified.",
                    "errors": {"email": ["This email has already been verified."]}
                }, status=status.HTTP_400_BAD_REQUEST)

            AuthService.send_verification_email(user)
            return Response({
                "success": True,
                "message": "Verification link has been sent successfully."
            }, status=status.HTTP_200_OK)
        except ValidationError as e:
            return validation_error_response(e, "Resend verification failed")
        except Exception as e:
            return Response({
                "success": False,
                "message": "An unexpected error occurred during resending verification.",
                "errors": {"non_field_errors": [str(e)]}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
