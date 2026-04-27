from django.contrib import admin
from .models import Story, ReadingSession, FavoriteStory


@admin.register(Story)
class StoryAdmin(admin.ModelAdmin):
    list_display = ['title', 'cefr_level', 'topic', 'word_count', 'difficulty', 'unlock_order', 'is_library']
    list_filter = ['cefr_level', 'is_library']
    search_fields = ['title', 'topic']

admin.site.register(ReadingSession)
admin.site.register(FavoriteStory)
