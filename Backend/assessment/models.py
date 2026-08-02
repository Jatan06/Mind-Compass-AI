import uuid
from django.db import models
from django.conf import settings

class AssessmentResponse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assessment_responses')
    
    # Store complete JSON response structure
    raw_data = models.JSONField(help_text="Nested assessment response containing demographic profile and goals feedback.")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Assessment Response for {self.user.username} logged at {self.created_at.strftime('%Y-%m-%d')}"
