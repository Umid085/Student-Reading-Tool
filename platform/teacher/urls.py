from django.urls import path
from . import views

app_name = 'teacher'

urlpatterns = [
    path('', views.dashboard_view, name='dashboard'),
    path('classroom/create/', views.create_classroom_view, name='create_classroom'),
    path('classroom/<int:pk>/', views.classroom_view, name='classroom'),
    path('classroom/<int:pk>/assign/', views.assign_story_view, name='assign_story'),
    path('classroom/<int:pk>/analytics/', views.classroom_analytics_view, name='analytics'),
    path('join/', views.join_classroom_view, name='join_classroom'),
]
