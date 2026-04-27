from django.db import models
from django.conf import settings


class Badge(models.Model):
    slug        = models.CharField(max_length=50, unique=True)
    name        = models.CharField(max_length=100)
    icon        = models.CharField(max_length=10)
    description = models.TextField()
    sort_order  = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['sort_order']

    def __str__(self):
        return self.name


class UserBadge(models.Model):
    user      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='badges')
    badge     = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'badge')


class DailyQuest(models.Model):
    slug        = models.CharField(max_length=50, unique=True)
    title       = models.CharField(max_length=100)
    description = models.TextField()
    xp_reward   = models.PositiveSmallIntegerField()
    sort_order  = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['sort_order']

    def __str__(self):
        return self.title


class UserQuestCompletion(models.Model):
    user  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quest_completions')
    quest = models.ForeignKey(DailyQuest, on_delete=models.CASCADE)
    date  = models.DateField()

    class Meta:
        unique_together = ('user', 'quest', 'date')


class WeeklyStats(models.Model):
    user  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='weekly_stats')
    week  = models.CharField(max_length=10)   # "2026-W17"
    xp    = models.PositiveIntegerField(default=0)
    games = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('user', 'week')
