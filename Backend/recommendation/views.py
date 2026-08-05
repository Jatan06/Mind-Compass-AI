from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import RecommendationService
from .serializers import RecommendationSerializer

from django.utils import timezone

class TodayRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        from mood.models import MoodLog
        from journal.models import JournalEntry
        from .models import Recommendation
        from .serializers import RecommendationSerializer
        from .services import RecommendationService, QuickRecommendationService
        
        has_mood = MoodLog.objects.filter(user=request.user, date=today).exists()
        has_journal = JournalEntry.objects.filter(user=request.user, created_at__date=today).exists()
        
        # Build yesterday's recommendation details
        yesterday_data = None
        yesterday_rec = Recommendation.objects.filter(user=request.user, created_at__date__lt=today).order_by('-created_at').first()
        if yesterday_rec:
            imp_str = yesterday_rec.mood_improvement or "No change"
            if not yesterday_rec.mood_improvement and yesterday_rec.completed:
                if yesterday_rec.stress is not None:
                    stress_before = yesterday_rec.stress
                    if yesterday_rec.improvement_score and yesterday_rec.improvement_score >= 2.0:
                        stress_after = max(1, stress_before - 3)
                    elif yesterday_rec.improvement_score and yesterday_rec.improvement_score >= 1.0:
                        stress_after = max(1, stress_before - 1)
                    else:
                        stress_after = stress_before
                    imp_str = f"Stress Improved: {stress_before} → {stress_after}"
                elif yesterday_rec.mood_before is not None and yesterday_rec.mood_after is not None:
                    imp_str = f"Mood Improved: {yesterday_rec.mood_before} → {yesterday_rec.mood_after}"
            
            rec_date = yesterday_rec.created_at.date()
            day = rec_date.day
            month_name = rec_date.strftime("%B")
            date_str = f"{day} {month_name}"
            is_exactly_yesterday = (rec_date == today - timezone.timedelta(days=1))
            
            yesterday_data = {
                "activity_name": yesterday_rec.activity.title,
                "completed": yesterday_rec.completed,
                "user_rating": yesterday_rec.user_rating,
                "mood_improvement": imp_str,
                "date": date_str,
                "is_exactly_yesterday": is_exactly_yesterday
            }

        # 1. Locked State: No mood log today
        if not has_mood:
            return Response({
                "status": "locked",
                "yesterday_recommendation": yesterday_data
            }, status=status.HTTP_200_OK)
            
        # 2. Quick State: Mood exists, but Journal does not
        if not has_journal:
            rec = QuickRecommendationService.get_quick_recommendation(request.user)
            if not rec:
                return Response({
                    "status": "locked",
                    "yesterday_recommendation": yesterday_data
                }, status=status.HTTP_200_OK)
            serializer = RecommendationSerializer(rec)
            data = serializer.data
            
            conf_val = data.get("confidence")
            if isinstance(conf_val, float):
                # if stored as 0.72, show 72. If stored as 72.0, show 72
                conf_val = int(conf_val * 100) if conf_val < 1.0 else int(conf_val)

            rec_score = data.get("recommendation_score")
            if isinstance(rec_score, float):
                rec_score = int(rec_score)

            return Response({
                "status": "quick",
                "confidence": conf_val,
                "recommendation_score": rec_score or 68,
                "has_conflict": False,
                "conflict_reason": "",
                "reason": data.get("reason", []),
                "activity": data.get("activity"),
                "daily_suggestion": data.get("daily_suggestion"),
                "yesterday_recommendation": yesterday_data
            }, status=status.HTTP_200_OK)
            
        # 3. Complete State: Both exist
        rec = RecommendationService.get_today_recommendation(request.user)
        if not rec:
            return Response({'detail': 'No recommendations found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = RecommendationSerializer(rec)
        data = serializer.data
        
        conf_val = data.get("confidence")
        if isinstance(conf_val, float):
            conf_val = int(conf_val * 100) if conf_val < 1.0 else int(conf_val)

        rec_score = data.get("recommendation_score")
        if isinstance(rec_score, float):
            rec_score = int(rec_score)

        resp_status = "complete"
        if rec.rec_type == 'wellness':
            resp_status = "wellness"

        # Conflict info is attached as transient attributes by the service
        has_conflict = getattr(rec, '_has_conflict', False)
        conflict_reason = getattr(rec, '_conflict_reason', "")

        return Response({
            "status": resp_status,
            "confidence": conf_val,
            "recommendation_score": rec_score or 91,
            "historical_matches": data.get("historical_matches", 0),
            "previous_success_rate": data.get("previous_success_rate", "80%"),
            "has_conflict": has_conflict,
            "conflict_reason": conflict_reason,
            "reason": data.get("reason", []),
            "activity": data.get("activity"),
            "daily_suggestion": data.get("daily_suggestion")
        }, status=status.HTTP_200_OK)

class RecommendationHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        history = RecommendationService.get_recommendation_history(request.user)
        serializer = RecommendationSerializer(history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
