import os
import django
import sys

# Setup django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from insights.services import InsightsService

User = get_user_model()

def verify():
    # 1. Verify existing personas
    personas = [
        'emily_healthy',   # Expected: High
        'alex_student',    # Expected: Moderate/High recovery
        'sarah_engineer',  # Expected: Moderate/Burnout
        'priya_recovery',  # Expected: Improving/Moderate
        'ethan_crisis'     # Expected: Low
    ]

    print("\n--- Verifying Seeded User Wellness Scores ---")
    for username in personas:
        try:
            user = User.objects.get(username=username)
            prog = InsightsService.get_user_progress(user)
            print(f"User: {username:16} | Wellness Score: {prog['wellnessScore']} | has_wellness_score: {prog['has_wellness_score']}")
        except User.DoesNotExist:
            print(f"User {username} not found. Please make sure database is seeded.")

    # 2. Verify a brand new user with no data
    new_username = "temporary_new_user"
    User.objects.filter(username=new_username).delete()
    new_user = User.objects.create_user(username=new_username, email="temp.user@gmail.com", password="Password123!")
    
    print("\n--- Verifying Brand New User with 0 logs/journals ---")
    prog_new = InsightsService.get_user_progress(new_user)
    print(f"User: {new_username:16} | Wellness Score: {prog_new['wellnessScore']} | has_wellness_score: {prog_new['has_wellness_score']} | Message: {prog_new.get('message')}")
    
    # Assert correctness
    assert prog_new['has_wellness_score'] is False, "New user has_wellness_score must be False!"
    assert prog_new['wellnessScore'] is None, "New user wellnessScore must be None!"
    print("SUCCESS: Brand new user returned correct empty state values.")
    
    # Clean up
    new_user.delete()
    print("Verified successfully!")

if __name__ == "__main__":
    verify()
