from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile
from .serializers import UserProfileSerializer

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        
        today_str = request.query_params.get('today')
        from django.utils.dateparse import parse_date
        client_today = parse_date(today_str) if today_str else None
        
        from mood.services import MoodService
        from ai.prediction.services import MoodPredictionService
        from insights.services import InsightsService

        # Recalculate wellness score and streak dynamically
        InsightsService.get_user_progress(request.user, today=client_today)
        profile.refresh_from_db()

        data = UserProfileSerializer(profile).data
        data["username"] = request.user.username
        data["email"] = request.user.email
        try:
            pred = MoodPredictionService.predict(request.user)
            data["predicted_mood"] = pred.get("predicted_mood")
        except Exception:
            data["predicted_mood"] = None
        return Response(data, status=status.HTTP_200_OK)

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        
        # Support updating User fields
        username = request.data.get('username')
        email = request.data.get('email')
        
        user_updated = False
        if username and username != request.user.username:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if User.objects.filter(username=username).exclude(id=request.user.id).exists():
                return Response({"errors": {"username": ["A user with that username already exists."]}}, status=status.HTTP_400_BAD_REQUEST)
            request.user.username = username
            user_updated = True
            
        if email and email != request.user.email:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if User.objects.filter(email=email).exclude(id=request.user.id).exists():
                return Response({"errors": {"email": ["A user with that email already exists."]}}, status=status.HTTP_400_BAD_REQUEST)
            request.user.email = email
            user_updated = True
            
        if user_updated:
            request.user.save()

        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            today_str = request.query_params.get('today')
            from django.utils.dateparse import parse_date
            client_today = parse_date(today_str) if today_str else None
            
            from insights.services import InsightsService
            InsightsService.get_user_progress(request.user, today=client_today)
            
            profile.refresh_from_db()
            data = UserProfileSerializer(profile).data
            data["username"] = request.user.username
            data["email"] = request.user.email
            return Response(data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        """
        Permanently deletes the authenticated user and all related data (profile,
        check-ins, journals, activities, etc.) via CASCADE on the User model.
        Requires the caller to pass {"confirm": "DELETE MY ACCOUNT"} in the request body.
        """
        confirmation = request.data.get('confirm', '')
        if confirmation != 'DELETE MY ACCOUNT':
            return Response(
                {"error": "Invalid confirmation. Send {\"confirm\": \"DELETE MY ACCOUNT\"} to proceed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        user.delete()   # CASCADE deletes UserProfile + all related records
        return Response({"message": "Account permanently deleted."}, status=status.HTTP_200_OK)
