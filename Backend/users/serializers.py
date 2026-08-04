from rest_framework import serializers
from .models import User, UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'id', 'occupation', 'sleep_hours', 'exercise_frequency', 
            'screen_time', 'water_intake', 'goals', 'coping_methods', 'trigger_keywords', 
            'voice_preference', 'notifications', 'theme', 'streak', 
            'wellness_score', 'is_onboarded', 'is_email_verified', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'streak', 'wellness_score', 'is_onboarded', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile', 'google_id', 'is_staff']
        read_only_fields = ['id', 'is_staff']
