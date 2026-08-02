from django.contrib import admin
from .models import MoodLog

@admin.register(MoodLog)
class MoodLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'mood', 'mood_label', 'stress', 'energy', 'sleep')
    list_filter = ('mood', 'mood_label', 'date')
    search_fields = ('user__username', 'user__email', 'notes')
    readonly_fields = ('created_at', 'updated_at')
