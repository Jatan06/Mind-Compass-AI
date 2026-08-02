from recommendation.services import RecommendationService

class AIRecommendationService:
    @classmethod
    def get_recommendation(cls, user):
        """
        AI wrapper adapting the existing rule-based recommendation engine.
        Acts as an abstraction layer to swap rule-based engine with custom models in the future.
        """
        rec = RecommendationService.get_today_recommendation(user)
        if rec:
            return {
                "id": rec.activity.id,
                "title": rec.activity.title,
                "category": rec.activity.category,
                "duration": rec.activity.duration,
                "difficulty": rec.activity.difficulty,
                "description": rec.activity.description,
                "instructions": rec.activity.instructions,
                "reason": rec.reason
            }
        return None
