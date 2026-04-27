from django.urls import path
from . import views

app_name = 'vocabulary'

urlpatterns = [
    path('', views.notebook_view, name='notebook'),
    path('add/', views.add_word_view, name='add_word'),
    path('update/<int:word_id>/', views.update_word_view, name='update_word'),
    path('delete/<int:word_id>/', views.delete_word_view, name='delete_word'),
    path('game/', views.game_view, name='game'),
    path('game/check/', views.game_check_view, name='game_check'),
]
