from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from users.models import UserProfile
from mood.models import MoodLog
from mood.services import MoodService

User = get_user_model()

class StreakCalculationTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='Password123!')
        self.profile = UserProfile.objects.create(user=self.user)

    def test_first_checkin_streak(self):
        # Initial streak should be 0
        self.assertEqual(MoodService.calculate_streak(self.user), 0)
        
        # Log first check-in today
        today = timezone.now().date()
        MoodService.save_checkin(self.user, {
            'date': today,
            'mood': 4,
            'mood_label': 'Good',
            'stress': 2,
            'energy': 3,
            'sleep': 8,
            'productivity': 4,
            'social': 3,
            'notes': 'First log'
        })
        
        self.assertEqual(MoodService.calculate_streak(self.user), 1)

    def test_consecutive_checkins_streak(self):
        today = timezone.now().date()
        
        # Log for today - 2 days ago
        MoodLog.objects.create(
            user=self.user,
            date=today - timezone.timedelta(days=2),
            mood=3, mood_label='Neutral', stress=2, energy=3, sleep=7, productivity=5, social=4
        )
        # Log for yesterday (today - 1 day ago)
        MoodLog.objects.create(
            user=self.user,
            date=today - timezone.timedelta(days=1),
            mood=4, mood_label='Good', stress=2, energy=3, sleep=8, productivity=6, social=5
        )
        # Log for today
        MoodLog.objects.create(
            user=self.user,
            date=today,
            mood=5, mood_label='Excellent', stress=1, energy=4, sleep=8, productivity=7, social=6
        )
        
        # Check streak calculation
        self.assertEqual(MoodService.calculate_streak(self.user, today=today), 3)

    def test_missed_day_streak(self):
        today = timezone.now().date()
        
        # Log for today - 3 days ago
        MoodLog.objects.create(
            user=self.user,
            date=today - timezone.timedelta(days=3),
            mood=3, mood_label='Neutral', stress=2, energy=3, sleep=7, productivity=5, social=4
        )
        # Skip today - 2 days ago and yesterday, log for today
        MoodLog.objects.create(
            user=self.user,
            date=today,
            mood=4, mood_label='Good', stress=2, energy=3, sleep=8, productivity=6, social=5
        )
        
        # The streak should reset to 1 day because of the gap
        self.assertEqual(MoodService.calculate_streak(self.user, today=today), 1)

    def test_inactive_streak(self):
        today = timezone.now().date()
        
        # Log for 5 days ago, then no check-ins since
        MoodLog.objects.create(
            user=self.user,
            date=today - timezone.timedelta(days=5),
            mood=3, mood_label='Neutral', stress=2, energy=3, sleep=7, productivity=5, social=4
        )
        
        # The streak should be 0 because the last check-in is older than yesterday
        self.assertEqual(MoodService.calculate_streak(self.user, today=today), 0)

    def test_multiple_checkins_same_day_no_streak_increase(self):
        today = timezone.now().date()
        
        # Log 1 for today
        MoodLog.objects.create(
            user=self.user,
            date=today,
            mood=4, mood_label='Good', stress=2, energy=3, sleep=8, productivity=6, social=5
        )
        
        # Verify that calculate_streak retrieves only distinct dates
        streak = MoodService.calculate_streak(self.user, today=today)
        self.assertEqual(streak, 1)

from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status

class MoodCheckInAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testapiuser', email='api@example.com', password='Password123!')
        self.profile = UserProfile.objects.create(user=self.user)
        self.client.force_authenticate(user=self.user)

    def test_first_mood_submission(self):
        # 1. First mood submission: POSTing to /api/mood/ returns 201 Created and saves it
        today = timezone.now().date().strftime("%Y-%m-%d")
        url = reverse('mood_checkin')
        
        response = self.client.post(url, {
            'date': today,
            'mood': 4,
            'mood_label': 'Good',
            'stress': 2,
            'energy': 3,
            'sleep': 8,
            'productivity': 4,
            'social': 3,
            'notes': 'API Log'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['mood'], 4)
        self.assertEqual(response.data['date'], today)

    def test_dashboard_refresh_after_submission(self):
        # 2. Dashboard refresh after submission: GET history should return a populated list
        today = timezone.now().date().strftime("%Y-%m-%d")
        
        # Initially history is empty
        history_url = reverse('mood_history')
        response = self.client.get(history_url)
        self.assertEqual(len(response.data), 0)
        
        # Submit mood
        checkin_url = reverse('mood_checkin')
        self.client.post(checkin_url, {
            'date': today,
            'mood': 4,
            'mood_label': 'Good',
            'stress': 2,
            'energy': 3,
            'sleep': 8,
            'productivity': 4,
            'social': 3,
            'notes': 'API Log'
        })
        
        # Verify history is immediately updated (dashboard refresh logic queries this endpoint)
        response = self.client.get(history_url)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['date'], today)

    def test_no_mood_submitted_today(self):
        # 3. No mood submitted today: GET history should return empty or not contain today
        history_url = reverse('mood_history')
        response = self.client.get(history_url)
        self.assertEqual(len(response.data), 0)

    def test_existing_mood_from_today_rejects(self):
        # First submission succeeds
        today = timezone.now().date()
        today_str = today.strftime("%Y-%m-%d")
        url = reverse('mood_checkin')
        
        payload = {
            'date': today_str,
            'mood': 4,
            'mood_label': 'Good',
            'stress': 2,
            'energy': 3,
            'sleep': 8,
            'productivity': 4,
            'social': 3,
            'notes': 'Original'
        }
        res1 = self.client.post(url, payload)
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # Second submission on the same day is rejected
        payload['notes'] = 'Duplicate Submission Try'
        res2 = self.client.post(url, payload)
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        
        # User can submit again on the next day
        tomorrow_str = (today + timezone.timedelta(days=1)).strftime("%Y-%m-%d")
        payload['date'] = tomorrow_str
        payload['notes'] = 'Next Day Submission'
        res3 = self.client.post(url, payload)
        self.assertEqual(res3.status_code, status.HTTP_201_CREATED)

        # Journal remains unrestricted (multiple posts permitted per day)
        journal_url = reverse('journal_list_create')
        res_j1 = self.client.post(journal_url, {'text': 'First Entry of the Day'})
        self.assertEqual(res_j1.status_code, status.HTTP_201_CREATED)
        res_j2 = self.client.post(journal_url, {'text': 'Second Entry of the Day'})
        self.assertEqual(res_j2.status_code, status.HTTP_201_CREATED)

    def test_timezone_aware_profile_streak(self):
        # 1. Simulate checkin saved on user local timezone date which is 1 day ahead of server UTC today
        server_today = timezone.now().date()
        local_today = server_today + timezone.timedelta(days=1)
        
        # Log a check-in for local_today
        MoodLog.objects.create(
            user=self.user,
            date=local_today,
            mood=4, mood_label='Good', stress=2, energy=3, sleep=8, productivity=6, social=5
        )
        
        # 2. Querying GET /api/profile/ without parameter (uses Server UTC date - 1 day behind local_today)
        # Should reset streak to 0 because server thinks it's in the "future" or not today/yesterday in server's map
        url = reverse('api_profile')
        res_no_param = self.client.get(url)
        self.assertEqual(res_no_param.status_code, status.HTTP_200_OK)
        self.assertEqual(res_no_param.data['streak'], 0)
        
        # 3. Querying GET /api/profile/ WITH local_today date passed.
        # Should return streak 1 because it evaluates with the correct reference date
        res_with_param = self.client.get(url, {'today': local_today.strftime("%Y-%m-%d")})
        self.assertEqual(res_with_param.status_code, status.HTTP_200_OK)
        self.assertEqual(res_with_param.data['streak'], 1)
