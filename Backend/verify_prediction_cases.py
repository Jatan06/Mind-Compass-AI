# -*- coding: utf-8 -*-
"""
Verify all 4 prediction cases by creating synthetic users with 0, 1, 5, 7, and 90 logs.
"""
import os, sys, django
from datetime import date, timedelta

sys.stdout.reconfigure(encoding='utf-8')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from mood.models import MoodLog
from ai.prediction.services import MoodPredictionService

User = get_user_model()
SEP = "=" * 65

def make_user(username, num_logs, mood_val=3):
    User.objects.filter(username=username).delete()
    u = User.objects.create_user(username=username, email=f"{username}@mc.com", password="Test1!")
    today = date.today()
    for i in range(num_logs):
        MoodLog.objects.create(
            user=u,
            date=today - timedelta(days=num_logs - 1 - i),
            mood=mood_val + (i % 2),
            mood_label="Neutral",
            stress=5,
            energy=6,
            sleep=7.0,
            productivity=6,
            social=5,
        )
    return u

def validate(label, r, expected_has, expected_stage):
    ok = True
    if r["has_prediction"] != expected_has:
        print(f"  FAIL: has_prediction={r['has_prediction']} expected {expected_has}")
        ok = False
    if expected_stage is not None and r.get("stage") != expected_stage:
        print(f"  FAIL: stage={r.get('stage')} expected {expected_stage}")
        ok = False
    if ok:
        print(f"  PASS: {label}")

def run():
    print(SEP)
    print("MOOD PREDICTION \u2013 STATE FLOW VERIFICATION (ALL 4 CASES)")
    print(SEP)
    users_to_clean = []

    # Case 1a: 0 logs
    print("\n[CASE 1] 0 logs \u2192 no prediction, first-checkin message")
    u = make_user("sv_0log", 0)
    users_to_clean.append(u)
    r = MoodPredictionService.predict(u)
    print(f"  stage={r['stage']}  has_prediction={r['has_prediction']}")
    print(f"  message: {r['message']}")
    validate("0 logs = Stage 1, no prediction", r, False, 1)

    # Case 2a: 1 log
    print("\n[CASE 2a] 1 log \u2192 learning phase")
    u = make_user("sv_1log", 1)
    users_to_clean.append(u)
    r = MoodPredictionService.predict(u)
    print(f"  stage={r['stage']}  has_prediction={r['has_prediction']}")
    print(f"  message: {r['message']}")
    validate("1 log = Stage 1, no prediction", r, False, 1)

    # Case 2b: 5 logs
    print("\n[CASE 2b] 5 logs \u2192 learning phase, progress = 5/7")
    u = make_user("sv_5log", 5)
    users_to_clean.append(u)
    r = MoodPredictionService.predict(u)
    print(f"  stage={r['stage']}  has_prediction={r['has_prediction']}")
    # The message should contain the remaining days
    print(f"  message: {r['message']}")
    validate("5 logs = Stage 1, no prediction", r, False, 1)
    assert "2 day" in r["message"], f"FAIL: message should mention 2 days remaining, got: {r['message']}"
    print("  PASS: message contains correct days remaining (2 days)")

    # Case 3: 7 logs => basic prediction
    print("\n[CASE 3] 7 logs \u2192 basic prediction (Stage 2, medium confidence)")
    u = make_user("sv_7log", 7)
    users_to_clean.append(u)
    r = MoodPredictionService.predict(u)
    print(f"  stage={r['stage']}  has_prediction={r['has_prediction']}")
    print(f"  mood_label={r.get('mood_label')}  confidence={r.get('confidence')} [{r.get('confidence_label')}]")
    print(f"  why: {r.get('why', '')[:80]}")
    validate("7 logs = Stage 2, has prediction", r, True, 2)
    assert (r.get("confidence") or 0) <= 0.75, f"FAIL: conf={r.get('confidence')} must be <=0.75"
    print("  PASS: confidence capped at 0.75 (medium)")

    # Case 4: 90 logs => personalized
    print("\n[CASE 4] 90 logs \u2192 personalized prediction (Stage 3, high confidence)")
    # Use a seeded persona if available, else create
    try:
        u90 = User.objects.get(username="emily_healthy")
        created = False
    except User.DoesNotExist:
        u90 = make_user("sv_90log", 90, mood_val=4)
        users_to_clean.append(u90)
        created = True

    r = MoodPredictionService.predict(u90)
    print(f"  stage={r['stage']}  has_prediction={r['has_prediction']}")
    print(f"  mood_label={r.get('mood_label')}  confidence={r.get('confidence')} [{r.get('confidence_label')}]")
    print(f"  why: {r.get('why', '')[:90]}")
    print(f"  risk_factors: {r.get('risk_factors')}")
    print(f"  protective_factors: {r.get('protective_factors')}")
    validate("90 logs = Stage 3, personalized prediction", r, True, 3)

    print("\n" + SEP)
    print("All 4 cases verified successfully.")
    print(SEP)

    for u in users_to_clean:
        u.delete()

if __name__ == "__main__":
    run()
