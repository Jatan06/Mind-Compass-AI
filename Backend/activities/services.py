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
    def record_feedback(user, activity_id, duration_minutes, satisfaction, mood_improved, mood_after=None, stress_after=None, comment=None):
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
            mood_improved=mood_improved,
            mood_after=mood_after,
            stress_after=stress_after,
            comment=comment
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
            
            # Phase 9: Quantitative Mood and Stress Tracking
            mood_val = rec.mood or 3
            if mood_after is not None:
                rec.mood_after = mood_after
                rec.improvement_score = float(mood_after - mood_val)
            else:
                if mood_improved == "Yes":
                    rec.mood_after = min(10, mood_val + 2)
                    rec.improvement_score = 2.0
                elif mood_improved == "A Little":
                    rec.mood_after = min(10, mood_val + 1)
                    rec.improvement_score = 1.0
                else:
                    rec.mood_after = max(1, mood_val - 1)
                    rec.improvement_score = -1.0

            if rec.stress is not None:
                stress_before = rec.stress
                if stress_after is not None:
                    final_stress = stress_after
                else:
                    if rec.improvement_score > 0:
                        final_stress = max(1, stress_before - int(rec.improvement_score))
                    else:
                        final_stress = stress_before
                rec.mood_improvement = f"Stress Improved: {stress_before} → {final_stress}"
            elif rec.mood_before is not None and rec.mood_after is not None:
                rec.mood_improvement = f"Mood Improved: {rec.mood_before} → {rec.mood_after}"
            else:
                rec.mood_improvement = "No change"
            
            rec.save()

        return feedback

    @staticmethod
    def list_user_feedbacks(user):
        return ActivityFeedback.objects.filter(user=user).select_related('activity').order_by('-date', '-created_at')
