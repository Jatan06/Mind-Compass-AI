from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import JournalService
from .serializers import JournalEntrySerializer

class JournalListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        entries = JournalService.list_entries(request.user)
        serializer = JournalEntrySerializer(entries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        text = request.data.get('text')
        is_voice = request.data.get('is_voice', False)
        
        if not text:
            return Response({'error': 'Journal text is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        entry = JournalService.create_entry(request.user, text, is_voice)
        # Note: AIServicePipeline.run_pipeline_if_ready is called inside JournalService
        # after NLP completes on the background thread, ensuring analysis is ready.
        serializer = JournalEntrySerializer(entry)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class JournalDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        entry = JournalService.get_entry(request.user, pk)
        if not entry:
            return Response({'detail': 'Journal entry not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = JournalEntrySerializer(entry)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        text = request.data.get('text')
        is_voice = request.data.get('is_voice')
        
        if not text:
            return Response({'error': 'Journal text is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        entry = JournalService.update_entry(request.user, pk, text, is_voice)
        if not entry:
            return Response({'detail': 'Journal entry not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        # Note: AIServicePipeline.run_pipeline_if_ready is called inside JournalService
        # after NLP completes on the background thread, ensuring analysis is ready.
        serializer = JournalEntrySerializer(entry)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        success = JournalService.delete_entry(request.user, pk)
        if not success:
            return Response({'detail': 'Journal entry not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'message': 'Journal entry deleted.'}, status=status.HTTP_204_NO_CONTENT)
