import uuid
from django.db import models
from django.conf import settings
from activities.models import TherapyActivity

class Recommendation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recommendations')
    activity = models.ForeignKey(TherapyActivity, on_delete=models.CASCADE, related_name='recommendations')
    
    reason = models.TextField(help_text="Why this activity was suggested (explain fit profile context)")
    is_active = models.BooleanField(default=True, help_text="Is this the current recommendation shown on the dashboard")
    
    # Historical metadata tracking
    trigger = models.CharField(max_length=255, blank=True, null=True)
    journal_theme = models.CharField(max_length=255, blank=True, null=True)
    mood = models.IntegerField(blank=True, null=True)
    stress = models.IntegerField(blank=True, null=True)
    completed = models.BooleanField(default=False)
    user_rating = models.IntegerField(blank=True, null=True)
    mood_before = models.IntegerField(blank=True, null=True)
    mood_after = models.IntegerField(blank=True, null=True)
    improvement_score = models.FloatField(blank=True, null=True)
    
    score = models.FloatField(blank=True, null=True, help_text="Recommendation raw calculated score")
    confidence = models.FloatField(blank=True, null=True, help_text="Confidence percentage float")
    reasons_list = models.JSONField(default=list, blank=True, help_text="Bulleted list of personalized matches")

    # Phase 5A additions
    rec_type = models.CharField(max_length=15, choices=[('quick', 'Quick'), ('complete', 'Complete')], default='complete', help_text="Type of recommendation (quick or complete)")
    historical_matches = models.IntegerField(default=0, help_text="Number of historical theme-matching journals")
    success_rate = models.CharField(max_length=50, blank=True, null=True, help_text="Historical activity success rate percentage string")
    mood_improvement = models.CharField(max_length=100, blank=True, null=True, help_text="Mood improvement description string")
    daily_suggestion = models.TextField(blank=True, null=True, help_text="AI-style coach daily suggestion/insight")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        status = "Active" if self.is_active else "Historical"
        username = getattr(self.user, 'username', str(self.user))
        return f"Recommendation for {username}: {self.activity.title} ({status})"

