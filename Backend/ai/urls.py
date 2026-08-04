from django.urls import path
from .views import (
    SentimentAnalysisView,
    EmotionDetectionView,
    KeywordExtractionView,
    CrisisDetectionView,
    MoodPredictionView,
    AIInsightsView
)
from .companion.views import CompanionChatView

urlpatterns = [
    path('sentiment/', SentimentAnalysisView.as_view(), name='ai-sentiment'),
    path('emotion/', EmotionDetectionView.as_view(), name='ai-emotion'),
    path('keywords/', KeywordExtractionView.as_view(), name='ai-keywords'),
    path('crisis/', CrisisDetectionView.as_view(), name='ai-crisis'),
    path('prediction/', MoodPredictionView.as_view(), name='ai-prediction'),
    path('insights/', AIInsightsView.as_view(), name='ai-insights'),
    path('companion/', CompanionChatView.as_view(), name='ai-companion'),
]
