from django.contrib import admin
from .models import Quiz, QuizAttempt

admin.site.register(Quiz)

@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['user', 'pct', 'xp_earned', 'completed_at']
    list_filter = ['completed_at']
