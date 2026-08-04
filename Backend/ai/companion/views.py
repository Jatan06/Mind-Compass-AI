from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .services import CompanionService


class CompanionChatView(APIView):
    """
    POST /api/ai/companion/
    Accepts a message and optional conversation history, returns a
    personalized AI companion response grounded in the user's profile data.

    Request Body:
        {
            "message": "How am I doing lately?",
            "history": [
                {"role": "user", "content": "Hi!"},
                {"role": "model", "content": "Hey there! Great to see you..."}
            ]
        }

    Response:
        {
            "response": "Based on your recent check-ins...",
            "model": "gemini-1.5-flash"
        }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get('message', '').strip()
        history = request.data.get('history', [])

        if not message:
            return Response(
                {'error': 'Message cannot be empty.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(message) > 2000:
            return Response(
                {'error': 'Message is too long (max 2000 characters).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(history, list):
            history = []

        # Trim history to last 20 turns to keep context manageable
        history = history[-20:]

        result = CompanionService.chat(
            user=request.user,
            message=message,
            history=history
        )

        return Response(result, status=status.HTTP_200_OK)
