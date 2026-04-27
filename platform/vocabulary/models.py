from django.db import models
from django.conf import settings


class VocabWord(models.Model):
    STATUS_CHOICES = [('new', 'New'), ('reviewing', 'Reviewing'), ('known', 'Known')]
    CEFR_CHOICES   = [(l, l) for l in settings.CEFR_LEVELS]

    user         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vocab_words')
    word         = models.CharField(max_length=100)
    definition   = models.TextField(blank=True)
    phonetic     = models.CharField(max_length=100, blank=True)
    audio_url    = models.URLField(blank=True)
    example      = models.TextField(blank=True)
    cefr_level   = models.CharField(max_length=2, choices=CEFR_CHOICES, blank=True)
    topic        = models.CharField(max_length=100, blank=True)
    story        = models.ForeignKey('reading.Story', null=True, blank=True, on_delete=models.SET_NULL)
    saved_at     = models.DateTimeField(auto_now_add=True)
    status       = models.CharField(max_length=12, choices=STATUS_CHOICES, default='new')
    review_count = models.PositiveSmallIntegerField(default=0)

    class Meta:
        unique_together = ('user', 'word')
        ordering = ['-saved_at']

    def __str__(self):
        return f'{self.user.username} – {self.word}'
