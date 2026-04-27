from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'cefr_level', 'xp', 'level', 'streak', 'is_teacher']
    list_filter = ['cefr_level', 'is_teacher', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Reading Profile', {'fields': ('cefr_level', 'xp', 'level', 'streak', 'longest_streak', 'last_active', 'is_teacher', 'avatar', 'bio')}),
    )
