from rest_framework import serializers
from .models import MoodLog

class MoodLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodLog
        fields = [
            'id', 'user', 'date', 'mood', 'mood_label', 
            'stress', 'energy', 'sleep', 'productivity', 
            'social', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
