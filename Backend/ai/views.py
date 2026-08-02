from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .sentiment.services import SentimentAnalysisService
from .emotions.services import EmotionDetectionService
from .keywords.services import KeywordExtractionService
from .crisis.services import CrisisDetectionService
from .prediction.services import MoodPredictionService
from .insights.services import AIInsightsService

from .serializers import (
    SentimentRequestSerializer, SentimentResponseSerializer,
    EmotionRequestSerializer, EmotionResponseSerializer,
    KeywordRequestSerializer, KeywordResponseSerializer,
    CrisisRequestSerializer, CrisisResponseSerializer,
    MoodPredictionResponseSerializer,
    AIInsightsResponseSerializer
)

class SentimentAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        req_serializer = SentimentRequestSerializer(data=request.data)
        if req_serializer.is_valid():
            text = req_serializer.validated_data['text']
            result = SentimentAnalysisService.analyze(text)
            res_serializer = SentimentResponseSerializer(result)
            return Response(res_serializer.data, status=status.HTTP_200_OK)
        return Response(req_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmotionDetectionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        req_serializer = EmotionRequestSerializer(data=request.data)
        if req_serializer.is_valid():
            text = req_serializer.validated_data['text']
            result = EmotionDetectionService.detect(text)
            res_serializer = EmotionResponseSerializer(result)
            return Response(res_serializer.data, status=status.HTTP_200_OK)
        return Response(req_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class KeywordExtractionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        req_serializer = KeywordRequestSerializer(data=request.data)
        if req_serializer.is_valid():
            text = req_serializer.validated_data['text']
            result = KeywordExtractionService.extract(text)
            res_serializer = KeywordResponseSerializer(result)
            return Response(res_serializer.data, status=status.HTTP_200_OK)
        return Response(req_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CrisisDetectionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        req_serializer = CrisisRequestSerializer(data=request.data)
        if req_serializer.is_valid():
            text = req_serializer.validated_data['text']
            result = CrisisDetectionService.detect(text)
            res_serializer = CrisisResponseSerializer(result)
            return Response(res_serializer.data, status=status.HTTP_200_OK)
        return Response(req_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MoodPredictionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        from mood.models import MoodLog
        from journal.models import JournalEntry
        today = timezone.localdate()
        has_mood = MoodLog.objects.filter(user=request.user, date=today).exists()
        has_journal = JournalEntry.objects.filter(user=request.user, created_at__date=today).exists()
        
        if not (has_mood and has_journal):
            return Response({
                'pending': True,
                'detail': "Complete today's mood check-in and journal to receive today's mood prediction."
            }, status=status.HTTP_200_OK)

        result = MoodPredictionService.predict(request.user)
        res_serializer = MoodPredictionResponseSerializer(result)
        return Response(res_serializer.data, status=status.HTTP_200_OK)

class AIInsightsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        from mood.models import MoodLog
        from journal.models import JournalEntry
        today = timezone.localdate()
        has_mood = MoodLog.objects.filter(user=request.user, date=today).exists()
        has_journal = JournalEntry.objects.filter(user=request.user, created_at__date=today).exists()
        
        if not (has_mood and has_journal):
            return Response({
                'pending': True,
                'detail': "Complete today's mood check-in and journal to receive today's Emotional Twin insights."
            }, status=status.HTTP_200_OK)

        result = AIInsightsService.generate_insights(request.user)
        res_serializer = AIInsightsResponseSerializer(result)
        return Response(res_serializer.data, status=status.HTTP_200_OK)
