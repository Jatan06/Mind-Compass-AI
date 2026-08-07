from rest_framework import serializers
from .models import Recommendation
from activities.models import TherapyActivity
from activities.serializers import TherapyActivitySerializer

class RecommendationSerializer(serializers.ModelSerializer):
    activity = TherapyActivitySerializer(read_only=True)
    activity_id = serializers.PrimaryKeyRelatedField(
        queryset=TherapyActivity.objects.all(),
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
            'historical_matches', 'previous_success_rate', 'rec_type', 'mood_improvement', 'daily_suggestion'
        ]
        read_only_fields = ['id', 'user', 'activity', 'is_active', 'created_at', 'updated_at', 'confidence']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Phase 7: Dynamic Personalization Pipeline
        activity_data = representation.get('activity')
        if not activity_data or not activity_data.get('instructions'):
            return representation
            
        try:
            from journal.models import JournalEntry
            from mood.models import MoodLog
            from django.utils import timezone
            
            today = timezone.localdate()

            # Use prefetched attributes if the view set them (avoids N+1 when serializing lists)
            mood_log = getattr(instance, '_today_mood_log', 'UNSET')
            if mood_log == 'UNSET':
                mood_log = MoodLog.objects.filter(user=instance.user, date=today).first()

            journal = getattr(instance, '_today_journal', 'UNSET')
            if journal == 'UNSET':
                journal = JournalEntry.objects.filter(user=instance.user, created_at__date=today).first()
            
            # Format topics beautifully
            themes = journal.analysis.get('themes', []) if journal and journal.analysis else []
            formatted_topics = "your recent reflections"
            if themes:
                formatted_topics = themes[0] if len(themes) == 1 else f"{', '.join(themes[:-1])} and {themes[-1]}"
                
            emotion = journal.analysis.get('primary_emotion', 'calm').lower() if journal and journal.analysis else "calm"
            
            context = {
                '{{mood}}': str(mood_log.mood) if mood_log else "neutral",
                '{{stress}}': str(mood_log.stress) if mood_log else "moderate",
                '{{journal_topic}}': formatted_topics,
                '{{primary_emotion}}': emotion
            }
            
            updated_instructions = []
            for inst in activity_data['instructions']:
                if isinstance(inst, str):
                    new_inst = inst
                    for key, val in context.items():
                        new_inst = new_inst.replace(key, str(val))
                    updated_instructions.append(new_inst)
                elif isinstance(inst, dict):
                    new_dict = inst.copy()
                    if 'text' in new_dict and isinstance(new_dict['text'], str):
                        new_text = new_dict['text']
                        for key, val in context.items():
                            new_text = new_text.replace(key, str(val))
                        new_dict['text'] = new_text
                    if 'prompt' in new_dict and isinstance(new_dict['prompt'], str):
                        new_prompt = new_dict['prompt']
                        for key, val in context.items():
                            new_prompt = new_prompt.replace(key, str(val))
                        new_dict['prompt'] = new_prompt
                    updated_instructions.append(new_dict)
                else:
                    updated_instructions.append(inst)
                    
            # Phase 5: Adaptive Activity Difficulty
            if mood_log:
                stress = mood_log.stress
                base_time = representation['activity'].get('estimated_time', 5)
                
                if stress <= 3:
                    new_time = max(1, base_time // 2)
                    new_difficulty = 'Light'
                elif stress >= 8:
                    new_time = int(base_time * 1.5)
                    new_difficulty = 'Intensive'
                else:
                    new_time = base_time
                    new_difficulty = representation['activity'].get('difficulty', 'Beginner')
                    
                representation['activity']['estimated_time'] = new_time
                representation['activity']['duration'] = f"{new_time} min"
                representation['activity']['difficulty'] = new_difficulty
                
                # Dynamically mutate widget constraints
                if stress >= 8:
                    for inst in updated_instructions:
                        if isinstance(inst, dict):
                            if inst.get('type') == 'breathing_circle' and 'target_cycles' in inst:
                                inst['target_cycles'] = int(inst['target_cycles'] * 1.5)
                            elif inst.get('type') == 'text_input' and 'min_length' in inst:
                                inst['min_length'] = int(inst['min_length'] * 1.5)
                            elif inst.get('type') == 'progress_tap' and 'target_taps' in inst:
                                inst['target_taps'] = int(inst['target_taps'] * 1.5)
                            elif inst.get('type') == 'hold_release' and 'hold_seconds' in inst:
                                inst['hold_seconds'] = int(inst['hold_seconds'] * 1.5)

            representation['activity']['instructions'] = updated_instructions
        except Exception as e:
            # Failsafe: if templating crashes, just return original representation
            import logging
            logging.error(f"Personalization templating failed: {e}")
            
        return representation

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
