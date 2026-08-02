from rest_framework import serializers
from .models import JournalEntry

class JournalEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry
        fields = ['id', 'user', 'date', 'text', 'is_voice', 'analysis', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'date', 'analysis', 'created_at', 'updated_at']
