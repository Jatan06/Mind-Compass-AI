from django.core.exceptions import ObjectDoesNotExist
from .models import TherapyActivity, ActivityFeedback

class ActivityService:
    @staticmethod
    def list_activities():
        return TherapyActivity.objects.all()

    @staticmethod
    def get_activity(activity_id):
        try:
            return TherapyActivity.objects.get(id=activity_id)
        except ObjectDoesNotExist:
            return None

    @staticmethod
    def record_feedback(user, activity_id, duration_minutes, satisfaction, mood_improved):
        from django.utils import timezone
        from django.core.exceptions import ValidationError
        from recommendation.models import Recommendation
        
        activity = TherapyActivity.objects.get(id=activity_id)
        today = timezone.localdate()
        
        if ActivityFeedback.objects.filter(user=user, activity=activity, date=today).exists():
            raise ValidationError("You have already completed this activity today.")
            
        feedback = ActivityFeedback.objects.create(
            user=user,
            activity=activity,
            duration_minutes=duration_minutes,
            satisfaction=satisfaction,
            mood_improved=mood_improved
        )

        rec = Recommendation.objects.filter(
            user=user,
            activity=activity,
            completed=False,
            created_at__date__gte=today - timezone.timedelta(days=2)
        ).order_by('-created_at').first()

        if rec:
            rec.completed = True
            rec.user_rating = satisfaction
            mood_val = rec.mood or 3
            if mood_improved == "Yes":
                rec.mood_after = min(5, mood_val + 1)
                rec.improvement_score = 2.0
            elif mood_improved == "A Little":
                rec.mood_after = min(5, mood_val)
                rec.improvement_score = 1.0
            else:
                rec.mood_after = max(1, mood_val - 1)
                rec.improvement_score = 0.0

            # Phase 5A: update mood_improvement
            if rec.stress is not None:
                stress_before = rec.stress
                if rec.improvement_score >= 2.0:
                    stress_after = max(1, stress_before - 3)
                elif rec.improvement_score >= 1.0:
                    stress_after = max(1, stress_before - 1)
                else:
                    stress_after = stress_before
                rec.mood_improvement = f"Stress Improved: {stress_before} → {stress_after}"
            elif rec.mood_before is not None and rec.mood_after is not None:
                rec.mood_improvement = f"Mood Improved: {rec.mood_before} → {rec.mood_after}"
            else:
                rec.mood_improvement = "No change"
            
            rec.save()

        return feedback

    @staticmethod
    def list_user_feedbacks(user):
        return ActivityFeedback.objects.filter(user=user).order_by('-date', '-created_at')
