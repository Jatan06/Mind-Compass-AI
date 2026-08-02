from django.urls import path
from .views import InsightsAnalyticsView

urlpatterns = [
    path('', InsightsAnalyticsView.as_view(), name='insights_analytics'),
]
