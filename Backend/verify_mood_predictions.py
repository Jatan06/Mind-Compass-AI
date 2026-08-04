# -*- coding: utf-8 -*-
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
SEP = "-" * 65

def run():
    print(SEP)
    print("ADAPTIVE MOOD PREDICTION  --  VERIFICATION SUITE")
    print(SEP)

    # ── TEST 1: brand-new user ───────────────────────────────────
    print("\n[T1] Brand-new user (0 logs) -> expects Stage 1 / no prediction")
    uname = "pred_verify_new"
    User.objects.filter(username=uname).delete()
    u = User.objects.create_user(username=uname, email="pv_new@mc.com", password="Test123!")
    r = MoodPredictionService.predict(u)
    print(f"  stage={r['stage']}  has_prediction={r['has_prediction']}")
    print(f"  message: {r['message']}")
    assert r["has_prediction"] is False, "FAIL T1"
    assert r["stage"] == 1, "FAIL T1 stage"
    assert r["predicted_mood"] is None, "FAIL T1 mood not None"
    print("  PASS T1")
    u.delete()

    # ── TEST 2: exactly 7-day user ───────────────────────────────
    print("\n[T2] 7-day user -> expects Stage 2 / medium confidence")
    uname2 = "pred_verify_7d"
    User.objects.filter(username=uname2).delete()
    u2 = User.objects.create_user(username=uname2, email="pv_7d@mc.com", password="Test123!")
    today = date.today()
    for i in range(7):
        MoodLog.objects.create(
            user=u2, date=today - timedelta(days=6 - i),
            mood=3 + (i % 2), mood_label="Neutral",
            stress=5, energy=6, sleep=7.0, productivity=6, social=5
        )
    r2 = MoodPredictionService.predict(u2)
    print(f"  stage={r2['stage']}  mood_label={r2['mood_label']}  conf={r2['confidence']} [{r2['confidence_label']}]")
    print(f"  why: {r2.get('why', '')[:100]}")
    assert r2["has_prediction"] is True, "FAIL T2"
    assert r2["stage"] == 2, f"FAIL T2 stage={r2['stage']}"
    assert (r2["confidence"] or 0) <= 0.75, f"FAIL T2 conf cap: {r2['confidence']}"
    print("  PASS T2")
    u2.delete()

    # ── TEST 3: seeded personas (Stage 3) ────────────────────────
    print("\n[T3] Seeded personas -> expects Stage 3 / distinct predictions")
    personas = ["emily_healthy", "alex_student", "sarah_engineer", "priya_recovery", "ethan_crisis"]
    scores = {}
    for p in personas:
        try:
            u = User.objects.get(username=p)
            logs = MoodLog.objects.filter(user=u).count()
            r = MoodPredictionService.predict(u)
            scores[p] = r.get("predicted_mood")
            print(f"\n  [{p}]  logs={logs}  stage={r['stage']}  mood={r['predicted_mood']}({r['mood_label']})  conf={r['confidence']} [{r['confidence_label']}]")
            if r.get("why"):
                print(f"    WHY: {r['why'][:110]}")
            if r.get("risk_factors"):
                print(f"    RISK: {r['risk_factors']}")
            if r.get("protective_factors"):
                print(f"    PROTECTIVE: {r['protective_factors']}")
        except User.DoesNotExist:
            print(f"  SKIP {p} not in DB")

    unique = set(v for v in scores.values() if v is not None)
    print(f"\n  Unique predicted moods: {unique}")
    if len(unique) >= 2:
        print("  PASS T3: personas produce distinct predictions")
    else:
        print("  WARN T3: all personas returned same score")

    em = scores.get("emily_healthy")
    et  = scores.get("ethan_crisis")
    if em is not None and et is not None:
        if em >= et:
            print(f"  PASS T4: emily({em}) >= ethan({et}) as expected")
        else:
            print(f"  WARN T4: emily({em}) < ethan({et}) — unexpected ordering")

    print("\n" + SEP)
    print("Verification complete.")
    print(SEP)

if __name__ == "__main__":
    run()
