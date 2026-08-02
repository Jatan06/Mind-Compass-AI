from rest_framework import serializers
from .models import TherapyActivity, ActivityFeedback

class TherapyActivitySerializer(serializers.ModelSerializer):
    short_description = serializers.SerializerMethodField()
    clinical_purpose = serializers.SerializerMethodField()
    scientific_benefits = serializers.SerializerMethodField()
    precautions = serializers.SerializerMethodField()
    equipment = serializers.SerializerMethodField()
    setting = serializers.SerializerMethodField()
    format = serializers.SerializerMethodField()
    evidence_level = serializers.SerializerMethodField()
    suitable_moods = serializers.SerializerMethodField()
    suitable_conditions = serializers.SerializerMethodField()

    class Meta:
        model = TherapyActivity
        fields = [
            'id', 'title', 'category', 'duration', 'difficulty', 
            'description', 'instructions', 'created_at', 'updated_at',
            'short_description', 'clinical_purpose', 'scientific_benefits',
            'precautions', 'equipment', 'setting', 'format', 'evidence_level',
            'suitable_moods', 'suitable_conditions'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def _parse_field(self, obj, field_name):
        import re
        pattern = rf"\*\*{re.escape(field_name)}:\*\*\s*(.*)"
        match = re.search(pattern, obj.description)
        if match:
            val = match.group(1).strip()
            if val.lower() in ['none', 'none required', 'none.']:
                return None
            return val
        return None

    def get_short_description(self, obj):
        parts = obj.description.split('---')
        if parts:
            return parts[0].strip()
        return obj.description

    def get_clinical_purpose(self, obj):
        return self._parse_field(obj, "Clinical Purpose")

    def get_scientific_benefits(self, obj):
        return self._parse_field(obj, "Scientific Benefits")

    def get_precautions(self, obj):
        return self._parse_field(obj, "Contraindications/Precautions")

    def get_equipment(self, obj):
        return self._parse_field(obj, "Equipment Required")

    def get_setting(self, obj):
        return self._parse_field(obj, "Setting")

    def get_format(self, obj):
        return self._parse_field(obj, "Format")

    def get_evidence_level(self, obj):
        return self._parse_field(obj, "Evidence Level")
        
    def get_suitable_moods(self, obj):
        return self._parse_field(obj, "Suitable Moods")
        
    def get_suitable_conditions(self, obj):
        return self._parse_field(obj, "Suitable Mental Health Conditions")

class ActivityFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityFeedback
        fields = ['id', 'user', 'activity', 'date', 'duration_minutes', 'satisfaction', 'mood_improved', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'date', 'created_at', 'updated_at']

class ActivityCompletionSerializer(serializers.Serializer):
    duration_minutes = serializers.IntegerField(min_value=1)
    satisfaction = serializers.IntegerField(min_value=1, max_value=5)
    mood_improved = serializers.CharField(max_length=50)
