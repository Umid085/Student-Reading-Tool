from django.urls import path
from . import views

app_name = 'reading'

urlpatterns = [
    path('', views.home_view, name='home'),
    path('library/', views.library_view, name='library'),
    path('story/<int:story_id>/', views.story_view, name='story'),
    path('session/<int:session_id>/', views.session_view, name='story_session'),
    path('generate/', views.generate_view, name='generate'),
    path('session/<int:session_id>/finish/', views.finish_reading_view, name='finish'),
    path('favorites/', views.favorites_view, name='favorites'),
    path('favorite/toggle/<int:story_id>/', views.toggle_favorite_view, name='toggle_favorite'),
]
