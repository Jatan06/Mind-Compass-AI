import uuid
from django.db import models
from django.conf import settings

class TherapyActivity(models.Model):
    # Static or pre-seeded activities list
    id = models.CharField(primary_key=True, max_length=100, help_text="Unique slug (e.g. 'act-1') matching frontend constants")
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100, help_text="E.g. Mindfulness, Cognitive, Somatic")
    duration = models.CharField(max_length=50, help_text="E.g. '10 min', '5 min'")
    difficulty = models.CharField(max_length=50, help_text="E.g. Simple, Moderate")
    description = models.TextField()
    instructions = models.JSONField(default=list, help_text="Step-by-step array of instructions for user to follow.")
    
    # Phase 2 & 5 Recommendation Mapping Fields
    stress_range = models.JSONField(default=list, blank=True, help_text="List of stress levels [min, max]")
    mood_range = models.JSONField(default=list, blank=True, help_text="List of recommended mood levels [min, max]")
    topics = models.JSONField(default=list, blank=True, help_text="List of matching journal topics/themes")
    emotions = models.JSONField(default=list, blank=True, help_text="List of matching emotions")
    contraindications = models.JSONField(default=list, blank=True, help_text="List of conditions where this should NOT be recommended")
    interactive_type = models.CharField(max_length=50, default='static', help_text="E.g., breathing, meditation, cognitive")
    estimated_time = models.IntegerField(default=5, help_text="Estimated duration in minutes for sorting")

    # Phase 10: Global Analytics Engine
    agg_started = models.IntegerField(default=0)
    agg_completed = models.IntegerField(default=0)
    agg_avg_improvement = models.FloatField(default=0.0)
    agg_total_recommendations = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    class Meta:
        verbose_name_plural = "Therapy Activities"

    def __str__(self):
        return f"{self.title} ({self.id})"

class ActivityFeedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activity_feedbacks')
    activity = models.ForeignKey(TherapyActivity, on_delete=models.CASCADE, related_name='feedbacks')
    
    date = models.DateField(auto_now_add=True)
    duration_minutes = models.IntegerField(help_text="Actual duration user completed the exercise in minutes")
    
    satisfaction = models.IntegerField(help_text="Satisfaction rating from 1 to 5")
    mood_improved = models.CharField(max_length=50) # E.g. 'Yes', 'A Little', 'No'
    
    # Phase 9 fields
    mood_after = models.IntegerField(blank=True, null=True, help_text="1-10 scale")
    stress_after = models.IntegerField(blank=True, null=True, help_text="1-10 scale")
    comment = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        username = getattr(self.user, 'username', str(self.user))
        return f"{username} feedback for {self.activity.title}"

# Phase 6 Database Integration
class ActivitySession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activity_sessions')
    activity = models.ForeignKey(TherapyActivity, on_delete=models.CASCADE, related_name='sessions')
    
    status = models.CharField(max_length=20, default='started', help_text="started, completed, skipped, cancelled")
    mood_before = models.IntegerField(blank=True, null=True)
    mood_after = models.IntegerField(blank=True, null=True)
    duration = models.IntegerField(default=0, help_text="Secs spent in the interactive session")
    
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        username = getattr(self.user, 'username', str(self.user))
        return f"{username} session for {self.activity.title} ({self.status})"
