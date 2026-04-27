from django.db import models
from django.conf import settings


class Story(models.Model):
    CEFR_CHOICES = [(l, l) for l in settings.CEFR_LEVELS]

    title        = models.CharField(max_length=200)
    topic        = models.CharField(max_length=100)
    passage      = models.TextField()
    cefr_level   = models.CharField(max_length=2, choices=CEFR_CHOICES)
    word_count   = models.PositiveIntegerField(default=0)
    difficulty   = models.PositiveSmallIntegerField(default=3)  # 1–5 stars
    is_library   = models.BooleanField(default=True)
    created_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='authored_stories'
    )
    prompt       = models.TextField(blank=True, help_text='Discussion prompt for this story')
    unlock_order = models.PositiveSmallIntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['cefr_level', 'unlock_order']
        verbose_name_plural = 'stories'

    def save(self, *args, **kwargs):
        self.word_count = len(self.passage.split())
        super().save(*args, **kwargs)

    def __str__(self):
        return f'[{self.cefr_level}] {self.title}'

    def is_unlocked_for(self, user):
        from quiz.models import QuizAttempt
        if self.unlock_order == 0:
            if self.cefr_level == 'A1':
                return True
            level_order = settings.CEFR_LEVELS
            prev_level = level_order[level_order.index(self.cefr_level) - 1]
            return QuizAttempt.objects.filter(
                user=user, quiz__session__cefr_level=prev_level
            ).exists()
        games_at_level = QuizAttempt.objects.filter(
            user=user, quiz__session__cefr_level=self.cefr_level
        ).count()
        return games_at_level >= self.unlock_order


class ReadingSession(models.Model):
    user         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reading_sessions')
    story        = models.ForeignKey(Story, null=True, blank=True, on_delete=models.SET_NULL, related_name='sessions')
    passage_text = models.TextField()
    cefr_level   = models.CharField(max_length=2)
    topic        = models.CharField(max_length=100)
    is_daily     = models.BooleanField(default=False)
    started_at   = models.DateTimeField(auto_now_add=True)
    ended_at     = models.DateTimeField(null=True, blank=True)
    time_secs    = models.PositiveIntegerField(default=0)
    wpm          = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f'{self.user.username} – {self.topic} ({self.cefr_level})'


class FavoriteStory(models.Model):
    user     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    story    = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='favorited_by')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'story')


class ReadingProgress(models.Model):
    """Persists scroll progress so students can resume where they left off."""
    user     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reading_progress')
    session  = models.OneToOneField(ReadingSession, on_delete=models.CASCADE, related_name='progress')
    pct      = models.PositiveSmallIntegerField(default=0)  # 0–100
    updated  = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.username} – {self.pct}%'
