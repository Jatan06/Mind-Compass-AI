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

        profile.streak = MoodService.calculate_streak(request.user, today=client_today)
        profile.save()

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
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            today_str = request.query_params.get('today')
            from django.utils.dateparse import parse_date
            client_today = parse_date(today_str) if today_str else None
            
            from insights.services import InsightsService
            InsightsService.get_user_progress(request.user, today=client_today)
            
            profile.refresh_from_db()
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
