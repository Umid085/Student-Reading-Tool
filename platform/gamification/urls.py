from django.urls import path
from . import views

app_name = 'gamification'

urlpatterns = [
    path('leaderboard/', views.leaderboard_view, name='leaderboard'),
    path('badges/', views.badges_view, name='badges'),
    path('quests/', views.quests_view, name='quests'),
    path('weekly/', views.weekly_view, name='weekly'),
]
