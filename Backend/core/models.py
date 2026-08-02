import uuid
from django.db import models
from django.conf import settings

class CrisisAlert(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='crisis_alerts')
    
    # Optional connection to the specific journal entry that triggered this
    journal_entry = models.ForeignKey(
        'journal.JournalEntry',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='crisis_alerts',
        help_text="The journal entry that triggered this crisis alert, if any."
    )
    
    alert_level = models.CharField(max_length=50, default='Critical') # E.g. Critical, Warning, Moderate
    status = models.CharField(max_length=50, default='Active') # E.g. Active, Resolved, Under Review
    trigger_message = models.TextField(blank=True, null=True, help_text="Snippet or explanation of what triggered the risk flag.")
    
    resolved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Crisis Alert ({self.alert_level}) for {self.user.username} - {self.status}"
