from django.urls import path
from .views import MoodCheckInView, MoodHistoryView

urlpatterns = [
    path('', MoodCheckInView.as_view(), name='mood_checkin'),
    path('history/', MoodHistoryView.as_view(), name='mood_history'),
]
