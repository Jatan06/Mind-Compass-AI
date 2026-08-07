import uuid
from django.db import models
from django.conf import settings

class JournalEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='journal_entries')
    
    date = models.DateTimeField(auto_now_add=True)
    text = models.TextField(help_text="Journal entry text content (transcribed if voice entry)")
    is_voice = models.BooleanField(default=False, help_text="Designates if this entry was captured via voice recording.")
    
    # Store dynamic sentiment classification analysis
    # Expected structure: {"sentiment": "Negative", "emotion": "Anxiety", "confidence": 0.94, "themes": ["Fatigue"], "crisisStatus": "Safe"}
    analysis = models.JSONField(default=dict, blank=True, help_text="AI Analysis containing sentiment indicators and themes.")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()
    DoesNotExist: type[Exception]

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at'], name='journal_user_created_idx'),
        ]

    def __str__(self):
        text_str = str(self.text) if self.text else ""
        snippet = text_str[:30] + "..." if len(text_str) > 30 else text_str
        strftime = getattr(self.created_at, 'strftime', None)
        date_str = strftime('%Y-%m-%d') if callable(strftime) else str(self.created_at)
        return f"{self.user} - {date_str} - '{snippet}'"
