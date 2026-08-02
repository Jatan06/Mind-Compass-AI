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
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} feedback for {self.activity.title}"
