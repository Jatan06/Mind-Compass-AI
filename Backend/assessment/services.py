from django.core.exceptions import ValidationError
from django.db import transaction
from .models import AssessmentResponse
from users.models import UserProfile

class AssessmentService:
    @staticmethod
    def get_latest_assessment(user):
        try:
            return AssessmentResponse.objects.filter(user=user).latest('created_at')
        except AssessmentResponse.DoesNotExist:
            return None

    @classmethod
    @transaction.atomic
    def save_assessment(cls, user, raw_data):
        if not raw_data:
            raise ValidationError("Assessment data payload is required.")
            
        # Parse inputs for UserProfile updates
        demographic = raw_data.get('demographic', {})
        baseline = raw_data.get('baseline', {})
        goals = raw_data.get('goals', [])
        coping_methods = raw_data.get('copingMethods', [])
        
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        # Demographic
        if 'occupation' in demographic:
            profile.occupation = demographic.get('occupation')
            
        # Baseline
        if 'sleep' in baseline:
            profile.sleep_hours = baseline.get('sleep')
        if 'exercise' in baseline:
            profile.exercise_frequency = baseline.get('exercise')
        if 'screenTime' in baseline:
            profile.screen_time = baseline.get('screenTime')
        if 'water' in baseline:
            profile.water_intake = baseline.get('water')
            
        # Check lists
        profile.goals = goals
        profile.coping_methods = coping_methods
        profile.is_onboarded = True
        profile.save()
        
        # Save raw assessment record
        response = AssessmentResponse.objects.create(
            user=user,
            raw_data=raw_data
        )
        return response

    @classmethod
    @transaction.atomic
    def update_assessment(cls, user, raw_data):
        if not raw_data:
            raise ValidationError("Assessment update payload is required.")
            
        # Update UserProfile fields
        cls.save_assessment(user, raw_data)
        
        # Get existing response or return the newly created one
        return cls.get_latest_assessment(user)
