from django.contrib import admin
from .models import TherapyActivity, ActivityFeedback

@admin.register(TherapyActivity)
class TherapyActivityAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'category', 'duration', 'difficulty')
    list_filter = ('category', 'difficulty')
    search_fields = ('id', 'title', 'description')

@admin.register(ActivityFeedback)
class ActivityFeedbackAdmin(admin.ModelAdmin):
    list_display = ('user', 'activity', 'date', 'duration_minutes', 'satisfaction', 'mood_improved')
    list_filter = ('satisfaction', 'mood_improved', 'date')
    search_fields = ('user__username', 'activity__title')
