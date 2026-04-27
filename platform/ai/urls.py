from django.urls import path
from . import views

app_name = 'ai'

urlpatterns = [
    path('daily/', views.daily_challenge_view, name='daily'),
    path('generate/', views.generate_passage_view, name='generate'),
]
