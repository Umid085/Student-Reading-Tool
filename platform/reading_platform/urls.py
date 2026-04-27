from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', RedirectView.as_view(url='/reading/', permanent=False)),
    path('accounts/', include('accounts.urls')),
    path('reading/', include('reading.urls')),
    path('quiz/', include('quiz.urls')),
    path('vocabulary/', include('vocabulary.urls')),
    path('gamification/', include('gamification.urls')),
    path('social/', include('social.urls')),
    path('teacher/', include('teacher.urls')),
    path('ai/', include('ai.urls')),
]
