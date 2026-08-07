from django.db.models import Avg, Count
from django.utils import timezone
from mood.models import MoodLog
from journal.models import JournalEntry

class InsightsService:
    @classmethod
    def get_user_analytics(cls, user):
        # Single query for last 14 logs — covers trend + daily display + aggregates
        logs = list(MoodLog.objects.filter(user=user).order_by('-date')[:14])
        if len(logs) < 3:
            return {"insufficient_data": True}

        # Compute aggregates from in-memory list (avoids extra DB round-trips)
        avg_mood   = sum(l.mood   for l in logs) / len(logs)
        avg_stress = sum(l.stress for l in logs) / len(logs)
        avg_sleep  = sum(float(l.sleep) for l in logs) / len(logs)

        # Trend: compare first half vs second half
        total_logs = len(logs)
        if total_logs >= 4:
            mid = total_logs // 2
            recent_avg = sum(m.mood for m in logs[:mid])  / mid
            older_avg  = sum(m.mood for m in logs[mid:])  / (total_logs - mid)
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

        # Recovery statement from in-memory logs
        journals_14 = list(JournalEntry.objects.filter(user=user).order_by('-created_at')[:14])
        recovery_statement = ""
        if total_logs >= 4:
            mid = total_logs // 2
            recent_stress = sum(m.stress for m in logs[:mid]) / mid
            older_stress  = sum(m.stress for m in logs[mid:]) / (total_logs - mid)
            if older_stress > recent_stress and older_stress > 0:
                reduction_pct = int(((older_stress - recent_stress) / older_stress) * 100)
                if reduction_pct >= 5:
                    recovery_statement = f"Your stress has reduced by {reduction_pct}% over the last two weeks."
            if not recovery_statement and len(journals_14) >= 3:
                mean_mood = avg_mood
                variance = sum((l.mood - mean_mood) ** 2 for l in logs) / len(logs)
                if variance < 0.6:
                    recovery_statement = "Regular journaling has been associated with steadier mood ratings during the past week."
            if not recovery_statement:
                recent_mood = sum(m.mood for m in logs[:mid]) / mid
                older_mood  = sum(m.mood for m in logs[mid:]) / (total_logs - mid)
                if recent_mood > older_mood:
                    recovery_statement = "Your average mood has improved over the last two weeks."
        if not recovery_statement:
            recovery_statement = "Continue logging your progress to unlock personalized recovery insights."

        # Themes from recent journals (already fetched above)
        recent_journals = journals_14[:5]
        themes_map = {}
        for entry in recent_journals:
            for theme in entry.analysis.get("themes", []):
                themes_map[theme] = themes_map.get(theme, 0) + 1
        themes_data = [{"theme": k, "value": v} for k, v in themes_map.items()]

        # Use last 7 logs for daily trends chart (already in memory from our 14-log fetch)
        recent_moods = logs[:7]
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
                "averageMood":   round(float(avg_mood),   1),
                "averageStress": round(float(avg_stress), 1),
                "averageSleep":  round(float(avg_sleep),  1),
                "moodTrend": trend
            },
            "recoverySpectrum": recovery_statement,
            "moodTrends": daily_trends,
            "cognitiveThemes": themes_data
        }

    @classmethod
    def _get_batched_wellness_scores(cls, user, today):
        from django.utils import timezone
        
        # Batch Fetch all records necessary for the last 30 days ONCE (0.01 sec vs 5.6 sec)
        start_global = today - timezone.timedelta(days=30)
        from mood.models import MoodLog
        from journal.models import JournalEntry
        from recommendation.models import Recommendation
        from activities.models import ActivityFeedback
        
        all_logs = list(MoodLog.objects.filter(user=user, date__gte=start_global).order_by('-date'))
        all_journals = list(JournalEntry.objects.filter(user=user, created_at__date__gte=start_global).order_by('-created_at'))
        all_recs = list(Recommendation.objects.filter(user=user, created_at__date__gte=start_global).order_by('-created_at'))
        all_feedbacks = list(ActivityFeedback.objects.filter(user=user, created_at__date__gte=start_global).order_by('-created_at'))
        
        def filter_range(records, s_date, e_date, date_attr):
            filtered = []
            for r in records:
                d = getattr(r, date_attr)
                if hasattr(d, 'date'):
                    d = d.date()
                if s_date <= d <= e_date:
                    filtered.append(r)
            return filtered

        score_w3 = cls._calculate_wellness_for_range(
            user, today - timezone.timedelta(days=6), today,
            filter_range(all_logs, today - timezone.timedelta(days=6), today, 'date'),
            filter_range(all_journals, today - timezone.timedelta(days=6), today, 'created_at'),
            filter_range(all_recs, today - timezone.timedelta(days=6), today, 'created_at'),
            filter_range(all_feedbacks, today - timezone.timedelta(days=6), today, 'created_at')
        )
        score_w2 = cls._calculate_wellness_for_range(
            user, today - timezone.timedelta(days=13), today - timezone.timedelta(days=7),
            filter_range(all_logs, today - timezone.timedelta(days=13), today - timezone.timedelta(days=7), 'date'),
            filter_range(all_journals, today - timezone.timedelta(days=13), today - timezone.timedelta(days=7), 'created_at'),
            filter_range(all_recs, today - timezone.timedelta(days=13), today - timezone.timedelta(days=7), 'created_at'),
            filter_range(all_feedbacks, today - timezone.timedelta(days=13), today - timezone.timedelta(days=7), 'created_at')
        )
        score_w1 = cls._calculate_wellness_for_range(
            user, today - timezone.timedelta(days=20), today - timezone.timedelta(days=14),
            filter_range(all_logs, today - timezone.timedelta(days=20), today - timezone.timedelta(days=14), 'date'),
            filter_range(all_journals, today - timezone.timedelta(days=20), today - timezone.timedelta(days=14), 'created_at'),
            filter_range(all_recs, today - timezone.timedelta(days=20), today - timezone.timedelta(days=14), 'created_at'),
            filter_range(all_feedbacks, today - timezone.timedelta(days=20), today - timezone.timedelta(days=14), 'created_at')
        )

        # Fallback ranges for smaller data windows
        thirty_days = 0
        if not score_w1 and not score_w2 and not score_w3:
            s_all = cls._calculate_wellness_for_range(user, today - timezone.timedelta(days=30), today, all_logs, all_journals, all_recs, all_feedbacks)
            if s_all:
                thirty_days = s_all
        
        return {
            "w1": score_w1,
            "w2": score_w2,
            "w3": score_w3,
            "overall_30_days": thirty_days
        }

    @classmethod
    def _calculate_wellness_for_range(cls, user, start_date, end_date, logs, journals, recs, feedbacks):
        # Data is already scoped to range via in-memory filtering. No DB calls needed here!
        if len(logs) == 0 and len(journals) == 0:
            return None

        # Calculate recency-weighted values (using exponential decay relative to end_date)
        total_weight = 0.0
        weighted_mood = 0.0
        weighted_stress = 0.0
        weighted_sleep = 0.0
        weighted_energy = 0.0
        weighted_prod = 0.0

        for log in logs:
            diff_days = (end_date - log.date).days
            if diff_days < 0:
                diff_days = 0
            weight = 0.92 ** diff_days
            
            total_weight += weight
            weighted_mood += weight * ((log.mood - 1.0) / 4.0 * 100.0)
            weighted_stress += weight * ((10.0 - log.stress) / 10.0 * 100.0)
            weighted_sleep += weight * min(100.0, float(log.sleep) / 8.0 * 100.0)
            weighted_energy += weight * (log.energy / 10.0 * 100.0)
            weighted_prod += weight * (log.productivity / 10.0 * 100.0)

        # Journal sentiment calculations
        total_j_weight = 0.0
        weighted_sentiment = 0.0
        for entry in journals:
            diff_days = (end_date - entry.created_at.date()).days
            if diff_days < 0:
                diff_days = 0
            weight = 0.92 ** diff_days
            
            sentiment_str = entry.analysis.get("sentiment", "Neutral")
            if sentiment_str == "Positive":
                sent_val = 100.0
            elif sentiment_str == "Negative":
                sent_val = 15.0
            else:
                sent_val = 55.0
            
            total_j_weight += weight
            weighted_sentiment += weight * sent_val

        # Recommendation completion
        total_recs_weight = 0.0
        completed_recs_weight = 0.0
        for rec in recs:
            diff_days = (end_date - rec.created_at.date()).days
            if diff_days < 0:
                diff_days = 0
            weight = 0.92 ** diff_days
            
            total_recs_weight += weight
            if rec.completed:
                completed_recs_weight += weight

        # Feedbacks
        total_feed_weight = 0.0
        weighted_sat = 0.0
        for fb in feedbacks:
            diff_days = (end_date - fb.created_at.date()).days
            if diff_days < 0:
                diff_days = 0
            weight = 0.92 ** diff_days
            
            total_feed_weight += weight
            weighted_sat += weight * (float(fb.satisfaction) / 5.0 * 100.0)

        # Dynamically build the available factors
        available_factors = {}
        default_weights = {
            "mood": 0.25,
            "stress": 0.20,
            "sleep": 0.15,
            "energy": 0.10,
            "productivity": 0.10,
            "sentiment": 0.10,
            "completion": 0.05,
            "feedback": 0.05
        }

        if total_weight > 0.0:
            available_factors["mood"] = weighted_mood / total_weight
            available_factors["stress"] = weighted_stress / total_weight
            available_factors["sleep"] = weighted_sleep / total_weight
            available_factors["energy"] = weighted_energy / total_weight
            available_factors["productivity"] = weighted_prod / total_weight

        if total_j_weight > 0.0:
            available_factors["sentiment"] = weighted_sentiment / total_j_weight

        if total_recs_weight > 0.0:
            available_factors["completion"] = (completed_recs_weight / total_recs_weight) * 100.0

        if total_feed_weight > 0.0:
            available_factors["feedback"] = weighted_sat / total_feed_weight

        if not available_factors:
            return None

        # Normalize weights
        total_avail_weight = sum(default_weights[f] for f in available_factors.keys())
        base_score = 0.0
        for f, val in available_factors.items():
            norm_w = default_weights[f] / total_avail_weight
            base_score += val * norm_w

        # --- Trends, Trajectory and Bonuses ---
        bonus = 0.0

        # 1. Recent mood & stress trends (comparing last half of logs to first half in this range)
        log_list = sorted(logs, key=lambda x: x.date)
        if len(log_list) >= 4:
            mid = len(log_list) // 2
            recent_logs = log_list[mid:]
            older_logs = log_list[:mid]
            
            recent_avg_mood = sum(l.mood for l in recent_logs) / len(recent_logs)
            older_avg_mood = sum(l.mood for l in older_logs) / len(older_logs)
            mood_delta = recent_avg_mood - older_avg_mood
            # mood delta is between -4 and +4. Scale appropriately.
            bonus += mood_delta * 4.0

            recent_avg_stress = sum(l.stress for l in recent_logs) / len(recent_logs)
            older_avg_stress = sum(l.stress for l in older_logs) / len(older_logs)
            stress_delta = older_avg_stress - recent_avg_stress # positive means stress decreased
            bonus += stress_delta * 2.0

        # 2. Consistency / streak
        from mood.services import MoodService
        profile = getattr(user, 'profile', None)
        streak = getattr(profile, 'streak', 0) if profile else 0
        if streak > 0 and end_date >= timezone.localdate() - timezone.timedelta(days=2):
            bonus += min(10.0, float(streak) * 1.5)

        # 3. Crisis Alert Penalty
        try:
            from core.models import CrisisAlert
            has_crisis = CrisisAlert.objects.filter(
                user=user, 
                created_at__date__range=(start_date, end_date)
            ).exists()
            if has_crisis:
                bonus -= 20.0
        except Exception:
            pass

        final_score = int(max(10, min(100, base_score + bonus)))
        return final_score

    @classmethod
    def get_user_progress(cls, user, today=None):
        from journal.models import JournalEntry
        from mood.models import MoodLog

        # Resolve date
        today_date = today or timezone.localdate()

        # Get profile safely to avoid RelatedObjectDoesNotExist
        from users.models import UserProfile
        profile, _ = UserProfile.objects.get_or_create(user=user)

        # Check if the user is a brand new user with no logs or journals whatsoever
        if not MoodLog.objects.filter(user=user).exists() and not JournalEntry.objects.filter(user=user).exists():
            if profile.wellness_score is not None:
                profile.wellness_score = None
                profile.save()

            return {
                "has_wellness_score": False,
                "wellnessScore": None,
                "message": "Complete your first check-in to generate your Wellness Score.",
                "streak": 0,
                "badges": [
                    {"id": "onboarding", "name": "Self Compassion", "description": "Completed Onboarding Setup", "unlocked": getattr(profile, 'is_onboarded', False)},
                    {"id": "streak-5", "name": "Consistency Champion", "description": "Maintained a 5-day checkin streak", "unlocked": False},
                    {"id": "journal-first", "name": "Self-Expression", "description": "Logged your first journal entry", "unlocked": False}
                ],
                "history": []
            }

        # Define 3 weekly ranges (Week 1, Week 2, Week 3)
        scores = cls._get_batched_wellness_scores(user, today_date)
        score_w1 = scores.get('w1')
        score_w2 = scores.get('w2')
        score_w3 = scores.get('w3')
        thirty_days = scores.get('overall_30_days')

        # Current wellness score is based on the latest week (Week 3), falling back to earlier weeks or larger ranges if needed
        if score_w3 is not None:
            wellness_score = score_w3
        elif score_w2 is not None:
            wellness_score = score_w2
        elif score_w1 is not None:
            wellness_score = score_w1
        else:
            # Fall back to 30 days
            wellness_score = thirty_days

        try:
            from mood.services import MoodService
            profile.streak = MoodService.calculate_streak(user, today=today_date)
            profile.wellness_score = wellness_score
            profile.save()
            streak = profile.streak
        except Exception:
            streak = 0

        # Construct progress metrics page details
        badges = [
            {"id": "onboarding", "name": "Self Compassion", "description": "Completed Onboarding Setup", "unlocked": getattr(profile, 'is_onboarded', False)},
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
            "has_wellness_score": True,
            "wellnessScore": wellness_score,
            "message": "Wellness Score calculated successfully.",
            "streak": streak,
            "badges": badges,
            "history": history
        }
