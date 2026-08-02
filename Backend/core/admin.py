from django.contrib import admin
from .models import CrisisAlert

@admin.register(CrisisAlert)
class CrisisAlertAdmin(admin.ModelAdmin):
    list_display = ('user', 'alert_level', 'status', 'created_at', 'resolved_at')
    list_filter = ('alert_level', 'status', 'created_at')
    search_fields = ('user__username', 'trigger_message')
    readonly_fields = ('created_at', 'updated_at')
