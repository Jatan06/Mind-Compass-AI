from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone

from mood.models import MoodLog
from journal.models import JournalEntry
from journal.services import JournalService
from ai.models import EmotionAnalysis, MoodPrediction, AIInsight
from ai.utils.preprocessing import preprocess_text
from ai.sentiment.services import SentimentAnalysisService
from ai.emotions.services import EmotionDetectionService
from ai.keywords.services import KeywordExtractionService
from ai.crisis.services import CrisisDetectionService
from core.models import CrisisAlert
from activities.models import TherapyActivity, ActivityFeedback

User = get_user_model()

class AIServicesTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="aitester", password="testpassword123")
        self.client.force_authenticate(user=self.user)

    def test_text_preprocessing(self):
        # HTML tag check, URLs check, Emojis check, stopwords/lemmatization check
        text = "Hello! <html><body>This is a test.</body></html> Go to https://google.com 😊. Having fun!"
        res = preprocess_text(text)
        cleaned_text = res["cleaned_text"]
        tokens = res["tokens"]
        
        # Verify HTML and URLs are removed
        self.assertNotIn("<html>", cleaned_text)
        self.assertNotIn("https://google.com", cleaned_text)
        # Verify emoji is removed
        self.assertNotIn("😊", cleaned_text)
        # Verify stop-word 'is' is removed from tokens, and words are lemmatized
        self.assertNotIn("is", tokens)
        self.assertIn("test", tokens)

    def test_positive_journal_sentiment_and_emotion(self):
        text = "I am absolutely thrilled and happy about this new job project!"
        # Preprocessing & VADER Sentiment
        sent_res = SentimentAnalysisService.analyze(text)
        self.assertEqual(sent_res["sentiment"], "Positive")
        self.assertGreater(sent_res["scores"]["compound"], 0.1)
        
        # Emotion detection
        em_res = EmotionDetectionService.detect(text)
        self.assertIn(em_res["primary_emotion"], ["Happy", "Excited", "Hopeful"])
        self.assertGreater(em_res["confidence"], 0.4)

    def test_negative_journal_sentiment_and_emotion(self):
        text = "I feel lonely, sad, and depressed. My workload is stressing me out."
        # Preprocessing & VADER Sentiment
        sent_res = SentimentAnalysisService.analyze(text)
        self.assertEqual(sent_res["sentiment"], "Negative")
        self.assertLess(sent_res["scores"]["compound"], -0.1)

        # Emotion detection
        em_res = EmotionDetectionService.detect(text)
        self.assertIn(em_res["primary_emotion"], ["Sad", "Lonely", "Stress", "Overwhelmed"])

    def test_neutral_journal(self):
        text = "I went to buy groceries and read a book."
        sent_res = SentimentAnalysisService.analyze(text)
        self.assertEqual(sent_res["sentiment"], "Neutral")
        
        em_res = EmotionDetectionService.detect(text)
        self.assertEqual(em_res["primary_emotion"], "Calm")

    def test_mixed_emotion_journal(self):
        text = "I got a new job which is exciting, but I am terrified and anxious about the work pressure."
        sent_res = SentimentAnalysisService.analyze(text)
        # Verify sentiment runs with valid scores
        self.assertIn(sent_res["sentiment"], ["Positive", "Negative", "Neutral"])
        
        em_res = EmotionDetectionService.detect(text)
        self.assertIn(em_res["primary_emotion"], ["Anxiety", "Excited", "Stress", "Fear"])

    def test_keyword_and_theme_extraction(self):
        text = "I am worried about my finance budget and bills, and I did not sleep well last night."
        kw_res = KeywordExtractionService.extract(text)
        
        # Verify themes (Finance, Sleep)
        self.assertIn("Finance", kw_res["topics"])
        self.assertIn("Sleep", kw_res["topics"])
        # Verify top keywords list gathers core topics
        self.assertIn("finance", kw_res["keywords"])
        self.assertIn("sleep", kw_res["keywords"])
        # Verify stressors derived
        self.assertIn("Financial stress", kw_res["stressors"])
        self.assertIn("Sleep quality issues", kw_res["stressors"])

    def test_edge_case_empty_journal(self):
        empty_text = "   "
        sent_res = SentimentAnalysisService.analyze(empty_text)
        self.assertEqual(sent_res["sentiment"], "Neutral")
        self.assertEqual(sent_res["confidence"], 1.0)

        em_res = EmotionDetectionService.detect(empty_text)
        self.assertEqual(em_res["primary_emotion"], "Calm")

        kw_res = KeywordExtractionService.extract(empty_text)
        self.assertEqual(len(kw_res["topics"]), 0)

    def test_edge_case_very_long_journal(self):
        long_text = "Happy day! " * 50 + " I am so stressed and work is hard. " * 50
        sent_res = SentimentAnalysisService.analyze(long_text)
        # Confirm VADER score completed without crashing
        self.assertIn(sent_res["sentiment"], ["Positive", "Negative", "Neutral"])

        em_res = EmotionDetectionService.detect(long_text)
        self.assertIn(em_res["primary_emotion"], ["Happy", "Calm", "Stress", "Overwhelmed"])

    def test_journal_submission_pipeline_and_duplicate_guard(self):
        # 1. Create a journal entry
        text = "Today was a good day, had a nice workout."
        entry = JournalService.create_entry(self.user, text)
        
        # Verify analysis payload generated
        self.assertEqual(entry.analysis["sentiment"], "Positive")
        self.assertIn("Exercise", entry.analysis["themes"])
        
        # Verify EmotionAnalysis object created in DB
        analyses_count_initial = EmotionAnalysis.objects.filter(journal_entry=entry).count()
        self.assertEqual(analyses_count_initial, 1)
        analysis_record = EmotionAnalysis.objects.get(journal_entry=entry)
        self.assertEqual(analysis_record.primary_emotion, "Happy")
        
        # 2. Update journal entry.text with IDENTICAL content (should NOT execute NLP pipeline again)
        JournalService.update_entry(self.user, entry.id, text, is_voice=True)
        analyses_count_no_change = EmotionAnalysis.objects.filter(journal_entry=entry).count()
        self.assertEqual(analyses_count_no_change, 1)  # Stays at 1, no duplicate added
        
        # 3. Update journal entry.text with DIFFERENT content (should trigger NLP pipeline)
        new_text = "I feel very anxious about my exam today."
        JournalService.update_entry(self.user, entry.id, new_text)
        analyses_count_changed = EmotionAnalysis.objects.filter(journal_entry=entry).count()
        self.assertEqual(analyses_count_changed, 2)  # Incremented to 2
        
        # Verify updated analysis properties
        entry.refresh_from_db()
        self.assertEqual(entry.analysis["sentiment"], "Negative")
        self.assertEqual(entry.analysis["emotion"], "Anxiety")

    def test_sentiment_api_endpoint(self):
        url = reverse('ai-sentiment')
        response = self.client.post(url, {"text": "I feel happy!"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["sentiment"], "Positive")

    def test_emotion_api_endpoint(self):
        url = reverse('ai-emotion')
        response = self.client.post(url, {"text": "I am so anxious."})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["primary_emotion"], "Anxiety")

    def test_keywords_api_endpoint(self):
        url = reverse('ai-keywords')
        response = self.client.post(url, {"text": "My office job workload is intense."})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Work", response.data["topics"])

    def test_prediction_api_endpoint(self):
        # Set up a MoodLog for the endpoint
        MoodLog.objects.create(
            user=self.user,
            date=timezone.localdate(),
            mood=4,
            mood_label="Good",
            stress=2,
            sleep=8.0,
            energy=7,
            productivity=7,
            social=6
        )
        JournalEntry.objects.create(
            user=self.user,
            text="Today was a nice productive day."
        )
        url = reverse('ai-prediction')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("predicted_mood", response.data)

    def test_insights_api_endpoint(self):
        MoodLog.objects.create(
            user=self.user,
            date=timezone.localdate(),
            mood=4, mood_label="Good", stress=2, sleep=8.0, energy=7, productivity=7, social=6
        )
        JournalEntry.objects.create(
            user=self.user,
            text="Today was a nice productive day."
        )
        url = reverse('ai-insights')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("weekly_summary", response.data)

    def test_crisis_detection_triggers_and_alerts(self):
        # 1. High Risk trigger
        high_risk_text = "I feel like I want to end my life, suicide is on my mind."
        res = CrisisDetectionService.detect(high_risk_text, user=self.user)
        self.assertEqual(res["risk_level"], "High Risk")
        self.assertIn("988", res["reason"])
        
        # Verify CrisisAlert created in DB
        alerts = CrisisAlert.objects.filter(user=self.user)
        self.assertEqual(alerts.count(), 1)
        self.assertEqual(alerts.first().alert_level, "Critical")

        # 2. Warning trigger
        warning_text = "Everything is hopeless, I feel pointless and cannot go on."
        res = CrisisDetectionService.detect(warning_text, user=self.user)
        self.assertEqual(res["risk_level"], "Warning")
        self.assertIn("therapist", res["reason"])
        
        alerts = CrisisAlert.objects.filter(user=self.user)
        self.assertEqual(alerts.count(), 2)

        # 3. False Positive Prevention (Safe)
        safe_text = "I had a bad day at work and my head hurts."
        res = CrisisDetectionService.detect(safe_text, user=self.user)
        self.assertEqual(res["risk_level"], "Safe")
        
        # Verify no new alert created (count stays at 2)
        alerts = CrisisAlert.objects.filter(user=self.user)
        self.assertEqual(alerts.count(), 2)

    def test_mood_prediction_training_and_inference(self):
        # Seed several logs to simulate training data
        today = timezone.localdate()
        for idx in range(5):
            MoodLog.objects.create(
                user=self.user,
                date=today - timezone.timedelta(days=idx+1),
                mood=4 if idx % 2 == 0 else 3,
                mood_label="Good",
                stress=3,
                sleep=8.0,
                energy=7,
                productivity=7,
                social=7
            )
        
        # Trigger prediction (runs model training if model doesn't exist)
        from ai.prediction.services import MoodPredictionService
        pred = MoodPredictionService.predict(self.user)
        
        self.assertIn("predicted_mood", pred)
        self.assertIn("confidence", pred)
        self.assertGreater(len(pred["reasons"]), 0)
        
        # Verify database record saved
        saved = MoodPrediction.objects.filter(user=self.user).first()
        self.assertIsNotNone(saved)
        self.assertEqual(saved.predicted_mood, pred["predicted_mood"])

    def test_adaptive_recommendation_scoring(self):
        # Create mock TherapyActivity entries if they don't exist
        act1, _ = TherapyActivity.objects.get_or_create(
            id="act-1",
            defaults={"title": "Box Breathing", "category": "Mindfulness", "duration": "5 min", "difficulty": "Simple", "description": "Test Box Breathing", "instructions": []}
        )
        act2, _ = TherapyActivity.objects.get_or_create(
            id="act-33",
            defaults={"title": "5-4-3-2-1 Grounding", "category": "Mindfulness", "duration": "5 min", "difficulty": "Simple", "description": "Test Grounding", "instructions": []}
        )
        
        # High stress mood log to trigger act-1 suggestion
        MoodLog.objects.create(
            user=self.user,
            date=timezone.localdate(),
            mood=3,
            mood_label="Neutral",
            stress=8, # High stress
            sleep=7.5,
            energy=6,
            productivity=6,
            social=6
        )
        JournalEntry.objects.create(
            user=self.user,
            text="High stress day with workload deadlines."
        )
        
        from recommendation.services import RecommendationService
        rec = RecommendationService.get_today_recommendation(self.user)
        self.assertEqual(rec.activity.id, "act-1")
        self.assertIn("stress", rec.reason.lower())

        # Test Feedback Satisfaction boost
        ActivityFeedback.objects.create(
            user=self.user,
            activity=act2,
            duration_minutes=5,
            satisfaction=5,
            mood_improved="Yes"
        )
        # Delete today's recommendation to regenerate
        rec.delete()
        MoodLog.objects.filter(user=self.user).update(stress=3)
        
        rec2 = RecommendationService.get_today_recommendation(self.user)
        # It should not choose act-33 because completed recently (within 2 days penalty)
        self.assertNotEqual(rec2.activity.id, "act-33")

    def test_emotional_twin_generation(self):
        # Seed historical mood logs and journal entries
        today = timezone.localdate()
        for idx in range(3):
            # Create mood log
            MoodLog.objects.create(
                user=self.user,
                date=today - timezone.timedelta(days=idx),
                mood=4,
                mood_label="Good",
                stress=3,
                sleep=8.0,
                energy=7,
                productivity=8,
                social=6
            )
            # Create journal entry
            journal = JournalService.create_entry(self.user, "I feel happy and calm.")
            # Set analysis
            journal.analysis = {
                "sentiment": "Positive",
                "emotion": "Happy",
                "confidence": 0.90,
                "themes": ["Work", "Personal"],
                "crisisStatus": "Safe"
            }
            journal.save()
            
        from ai.insights.services import AIInsightsService
        insights = AIInsightsService.generate_insights(self.user)
        
        self.assertIn("weekly_summary", insights)
        self.assertIn("Happy", insights["weekly_summary"])
        self.assertIn("Work", insights["weekly_summary"])
        
        # Verify AIInsight record created in DB
        twin_insight = AIInsight.objects.filter(user=self.user).first()
        self.assertIsNotNone(twin_insight)

    def test_unauthenticated_api_endpoints(self):
        """
        Verify that unauthorized users cannot reach the AI service routing endpoints.
        """
        self.client.logout()
        post_endpoints = [
            reverse('ai-sentiment'),
            reverse('ai-emotion'),
            reverse('ai-keywords'),
        ]
        get_endpoints = [
            reverse('ai-prediction'),
            reverse('ai-insights'),
        ]
        for url in post_endpoints:
            res = self.client.post(url, {"text": "Audit test"})
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        for url in get_endpoints:
            res = self.client.get(url)
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_malformed_api_payloads(self):
        """
        Verify that fields missing or malformed in request payloads return HTTP 400 validation error responses.
        """
        url = reverse('ai-sentiment')
        # Completely empty JSON payload
        res = self.client.post(url, {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        # Unicode anomalies and emoji boundaries
        res = self.client.post(url, {"text": "😊🧘‍♀️" * 50}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Extremely long journal entries
        res = self.client.post(url, {"text": "anxious " * 1000}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
