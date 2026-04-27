from django.db import models
from django.conf import settings


class Quiz(models.Model):
    session        = models.OneToOneField('reading.ReadingSession', on_delete=models.CASCADE, related_name='quiz')
    questions      = models.JSONField()
    question_types = models.JSONField(default=list)
    created_at     = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Quiz for {self.session}'


class QuizAttempt(models.Model):
    user         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz         = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    answers      = models.JSONField()
    score        = models.PositiveIntegerField()
    max_score    = models.PositiveIntegerField()
    pct          = models.PositiveSmallIntegerField()
    xp_earned    = models.PositiveIntegerField()
    time_bonus   = models.PositiveIntegerField(default=0)
    streak_bonus = models.PositiveIntegerField(default=0)
    quest_bonus  = models.PositiveIntegerField(default=0)
    quiz_secs    = models.PositiveIntegerField()
    wpm          = models.PositiveIntegerField(default=0)
    type_stats   = models.JSONField(default=dict)
    completed_at = models.DateTimeField(auto_now_add=True)

    @property
    def stars(self):
        if self.pct >= 90: return 5
        if self.pct >= 75: return 4
        if self.pct >= 60: return 3
        if self.pct >= 40: return 2
        return 1

    def __str__(self):
        return f'{self.user.username} – {self.pct}% ({self.quiz})'
