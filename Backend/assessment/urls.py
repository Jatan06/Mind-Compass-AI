from django.urls import path
from .views import AssessmentView, AssessmentRetakeView

urlpatterns = [
    path('', AssessmentView.as_view(), name='assessment_root'),
    path('retake/', AssessmentRetakeView.as_view(), name='assessment_retake'),
]
