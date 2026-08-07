from django.test import TestCase
from users.models import User
from django.utils import timezone
from activities.models import TherapyActivity
from recommendation.models import Recommendation
from recommendation.services import RecommendationService
from mood.models import MoodLog
from assessment.models import AssessmentResponse
from users.models import UserProfile
from journal.models import JournalEntry

class RecommendationServiceTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='recuser', email='rec@example.com', password='Password123!') # type: ignore
        self.profile = UserProfile.objects.create(user=self.user)
        
        # Create activities with proper metadata for the new organic Suitability Score engine
        act_configs = {
            'act-1': {'title': 'Box Breathing', 'stress': [7,10], 'mood': [1,10], 'topics': ['stress', 'panic', 'anxiety']},
            'act-12': {'title': '3-Min Breathing', 'stress': [1,6], 'mood': [2,8], 'topics': ['calm', 'default']},
            'act-15': {'title': '10-3-2-1-0 Sleep Protocol', 'stress': [1,10], 'mood': [1,10], 'topics': ['sleep', 'insomnia', 'night']},
            'act-16': {'title': 'PMR', 'stress': [1,10], 'mood': [1,10], 'topics': ['sleep', 'insomnia', 'rest']},
            'act-17': {'title': 'Three Good Things', 'stress': [1,10], 'mood': [1,10], 'topics': ['gratitude', 'happy']},
            'act-33': {'title': '5-4-3-2-1 Grounding', 'stress': [1,10], 'mood': [1,10], 'topics': ['anxiety', 'panic', 'overwhelmed', 'grounding']},
            'act-37': {'title': 'Somatic Shakeout', 'stress': [1,10], 'mood': [1,10], 'topics': ['energy', 'fatigue', 'tired']}
        }
        
        self.acts = {}
        for s, conf in act_configs.items():
            self.acts[s] = TherapyActivity.objects.create(
                id=s,
                title=conf['title'],
                category="Mindfulness" if s not in ['act-15', 'act-16'] else "Sleep Hygiene",
                duration="10 mins",
                difficulty="Easy",
                description="Test activity description",
                instructions=["Step 1", "Step 2"],
                stress_range=conf['stress'],
                mood_range=conf['mood'],
                topics=conf['topics'],
                emotions=["calm", "neutral"]
            )

    def test_returns_none_if_data_missing(self):
        # Missing both
        rec = RecommendationService.get_today_recommendation(self.user)
        self.assertIsNone(rec)
        
        # Missing journal
        MoodLog.objects.create(
            user=self.user, date=timezone.localdate(),
            mood=3, mood_label="Neutral", stress=5, energy=5, sleep=7.0, productivity=5, social=5
        )
        rec = RecommendationService.get_today_recommendation(self.user)
        self.assertIsNone(rec)

    def test_default_fallback_without_goals(self):
        # Create neutral mood log and default journal
        today = timezone.localdate()
        MoodLog.objects.create(
            user=self.user, date=today,
            mood=3, mood_label="Neutral", stress=5, energy=5, sleep=7.0, productivity=5, social=5
        )
        JournalEntry.objects.create(
            user=self.user, text="A simple typical day today."
        )
        rec = RecommendationService.get_today_recommendation(self.user)
        self.assertIsNotNone(rec)
        self.assertEqual(rec.activity.id, 'act-12')
        self.assertTrue(len(rec.reasons_list) > 0)

    def test_onboarding_goals_fallback(self):
        # Setup assessment response with sleep goal
        AssessmentResponse.objects.create(
            user=self.user,
            raw_data={"goals": ["Improve sleep quality", "Reduce anxiety"]}
        )
        today = timezone.localdate()
        MoodLog.objects.create(
            user=self.user, date=today,
            mood=3, mood_label="Neutral", stress=5, energy=5, sleep=7.0, productivity=5, social=5
        )
        JournalEntry.objects.create(
            user=self.user, text="A simple typical day today."
        )
        rec = RecommendationService.get_today_recommendation(self.user)
        self.assertIsNotNone(rec)
        self.assertIn(rec.activity.id, ['act-15', 'act-16']) # Sleep-targeted activity
        self.assertTrue(len(rec.reasons_list) > 0)

    def test_rule_high_stress(self):
        today = timezone.localdate()
        MoodLog.objects.create(
            user=self.user,
            date=today,
            mood=3, mood_label="Neutral",
            stress=8, # High stress
            energy=5, sleep=7.0, productivity=5, social=5
        )
        JournalEntry.objects.create(
            user=self.user, text="Just a day."
        )
        rec = RecommendationService.get_today_recommendation(self.user)
        self.assertEqual(rec.activity.id, 'act-1') # Box Breathing
        self.assertTrue(len(rec.reasons_list) > 0)

    def test_rule_low_energy(self):
        today = timezone.localdate()
        MoodLog.objects.create(
            user=self.user,
            date=today,
            mood=3, mood_label="Neutral",
            stress=4,
            energy=2, # Low energy
            sleep=7.0, productivity=5, social=5
        )
        JournalEntry.objects.create(
            user=self.user, text="Just a day."
        )
        rec = RecommendationService.get_today_recommendation(self.user)
        self.assertEqual(rec.activity.id, 'act-37') # Somatic Shakeout
        self.assertTrue(len(rec.reasons_list) > 0)

    def test_rule_poor_sleep(self):
        today = timezone.localdate()
        MoodLog.objects.create(
            user=self.user,
            date=today,
            mood=3, mood_label="Neutral",
            stress=4, energy=6,
            sleep=5.0, # Poor sleep
            productivity=5, social=5
        )
        JournalEntry.objects.create(
            user=self.user, text="Just a day."
        )
        rec = RecommendationService.get_today_recommendation(self.user)
        self.assertEqual(rec.activity.id, 'act-15') # 10-3-2-1-0 Sleep Protocol
        self.assertTrue(len(rec.reasons_list) > 0)

    def test_rule_anxiety_overthinking(self):
        today = timezone.localdate()
        MoodLog.objects.create(
            user=self.user,
            date=today,
            mood=2, mood_label="Down", # Low mood
            stress=4, energy=6, sleep=7.5, productivity=5, social=5,
            notes="Feeling so stuck and anxious today"
        )
        JournalEntry.objects.create(
            user=self.user, text="Feeling so stuck and anxious today"
        )
        rec = RecommendationService.get_today_recommendation(self.user)
        self.assertEqual(rec.activity.id, 'act-33') # 5-4-3-2-1 Grounding
        self.assertTrue(len(rec.reasons_list) > 0)

    def test_rule_happy_mood(self):
        today = timezone.localdate()
        MoodLog.objects.create(
            user=self.user,
            date=today,
            mood=5, mood_label="Excellent", # Happy
            stress=2, energy=8, sleep=8.0, productivity=8, social=7
        )
        JournalEntry.objects.create(
            user=self.user, text="A happy day."
        )
        rec = RecommendationService.get_today_recommendation(self.user)
        self.assertEqual(rec.activity.id, 'act-17') # Three Good Things
        self.assertTrue(len(rec.reasons_list) > 0)

    def test_prior_recommendations_deactivation(self):
        today = timezone.localdate()
        
        # Create an active recommendation from yesterday
        old_rec = Recommendation.objects.create(
            user=self.user,
            activity=self.acts['act-12'],
            reason="Old breathing recommendation",
            is_active=True
        )
        # Manually force created_at to yesterday
        Recommendation.objects.filter(id=old_rec.id).update(created_at=timezone.now() - timezone.timedelta(days=1))
        
        # Create today's mood log and journal
        MoodLog.objects.create(
            user=self.user, date=today,
            mood=3, mood_label="Neutral", stress=5, energy=5, sleep=7.0, productivity=5, social=5
        )
        JournalEntry.objects.create(
            user=self.user, text="Today's log."
        )
        
        # Get today's recommendation
        new_rec = RecommendationService.get_today_recommendation(self.user)
        assert new_rec is not None
        
        # Verify old recommendation is deactivated
        old_rec.refresh_from_db()
        self.assertFalse(old_rec.is_active)
        self.assertTrue(new_rec.is_active)

    def test_personalized_journals_and_feedback(self):
        from journal.models import JournalEntry
        from activities.services import ActivityService
        from recommendation.serializers import RecommendationSerializer
        from activities.models import ActivityFeedback
        
        # Create a past journal entry with 'Exam' theme
        past_journal = JournalEntry.objects.create(
            user=self.user,
            text="I am worried about my upcoming midterm exams and deadlines",
            analysis={"themes": ["Exam"]}
        )
        JournalEntry.objects.filter(id=past_journal.id).update(created_at=timezone.now() - timezone.timedelta(days=5))
        
        # Create today's journal entry with 'Exam' theme
        JournalEntry.objects.create(
            user=self.user,
            text="Preparing for my exams and studying late",
            analysis={"themes": ["Exam"]}
        )
        
        # Create today's MoodLog check-in marking high stress (stress = 8)
        MoodLog.objects.create(
            user=self.user,
            date=timezone.localdate(),
            mood=3, mood_label="Neutral",
            stress=8,
            energy=5, sleep=7.0, productivity=5, social=5
        )
        
        # Create feedback for Box Breathing (act-1)
        fb = ActivityService.record_feedback(
            user=self.user,
            activity_id='act-1',
            duration_minutes=15,
            satisfaction=5,
            mood_improved="Yes"
        )
        # Backdate the feedback to avoid recency penalty
        fb.date = timezone.localdate() - timezone.timedelta(days=10)
        fb.save()
        ActivityFeedback.objects.filter(id=fb.id).update(created_at=timezone.now() - timezone.timedelta(days=10))
        
        # Get recommendation
        rec = RecommendationService.get_today_recommendation(self.user)
        self.assertIsNotNone(rec)
        self.assertEqual(rec.activity.id, 'act-1')
        
        # Serialize and check matches
        serializer = RecommendationSerializer(rec)
        data = serializer.data
        
        self.assertIn("confidence", data)
        self.assertIn("recommendation_score", data)
        self.assertGreaterEqual(data["historical_matches"], 1)
        self.assertIn("previous_success_rate", data)
        
        reasons_joined = " ".join(data["reason"]) if isinstance(data["reason"], list) else str(data["reason"])
        self.assertTrue('academic' in reasons_joined.lower() or 'distress' in reasons_joined.lower() or 'exam' in reasons_joined.lower())
        self.assertIn("5/5", reasons_joined)

    def test_two_stage_api_workflow(self):
        from django.urls import reverse
        from rest_framework.test import APIClient
        from mood.models import MoodLog
        from journal.models import JournalEntry

        client = APIClient()
        client.force_authenticate(user=self.user)
        url = reverse('recommendation_today')

        # Scenario A: Create Yesterday's Recommendation (completed)
        yesterday = timezone.localdate() - timezone.timedelta(days=1)
        yesterday_dt = timezone.now() - timezone.timedelta(days=1)
        rec_yesterday = Recommendation.objects.create(
            user=self.user,
            activity=self.acts['act-12'],
            reason="Helped you calm down.",
            is_active=False,
            completed=True,
            user_rating=5,
            stress=8,
            mood_before=3,
            mood_after=5,
            rec_type='complete',
            mood_improvement="Stress Improved: 8 → 5"
        )
        Recommendation.objects.filter(pk=rec_yesterday.pk).update(created_at=yesterday_dt)

        # 1. Locked State: No mood log today
        response = client.get(url)
        from rest_framework.response import Response
        assert isinstance(response, Response)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'locked')
        self.assertIsNotNone(response.data['yesterday_recommendation'])
        self.assertEqual(response.data['yesterday_recommendation']['activity_name'], "3-Min Breathing")
        self.assertEqual(response.data['yesterday_recommendation']['completed'], True)
        self.assertEqual(response.data['yesterday_recommendation']['mood_improvement'], "Stress Improved: 8 → 5")

        # 2. Quick State: Mood exists, but Journal does not
        today = timezone.localdate()
        MoodLog.objects.create(
            user=self.user, date=today,
            mood=3, mood_label="Neutral", stress=8, energy=5, sleep=7.0, productivity=5, social=5
        )
        
        response = client.get(url)
        from rest_framework.response import Response
        assert isinstance(response, Response)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'quick')
        self.assertIsNotNone(response.data['activity'])
        self.assertEqual(response.data['activity']['id'], 'act-1') # stress override Box Breathing
        self.assertIn('daily_suggestion', response.data)
        self.assertIsNotNone(response.data['daily_suggestion'])
        self.assertIsNotNone(response.data['yesterday_recommendation'])

        # 3. Complete State: Both exist
        JournalEntry.objects.create(
            user=self.user, text="Studying hard for math exams.",
            analysis={"themes": ["Exam"], "sentiment": "Negative", "emotion": "Anxiety"}
        )
        response = client.get(url)
        from rest_framework.response import Response
        assert isinstance(response, Response)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'complete')
        self.assertIsNotNone(response.data['activity'])
        self.assertIn('daily_suggestion', response.data)
        self.assertIsNotNone(response.data['daily_suggestion'])
        self.assertIsNone(response.data.get('yesterday_recommendation'))
        self.assertEqual(response.data['historical_matches'], 0) # No journals past 30 days except today
        self.assertIsNone(response.data['previous_success_rate'])


