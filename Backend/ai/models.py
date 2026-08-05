import uuid
from django.db import models
from django.conf import settings
from journal.models import JournalEntry

class EmotionAnalysis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    journal_entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='emotion_analyses')
    primary_emotion = models.CharField(max_length=50)
    secondary_emotion = models.CharField(max_length=50, blank=True, null=True)
    confidence = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    objects = models.Manager()
    DoesNotExist: type[Exception]

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        entry_id = getattr(self, 'journal_entry_id', getattr(self.journal_entry, 'id', 'N/A'))
        return f"Emotion for entry {entry_id}: {self.primary_emotion} ({self.confidence:.2f})"

class MoodPrediction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mood_predictions')
    predicted_mood = models.IntegerField()
    confidence = models.FloatField()
    reasons = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = models.Manager()
    DoesNotExist: type[Exception]

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        get_date = getattr(self.created_at, 'date', None)
        date_val = get_date() if callable(get_date) else self.created_at
        return f"Prediction for {self.user}: Mood {self.predicted_mood} on {date_val}"

class AIInsight(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_insights')
    summary = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    objects = models.Manager()
    DoesNotExist: type[Exception]

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        get_date = getattr(self.created_at, 'date', None)
        date_val = get_date() if callable(get_date) else self.created_at
        return f"AI Insight for {self.user} on {date_val}"
