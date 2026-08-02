import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class MoodLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mood_logs')
    
    date = models.DateField(default=timezone.now)
    mood = models.IntegerField(help_text="Mood score from 1 (lowest) to 5 (highest)")
    mood_label = models.CharField(max_length=50) # Down, Neutral, Good, Happy, Excellent
    
    stress = models.IntegerField(help_text="Stress score from 0 (calm) to 10 (stressed)")
    energy = models.IntegerField(help_text="Energy and focus score from 0 to 10")
    sleep = models.DecimalField(max_digits=4, decimal_places=2, help_text="Sleeptime duration in hours")
    productivity = models.IntegerField(help_text="Productivity score from 0 to 10")
    social = models.IntegerField(help_text="Social connection score from 0 to 10")
    
    notes = models.TextField(blank=True, null=True, help_text="Optional daily notes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        unique_together = ('user', 'date') # Throttle to max one log per day

    def __str__(self):
        return f"{self.user.username} - Mood {self.mood} on {self.date}"
