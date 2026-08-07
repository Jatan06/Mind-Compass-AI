from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ActivityFeedback, ActivitySession
from recommendation.models import Recommendation

@receiver(post_save, sender=Recommendation)
def aggregate_recommendations(sender, instance, created, **kwargs):
    if created and getattr(instance, 'activity', None):
        act = instance.activity
        act.agg_total_recommendations += 1
        act.save(update_fields=['agg_total_recommendations'])

@receiver(post_save, sender=ActivitySession)
def aggregate_session_starts(sender, instance, created, **kwargs):
    if created and getattr(instance, 'activity', None):
        act = instance.activity
        act.agg_started += 1
        act.save(update_fields=['agg_started'])

@receiver(post_save, sender=ActivityFeedback)
def aggregate_completions(sender, instance, created, **kwargs):
    if created and getattr(instance, 'activity', None):
        act = instance.activity
        act.agg_completed += 1
        
        # Recalculate average improvement
        # ActivityFeedback doesn't have improvement_score exactly natively in it,
        # but Recommendation does. Let's find the most recent Recommendation and get its score.
        recent_rec = Recommendation.objects.filter(
            activity=act, user=instance.user
        ).order_by('-updated_at').first()
        
        if recent_rec and recent_rec.improvement_score is not None:
            score = recent_rec.improvement_score
            # Running Average: (OldAvg * (Count - 1) + NewScore) / Count
            old_avg = act.agg_avg_improvement
            count = act.agg_completed
            if count == 1:
                act.agg_avg_improvement = score
            else:
                act.agg_avg_improvement = ((old_avg * (count - 1)) + score) / count
        
        act.save(update_fields=['agg_completed', 'agg_avg_improvement'])
