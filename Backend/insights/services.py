from django.db.models import Avg, Count
from django.utils import timezone
from mood.models import MoodLog
from journal.models import JournalEntry

class InsightsService:
    @classmethod
    def get_user_analytics(cls, user):
        recent_moods = MoodLog.objects.filter(user=user).order_by('-date')[:7]
        if len(recent_moods) < 3:
            return {
                "insufficient_data": True
            }
            
        avg_mood = MoodLog.objects.filter(user=user).aggregate(Avg('mood'))['mood__avg'] or 3.0
        avg_stress = MoodLog.objects.filter(user=user).aggregate(Avg('stress'))['stress__avg'] or 5.0
        avg_sleep = MoodLog.objects.filter(user=user).aggregate(Avg('sleep'))['sleep__avg'] or 7.0
        
        # Calculate trend using actual historical progression comparing earlier logs with recent logs
        logs = list(MoodLog.objects.filter(user=user).order_by('-date')[:14])
        total_logs = len(logs)
        if total_logs >= 4:
            mid = total_logs // 2
            recent_set = logs[:mid]
            older_set = logs[mid:]
            recent_avg = sum([m.mood for m in recent_set]) / len(recent_set)
            older_avg = sum([m.mood for m in older_set]) / len(older_set)
            delta = recent_avg - older_avg
            if delta > 0.5:
                trend = "Improving Stability"
            elif delta >= -0.1:
                trend = "Stable"
            elif delta > -0.6:
                trend = "Slight Decline"
            else:
                trend = "Significant Decline"
        else:
            trend = "Stable"

        # Calculate dynamic Recovery Spectrum evidence statement
        journals_14 = list(JournalEntry.objects.filter(user=user).order_by('-created_at')[:14])
        recovery_statement = ""
        if len(logs) >= 4:
            mid = len(logs) // 2
            recent_stress = sum([m.stress for m in logs[:mid]]) / mid
            older_stress = sum([m.stress for m in logs[mid:]]) / (len(logs) - mid)
            if older_stress > recent_stress and older_stress > 0:
                reduction_pct = int(((older_stress - recent_stress) / older_stress) * 100)
                if reduction_pct >= 5:
                    recovery_statement = f"Your stress has reduced by {reduction_pct}% over the last two weeks."
            
            if not recovery_statement and len(journals_14) >= 3:
                moods = [m.mood for m in logs]
                mean_mood = sum(moods) / len(moods)
                variance = sum((x - mean_mood) ** 2 for x in moods) / len(moods)
                if variance < 0.6:
                    recovery_statement = "Regular journaling has been associated with steadier mood ratings during the past week."
            
            if not recovery_statement:
                recent_mood = sum([m.mood for m in logs[:mid]]) / mid
                older_mood = sum([m.mood for m in logs[mid:]]) / (len(logs) - mid)
                if recent_mood > older_mood:
                    recovery_statement = "Your average mood has improved over the last two weeks."
        
        if not recovery_statement:
            recovery_statement = "Continue logging your progress to unlock personalized recovery insights."

        # Fetch recent journal tags/keywords to populate themes
        recent_journals = JournalEntry.objects.filter(user=user)[:5]
        themes_map = {}
        for entry in recent_journals:
            themes = entry.analysis.get("themes", [])
            for theme in themes:
                themes_map[theme] = themes_map.get(theme, 0) + 1
        
        themes_data = [{"theme": k, "value": v} for k, v in themes_map.items()]

        daily_trends = []
        for log in reversed(recent_moods):
            daily_trends.append({
                "date": log.date.strftime("%a"),
                "mood": log.mood,
                "stress": log.stress,
                "sleep": float(log.sleep),
                "productivity": log.productivity
            })

        return {
            "summary": {
                "averageMood": round(float(avg_mood), 1),
                "averageStress": round(float(avg_stress), 1),
                "averageSleep": round(float(avg_sleep), 1),
                "moodTrend": trend
            },
            "recoverySpectrum": recovery_statement,
            "moodTrends": daily_trends,
            "cognitiveThemes": themes_data
        }

    @classmethod
    def _calculate_wellness_for_range(cls, user, start_date, end_date):
        from mood.models import MoodLog
        from journal.models import JournalEntry
        from recommendation.models import Recommendation
        from activities.models import ActivityFeedback
        from django.db.models import Avg

        logs = MoodLog.objects.filter(user=user, date__range=(start_date, end_date))
        journals = JournalEntry.objects.filter(user=user, created_at__date__range=(start_date, end_date))
        recs = Recommendation.objects.filter(user=user, created_at__date__range=(start_date, end_date))
        feedbacks = ActivityFeedback.objects.filter(user=user, created_at__date__range=(start_date, end_date))

        # If no check-ins and no journals logged in this range, it means insufficient history
        if logs.count() == 0 and journals.count() == 0:
            return None

        # 1. Mood average: (avg_mood - 1) / 4 * 100
        avg_mood = logs.aggregate(Avg('mood'))['mood__avg']
        mood_factor = ((avg_mood - 1.0) / 4.0 * 100.0) if avg_mood is not None else 60.0

        # 2. Stress average: (10 - avg_stress) / 9 * 100
        avg_stress = logs.aggregate(Avg('stress'))['stress__avg']
        stress_factor = ((10.0 - avg_stress) / 9.0 * 100.0) if avg_stress is not None else 60.0

        # 3. Sleep average: min(100.0, avg_sleep / 8.0 * 100)
        avg_sleep = logs.aggregate(Avg('sleep'))['sleep__avg']
        sleep_factor = (min(100.0, float(avg_sleep) / 8.0 * 100.0)) if avg_sleep is not None else 75.0

        # 4. Energy average: (avg_energy - 1) / 4 * 100
        avg_energy = logs.aggregate(Avg('energy'))['energy__avg']
        energy_factor = ((avg_energy - 1.0) / 4.0 * 100.0) if avg_energy is not None else 60.0

        # 5. Productivity average: (avg_productivity - 1) / 4 * 100
        avg_productivity = logs.aggregate(Avg('productivity'))['productivity__avg']
        prod_factor = ((avg_productivity - 1.0) / 4.0 * 100.0) if avg_productivity is not None else 60.0

        # 6. Check-in consistency: (num_check_ins / 7.0) * 100
        checkin_consistency = (logs.count() / 7.0) * 100.0

        # 7. Journal consistency: (num_journals / 7.0) * 100
        journal_consistency = (journals.count() / 7.0) * 100.0

        # 8. Activity completion rate: completed_recs / total_recs * 100
        total_recs = recs.count()
        completed_recs = recs.filter(completed=True).count()
        completion_factor = (completed_recs / total_recs * 100.0) if total_recs > 0 else 80.0

        # 9. Recommendation feedback satisfaction: (avg_satisfaction / 5) * 100
        avg_sat = feedbacks.aggregate(Avg('satisfaction'))['satisfaction__avg']
        feedback_factor = (float(avg_sat) / 5.0 * 100.0) if avg_sat is not None else 80.0

        # Calculate final weighted score
        calculated_wellness = (
            mood_factor * 0.20 +
            stress_factor * 0.15 +
            sleep_factor * 0.15 +
            energy_factor * 0.10 +
            prod_factor * 0.10 +
            checkin_consistency * 0.10 +
            journal_consistency * 0.10 +
            completion_factor * 0.05 +
            feedback_factor * 0.05
        )
        return int(max(10, min(100, calculated_wellness)))

    @classmethod
    def get_user_progress(cls, user, today=None):
        from journal.models import JournalEntry

        # Resolve date
        today_date = today or timezone.localdate()

        # Define 3 weekly ranges (Week 1, Week 2, Week 3)
        # Week 3: today_date - 6 days to today_date (latest week)
        w3_end = today_date
        w3_start = today_date - timezone.timedelta(days=6)

        # Week 2: today_date - 13 days to today_date - 7 days
        w2_end = today_date - timezone.timedelta(days=7)
        w2_start = today_date - timezone.timedelta(days=13)

        # Week 1: today_date - 20 days to today_date - 14 days
        w1_end = today_date - timezone.timedelta(days=14)
        w1_start = today_date - timezone.timedelta(days=20)

        # Calculate actual scores
        score_w3 = cls._calculate_wellness_for_range(user, w3_start, w3_end)
        score_w2 = cls._calculate_wellness_for_range(user, w2_start, w2_end)
        score_w1 = cls._calculate_wellness_for_range(user, w1_start, w1_end)

        # Current wellness score is based on the latest week (Week 3)
        wellness_score = score_w3 if score_w3 is not None else 60

        try:
            profile = user.profile
            from mood.services import MoodService
            profile.streak = MoodService.calculate_streak(user, today=today_date)
            profile.wellness_score = wellness_score
            profile.save()
            streak = profile.streak
        except Exception:
            streak = 0

        # Construct progress metrics page details
        badges = [
            {"id": "onboarding", "name": "Self Compassion", "description": "Completed Onboarding Setup", "unlocked": getattr(user.profile, 'is_onboarded', False)},
            {"id": "streak-5", "name": "Consistency Champion", "description": "Maintained a 5-day checkin streak", "unlocked": streak >= 5},
            {"id": "journal-first", "name": "Self-Expression", "description": "Logged your first journal entry", "unlocked": JournalEntry.objects.filter(user=user).exists()}
        ]

        # Return only the available weeks, do not fabricate previous weeks
        history = []
        if score_w1 is not None:
            history.append({"week": "Week 1", "score": score_w1})
        if score_w2 is not None:
            history.append({"week": "Week 2", "score": score_w2})
        if score_w3 is not None:
            history.append({"week": "Week 3", "score": score_w3})

        return {
            "wellnessScore": wellness_score,
            "streak": streak,
            "badges": badges,
            "history": history
        }
