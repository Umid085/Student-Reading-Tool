import secrets
from django.db import models
from django.conf import settings


class Classroom(models.Model):
    name       = models.CharField(max_length=100)
    teacher    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='classrooms')
    join_code  = models.CharField(max_length=8, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.join_code:
            self.join_code = secrets.token_urlsafe(6)[:8].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ClassroomMembership(models.Model):
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='memberships')
    student   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='classroom_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('classroom', 'student')


class Assignment(models.Model):
    classroom  = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='assignments')
    story      = models.ForeignKey('reading.Story', null=True, blank=True, on_delete=models.SET_NULL)
    title      = models.CharField(max_length=200)
    due_date   = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
