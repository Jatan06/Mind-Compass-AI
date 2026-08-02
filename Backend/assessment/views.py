from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from .services import AssessmentService
from .serializers import AssessmentResponseSerializer

class AssessmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        response = AssessmentService.get_latest_assessment(request.user)
        if not response:
            return Response({'detail': 'No onboarding assessment found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = AssessmentResponseSerializer(response)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        from users.models import UserProfile
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        if profile.is_onboarded:
            return Response({'error': 'Assessment has already been completed.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            response = AssessmentService.save_assessment(request.user, request.data)
            serializer = AssessmentResponseSerializer(response)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': str(e.message)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        try:
            response = AssessmentService.update_assessment(request.user, request.data)
            serializer = AssessmentResponseSerializer(response)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({'error': str(e.message)}, status=status.HTTP_400_BAD_REQUEST)


class AssessmentRetakeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from users.models import UserProfile
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.is_onboarded = False
        profile.save()
        return Response({'success': True, 'message': 'Onboarding status reset. Ready to retake assessment.'}, status=status.HTTP_200_OK)
