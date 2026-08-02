from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .services import ActivityService
from .serializers import TherapyActivitySerializer, ActivityFeedbackSerializer, ActivityCompletionSerializer

class ActivityListView(APIView):
    permission_classes = [AllowAny] # Activities can be listed by anonymous users (e.g. for landing display)

    def get(self, request):
        activities = ActivityService.list_activities()
        serializer = TherapyActivitySerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ActivityDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        activity = ActivityService.get_activity(pk)
        if not activity:
            return Response({'detail': 'Activity not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = TherapyActivitySerializer(activity)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ActivityFeedbackView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        feedbacks = ActivityService.list_user_feedbacks(request.user)
        serializer = ActivityFeedbackSerializer(feedbacks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        activity_id = request.data.get('activity_id')
        duration_minutes = request.data.get('duration_minutes')
        satisfaction = request.data.get('satisfaction')
        mood_improved = request.data.get('mood_improved')

        if not activity_id:
            return Response({'error': 'Activity ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate structure via completion serializer
        completion_serializer = ActivityCompletionSerializer(data={
            'duration_minutes': duration_minutes,
            'satisfaction': satisfaction,
            'mood_improved': mood_improved
        })
        if not completion_serializer.is_valid():
            return Response(completion_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            feedback = ActivityService.record_feedback(
                request.user,
                activity_id=activity_id,
                duration_minutes=duration_minutes,
                satisfaction=satisfaction,
                mood_improved=mood_improved
            )
            serializer = ActivityFeedbackSerializer(feedback)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
