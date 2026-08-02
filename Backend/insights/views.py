from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import InsightsService

class InsightsAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        analytics = InsightsService.get_user_analytics(request.user)
        return Response(analytics, status=status.HTTP_200_OK)

class ProgressTrackView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today_str = request.query_params.get('today')
        from django.utils.dateparse import parse_date
        client_today = parse_date(today_str) if today_str else None
        
        progress = InsightsService.get_user_progress(request.user, today=client_today)
        return Response(progress, status=status.HTTP_200_OK)
