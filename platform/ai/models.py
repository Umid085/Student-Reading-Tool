from django.db import models


class DailyChallenge(models.Model):
    date       = models.DateField(unique=True)
    cefr_level = models.CharField(max_length=2, default='B1')
    topic      = models.CharField(max_length=100)
    passage    = models.TextField()
    questions  = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Daily {self.date} – {self.topic}'
