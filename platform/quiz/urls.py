from django.urls import path
from . import views

app_name = 'quiz'

urlpatterns = [
    path('session/<int:session_id>/', views.quiz_view, name='quiz'),
    path('attempt/<int:attempt_id>/result/', views.result_view, name='result'),
    path('history/', views.history_view, name='history'),
]
