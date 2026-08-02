from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from .services import MoodService
from .serializers import MoodLogSerializer

from ai.pipeline import AIServicePipeline

class MoodCheckInView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MoodLogSerializer(data=request.data)
        if serializer.is_valid():
            try:
                mood_log = MoodService.save_checkin(request.user, serializer.validated_data)
                # Generate Quick Recommendation immediately after check-in
                from recommendation.services import QuickRecommendationService
                QuickRecommendationService.get_quick_recommendation(request.user, force_recalculate=True)
                # Trigger unified AI pipeline if both checks are complete (e.g. journal submitted first)
                AIServicePipeline.run_pipeline_if_ready(request.user)
                response_serializer = MoodLogSerializer(mood_log)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            except ValidationError as e:
                return Response({'error': str(e.message)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MoodHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        history = MoodService.get_user_history(request.user)
        serializer = MoodLogSerializer(history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
