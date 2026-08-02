from rest_framework import serializers
from .models import Recommendation
from activities.serializers import TherapyActivitySerializer

class RecommendationSerializer(serializers.ModelSerializer):
    activity = TherapyActivitySerializer(read_only=True)
    activity_id = serializers.PrimaryKeyRelatedField(
        queryset=Recommendation.objects.none(),
        source='activity',
        write_only=True
    )
    recommendation_score = serializers.FloatField(source='score', read_only=True)
    historical_matches = serializers.SerializerMethodField()
    previous_success_rate = serializers.SerializerMethodField()
    reason = serializers.SerializerMethodField()

    class Meta:
        model = Recommendation
        fields = [
            'id', 'user', 'activity', 'activity_id', 'reason', 'is_active', 
            'created_at', 'updated_at', 'confidence', 'recommendation_score',
            'historical_matches', 'previous_success_rate', 'rec_type', 'mood_improvement'
        ]
        read_only_fields = ['id', 'user', 'activity', 'is_active', 'created_at', 'updated_at', 'confidence']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from activities.models import TherapyActivity
        self.fields['activity_id'].queryset = TherapyActivity.objects.all()

    def get_historical_matches(self, obj):
        # Fall back to dynamic calculation if model field is unset or 0
        if obj.historical_matches > 0:
            return obj.historical_matches
        
        from journal.models import JournalEntry
        from django.utils import timezone
        if not obj.journal_theme:
            return 0
        themes = [t.strip().lower() for t in obj.journal_theme.split(",") if t.strip()]
        if not themes:
            return 0
        today = obj.created_at.date()
        past_journals = JournalEntry.objects.filter(
            user=obj.user,
            created_at__date__gte=today - timezone.timedelta(days=30),
            created_at__date__lt=today
        )
        count = 0
        for pj in past_journals:
            if pj.analysis:
                pj_themes = [t.lower() for t in pj.analysis.get("themes", [])]
                if any(t in pj_themes for t in themes):
                    count += 1
        return count

    def get_previous_success_rate(self, obj):
        if obj.success_rate:
            return obj.success_rate
            
        today = obj.created_at.date()
        total = Recommendation.objects.filter(user=obj.user, activity=obj.activity, created_at__date__lt=today).count()
        completed = Recommendation.objects.filter(user=obj.user, activity=obj.activity, completed=True, created_at__date__lt=today).count()
        if total > 0:
            rate = int((completed / total) * 100)
            return f"{rate}%"
        return None

    def get_reason(self, obj):
        if obj.reasons_list:
            return obj.reasons_list
        if obj.reason:
            parts = [p.strip() for p in obj.reason.split('.') if p.strip()]
            return [p + '.' for p in parts]
        return ["Recommended to support your goals."]
