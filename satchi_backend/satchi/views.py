# myproject/submission_app/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import ProjectSubmissionSerializer

class ProjectSubmissionView(APIView):
    """
    API view to handle project submissions.
    Allows POST requests to create new submissions.
    """
    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to create a new ProjectSubmission.
        """
        serializer = ProjectSubmissionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)