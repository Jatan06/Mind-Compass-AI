from django.urls import path
from .views import JournalListCreateView, JournalDetailView

urlpatterns = [
    path('', JournalListCreateView.as_view(), name='journal_list_create'),
    path('<uuid:pk>/', JournalDetailView.as_view(), name='journal_detail'),
]
