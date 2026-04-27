from django.contrib import admin
from .models import Badge, UserBadge, DailyQuest, UserQuestCompletion, WeeklyStats

@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['slug', 'name', 'icon', 'sort_order']

@admin.register(DailyQuest)
class DailyQuestAdmin(admin.ModelAdmin):
    list_display = ['slug', 'title', 'xp_reward', 'sort_order']

admin.site.register(UserBadge)
admin.site.register(UserQuestCompletion)
admin.site.register(WeeklyStats)
