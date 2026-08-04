from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import MoodLog
from users.models import UserProfile

class MoodService:
    @classmethod
    def get_user_history(cls, user):
        return MoodLog.objects.filter(user=user)

    @classmethod
    def save_checkin(cls, user, validated_data):
        date = validated_data.get('date') or timezone.localdate()
        
        # Check if already logged for this date and block duplicate
        if MoodLog.objects.filter(user=user, date=date).exists():
            raise ValidationError("You have already logged your mood for today.")
            
        mood_log = MoodLog.objects.create(
            user=user,
            date=date,
            mood=validated_data.get('mood'),
            mood_label=validated_data.get('mood_label'),
            stress=validated_data.get('stress'),
            energy=validated_data.get('energy'),
            sleep=validated_data.get('sleep'),
            productivity=validated_data.get('productivity'),
            social=validated_data.get('social'),
            notes=validated_data.get('notes')
        )
        
        # Update streak
        cls._update_user_streak(user, date)
        
        return mood_log

    @classmethod
    def calculate_streak(cls, user, today=None):
        if today is None:
            today = timezone.localdate()
            
        dates = MoodLog.objects.filter(user=user).values_list('date', flat=True).distinct().order_by('-date')
        
        if not dates:
            return 0
            
        most_recent = dates[0]
        # Streak is active if the most recent checkin is today or yesterday
        if most_recent != today and most_recent != (today - timezone.timedelta(days=1)):
            return 0
            
        streak = 1
        current_expected_date = most_recent - timezone.timedelta(days=1)
        
        for date_val in dates[1:]:
            if date_val == current_expected_date:
                streak += 1
                current_expected_date = date_val - timezone.timedelta(days=1)
            elif date_val > current_expected_date:
                continue
            else:
                break
                
        return streak

    @classmethod
    def _update_user_streak(cls, user, date):
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)

        profile.streak = cls.calculate_streak(user, today=date)
        profile.save()
