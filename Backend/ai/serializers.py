from rest_framework import serializers

class SentimentRequestSerializer(serializers.Serializer):
    text = serializers.CharField(required=True, allow_blank=False)

class SentimentResponseSerializer(serializers.Serializer):
    sentiment = serializers.CharField()
    scores = serializers.DictField(child=serializers.FloatField())
    confidence = serializers.FloatField()

class EmotionRequestSerializer(serializers.Serializer):
    text = serializers.CharField(required=True, allow_blank=False)

class EmotionResponseSerializer(serializers.Serializer):
    primary_emotion = serializers.CharField()
    secondary_emotion = serializers.CharField(allow_null=True, required=False)
    confidence = serializers.FloatField()

class KeywordRequestSerializer(serializers.Serializer):
    text = serializers.CharField(required=True, allow_blank=False)

class KeywordResponseSerializer(serializers.Serializer):
    topics = serializers.ListField(child=serializers.CharField())
    stressors = serializers.ListField(child=serializers.CharField())
    keywords = serializers.ListField(child=serializers.CharField())

class CrisisRequestSerializer(serializers.Serializer):
    text = serializers.CharField(required=True, allow_blank=False)

class CrisisResponseSerializer(serializers.Serializer):
    risk_level = serializers.CharField()
    reason = serializers.CharField()

class MoodPredictionResponseSerializer(serializers.Serializer):
    predicted_mood = serializers.IntegerField()
    confidence = serializers.FloatField()
    reasons = serializers.ListField(child=serializers.CharField())

class AIInsightsResponseSerializer(serializers.Serializer):
    weekly_summary = serializers.CharField()
    cognitive_distortions = serializers.ListField(child=serializers.CharField())
    focus_areas = serializers.ListField(child=serializers.CharField())
    average_mood_score = serializers.FloatField()
    average_stress_score = serializers.FloatField()
    data_completeness = serializers.CharField()
    suggested_actions = serializers.ListField(child=serializers.CharField())
    profile_state = serializers.CharField(required=False, allow_null=True)
    supporting_habit = serializers.CharField(required=False, allow_null=True)
    recovery_spectrum = serializers.CharField(required=False, allow_null=True)
    primary_focus_area = serializers.CharField(required=False, allow_null=True)
