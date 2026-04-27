from django.contrib import admin
from .models import VocabWord

@admin.register(VocabWord)
class VocabWordAdmin(admin.ModelAdmin):
    list_display = ['user', 'word', 'status', 'saved_at']
    list_filter = ['status', 'cefr_level']
    search_fields = ['word', 'user__username']
