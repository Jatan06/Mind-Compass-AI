from django.urls import path
from .views import ActivityListView, ActivityDetailView

urlpatterns = [
    path('', ActivityListView.as_view(), name='activity_list'),
    path('<str:pk>/', ActivityDetailView.as_view(), name='activity_detail'),
]
