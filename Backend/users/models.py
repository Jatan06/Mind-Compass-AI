import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    
    # Use email for username auth if desired in authenticators later
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

class UserProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    objects = models.Manager()
    
    occupation = models.CharField(max_length=100, blank=True, null=True)
    sleep_hours = models.DecimalField(max_digits=4, decimal_places=2, default=7.00)
    exercise_frequency = models.CharField(max_length=50, blank=True, null=True)
    screen_time = models.DecimalField(max_digits=4, decimal_places=2, default=6.00)
    water_intake = models.DecimalField(max_digits=4, decimal_places=2, default=2.50)
    
    goals = models.JSONField(default=list, blank=True)
    coping_methods = models.JSONField(default=list, blank=True)
    trigger_keywords = models.JSONField(default=list, blank=True, null=True)
    
    voice_preference = models.CharField(max_length=50, default='calm-female')
    notifications = models.JSONField(default=dict, blank=True) # {"dailyCheckin": True, "weeklySummary": True, "wellnessReminders": False}
    theme = models.CharField(max_length=20, default='light')
    
    streak = models.IntegerField(default=0)
    wellness_score = models.IntegerField(default=72)
    is_onboarded = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username}"
