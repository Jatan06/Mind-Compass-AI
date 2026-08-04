# -*- coding: utf-8 -*-
"""
Validate Mood-Journal Conflict Detection across 4 test cases.
"""
import os, sys, django
from datetime import date, timedelta

sys.stdout.reconfigure(encoding='utf-8')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from mood.models import MoodLog
from journal.models import JournalEntry
from recommendation.services import RecommendationService

User = get_user_model()
SEP = "=" * 65

def clean(username):
    User.objects.filter(username=username).delete()

def make_scenario(username, mood_val, journal_sentiment, journal_emotion=""):
    clean(username)
    u = User.objects.create_user(username=username, email=f"{username}@mc.com", password="Test1!")
    today = timezone.localdate()
    MoodLog.objects.create(
        user=u, date=today,
        mood=mood_val, mood_label=("Happy" if mood_val >= 4 else "Sad"),
        stress=4, energy=5, sleep=7.0, productivity=5, social=5,
    )
    JournalEntry.objects.create(
        user=u,
        text="Test journal entry for conflict validation.",
        created_at=timezone.now(),
        analysis={
            "sentiment": journal_sentiment,
            "emotion": journal_emotion or ("Sadness" if journal_sentiment == "Negative" else "Joy"),
            "themes": ["hopelessness"] if journal_sentiment == "Negative" else ["gratitude"],
        }
    )
    return u

def check(label, mood_val, journal_sentiment, journal_emotion, expect_conflict):
    username = f"vc_{label.replace(' ', '_')[:20]}"
    u = make_scenario(username, mood_val, journal_sentiment, journal_emotion)
    mood_log = MoodLog.objects.filter(user=u, date=timezone.localdate()).first()
    journal_entry = JournalEntry.objects.filter(user=u, created_at__date=timezone.localdate()).first()
    has_conflict, reason = RecommendationService._detect_conflict(mood_log, journal_entry)
    status = "PASS" if has_conflict == expect_conflict else "FAIL"
    print(f"  [{status}] {label}")
    print(f"         mood={mood_val} | journal={journal_sentiment} ({journal_emotion}) | has_conflict={has_conflict} (expected={expect_conflict})")
    if reason:
        print(f"         reason: {reason[:100]}")
    u.delete()
    return status == "PASS"

print(SEP)
print("MOOD-JOURNAL CONFLICT DETECTION — 4-CASE VALIDATION")
print(SEP)

results = []
print()
results.append(check("Happy + Depressed journal",     mood_val=5, journal_sentiment="Negative", journal_emotion="hopeless",  expect_conflict=True))
results.append(check("Sad + Positive journal",        mood_val=1, journal_sentiment="Positive", journal_emotion="Joy",       expect_conflict=True))
results.append(check("Anxious + Negative journal",    mood_val=2, journal_sentiment="Negative", journal_emotion="Anxiety",   expect_conflict=False))
results.append(check("Positive + Positive journal",   mood_val=4, journal_sentiment="Positive", journal_emotion="Joy",       expect_conflict=False))

print()
print(SEP)
if all(results):
    print(f"  All {len(results)} test cases PASSED.")
else:
    fails = results.count(False)
    print(f"  {fails} test case(s) FAILED.")
print(SEP)
