from django.db import models
from django.conf import settings


class Friendship(models.Model):
    STATUS = [('pending', 'Pending'), ('accepted', 'Accepted'), ('declined', 'Declined')]
    from_user  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_friend_requests')
    to_user    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_friend_requests')
    status     = models.CharField(max_length=10, choices=STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        return f'{self.from_user} → {self.to_user} ({self.status})'


class Challenge(models.Model):
    STATUS = [('pending', 'Pending'), ('accepted', 'Accepted'), ('declined', 'Declined')]
    from_user      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_challenges')
    to_user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_challenges')
    cefr_level     = models.CharField(max_length=2)
    question_types = models.JSONField(default=list)
    status         = models.CharField(max_length=10, choices=STATUS, default='pending')
    created_at     = models.DateTimeField(auto_now_add=True)


class Discussion(models.Model):
    story      = models.ForeignKey('reading.Story', on_delete=models.CASCADE, related_name='discussions')
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='discussions')
    text       = models.TextField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} on {self.story.title}'
