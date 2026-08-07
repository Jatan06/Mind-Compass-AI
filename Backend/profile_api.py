import os
import sys
import time
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from insights.services import InsightsService
from recommendation.services import RecommendationService
from activities.services import ActivityService
from journal.services import JournalService
from ai.prediction.services import MoodPredictionService
from ai.insights.services import AIInsightsService

User = get_user_model()
user = User.objects.filter(username='demo').first() or User.objects.first()

if not user:
    print("No users in database.")
    sys.exit(0)

print(f"Profiling for user: {user.username} (ID: {user.id})")

import os
import sys
import time
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from insights.services import InsightsService

User = get_user_model()
user = User.objects.filter(username='demo').first() or User.objects.first()

print(f"Detailed Profile for: {user.username}")

import os
import sys
import time
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from insights.services import InsightsService

User = get_user_model()
user = User.objects.filter(username='demo').first() or User.objects.first()

def profile(func, name):
    start = time.time()
    try:
        res = func()
        elapsed = time.time() - start
        print(f"[{elapsed:.4f}s] {name}")
    except Exception as e:
        import traceback
        elapsed = time.time() - start
        print(f"[{elapsed:.4f}s] {name} - FAILED:")
        traceback.print_exc()

profile(lambda: InsightsService.get_user_analytics(user), "InsightsService.get_user_analytics")
profile(lambda: InsightsService.get_user_progress(user), "InsightsService.get_user_progress")
from recommendation.services import RecommendationService
from activities.services import ActivityService
from ai.prediction.services import MoodPredictionService
from ai.insights.services import AIInsightsService
from journal.services import JournalService
profile(lambda: RecommendationService.get_today_recommendation(user), "RecommendationService.get_today_recommendation")
profile(lambda: ActivityService.list_user_feedbacks(user), "ActivityService.list_user_feedbacks")
profile(lambda: MoodPredictionService.predict(user), "MoodPredictionService.predict")
profile(lambda: AIInsightsService.generate_insights(user), "AIInsightsService.generate_insights")

