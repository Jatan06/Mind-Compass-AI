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

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Emotion for entry {self.journal_entry.id}: {self.primary_emotion} ({self.confidence:.2f})"

class MoodPrediction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mood_predictions')
    predicted_mood = models.IntegerField()
    confidence = models.FloatField()
    reasons = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Prediction for {self.user.username}: Mood {self.predicted_mood} on {self.created_at.date()}"

class AIInsight(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_insights')
    summary = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"AI Insight for {self.user.username} on {self.created_at.date()}"
