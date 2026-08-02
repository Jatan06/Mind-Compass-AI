from django.urls import path
from .views import TodayRecommendationView, RecommendationHistoryView

urlpatterns = [
    path('today/', TodayRecommendationView.as_view(), name='recommendation_today'),
    path('history/', RecommendationHistoryView.as_view(), name='recommendation_history'),
]
