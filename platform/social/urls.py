from django.urls import path
from . import views

app_name = 'social'

urlpatterns = [
    path('friends/', views.friends_view, name='friends'),
    path('friends/request/<int:user_id>/', views.send_request_view, name='send_request'),
    path('friends/respond/<int:friendship_id>/<str:action>/', views.respond_request_view, name='respond_request'),
    path('challenges/', views.challenges_view, name='challenges'),
    path('challenge/send/<int:user_id>/', views.send_challenge_view, name='send_challenge'),
    path('discuss/<int:story_id>/', views.discussion_view, name='discussion'),
    path('discuss/<int:story_id>/post/', views.post_discussion_view, name='post_discussion'),
]
