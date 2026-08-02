from rest_framework import serializers
from .models import CrisisAlert

class CrisisAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrisisAlert
        fields = ['id', 'user', 'journal_entry', 'alert_level', 'status', 'trigger_message', 'resolved_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'journal_entry', 'created_at', 'updated_at']
