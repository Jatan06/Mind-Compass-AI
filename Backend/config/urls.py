from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from users.views import ProfileView, DeleteAccountView
from insights.views import ProgressTrackView
from activities.views import ActivityFeedbackView


def api_health(request):
    return JsonResponse({
        "status": "ok",
        "service": "MindCompass API",
        "version": "1.0.0",
        "docs": "https://github.com/Jatan06/Mind-Compass-AI"
    })


urlpatterns = [
    path('', api_health, name='api_health'),
    path('admin/', admin.site.urls),
    
    # App routers
    path('api/auth/', include('authentication.urls')),
    path('api/assessment/', include('assessment.urls')),
    path('api/mood/', include('mood.urls')),
    path('api/journal/', include('journal.urls')),
    path('api/activities/', include('activities.urls')),
    path('api/recommendation/', include('recommendation.urls')),
    path('api/insights/', include('insights.urls')),
    path('api/ai/', include('ai.urls')),
    
    # Custom direct endpoints matching steps
    path('api/profile/', ProfileView.as_view(), name='api_profile'),
    path('api/account/delete/', DeleteAccountView.as_view(), name='api_account_delete'),
    path('api/progress/', ProgressTrackView.as_view(), name='api_progress'),
    path('api/activity-feedback/', ActivityFeedbackView.as_view(), name='api_activity_feedback'),
]
