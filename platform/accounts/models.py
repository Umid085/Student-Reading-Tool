from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):
    CEFR_CHOICES = [(l, l) for l in ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']]
    AVATAR_CHOICES = ['📚', '🦉', '🌟', '🎯', '🔥', '💎', '🚀', '🌈']

    cefr_level     = models.CharField(max_length=2, choices=CEFR_CHOICES, default='A1')
    xp             = models.PositiveIntegerField(default=0)
    level          = models.PositiveIntegerField(default=1)
    streak         = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_active    = models.DateField(null=True, blank=True)
    is_teacher     = models.BooleanField(default=False)
    avatar         = models.CharField(max_length=10, default='📚')
    bio            = models.TextField(blank=True, max_length=300)

    def get_level_progress(self):
        thresholds = settings.XP_THRESHOLDS
        lvl = self.level - 1
        current_min = thresholds[lvl] if lvl < len(thresholds) else thresholds[-1]
        next_min = thresholds[lvl + 1] if lvl + 1 < len(thresholds) else current_min
        if next_min == current_min:
            return {'pct': 100, 'xp_needed': 0, 'current_min': current_min, 'next_min': next_min}
        pct = int((self.xp - current_min) / (next_min - current_min) * 100)
        return {
            'pct': min(100, max(0, pct)),
            'xp_needed': next_min - self.xp,
            'current_min': current_min,
            'next_min': next_min,
        }

    def __str__(self):
        return self.username
