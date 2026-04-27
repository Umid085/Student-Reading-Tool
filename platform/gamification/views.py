from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.conf import settings
from .models import UserBadge, Badge, WeeklyStats, DailyQuest, UserQuestCompletion
from .engine import get_daily_quests
from accounts.models import User


@login_required
def leaderboard_view(request):
    level_filter = request.GET.get('level', '')
    from quiz.models import QuizAttempt
    from django.db.models import Sum

    if level_filter and level_filter in settings.CEFR_LEVELS:
        top_users = (
            User.objects.filter(quiz_attempts__quiz__session__cefr_level=level_filter)
            .annotate(level_xp=Sum('quiz_attempts__xp_earned'))
            .order_by('-level_xp')[:20]
        )
    else:
        top_users = User.objects.order_by('-xp')[:20]
        level_filter = ''

    return render(request, 'gamification/leaderboard.html', {
        'top_users': top_users,
        'active_level': level_filter,
        'levels': settings.CEFR_LEVELS,
    })


@login_required
def badges_view(request):
    all_badges = Badge.objects.all()
    earned_slugs = set(
        UserBadge.objects.filter(user=request.user).values_list('badge__slug', flat=True)
    )
    badges = [{'badge': b, 'earned': b.slug in earned_slugs} for b in all_badges]
    return render(request, 'gamification/badges.html', {'badges': badges})


@login_required
def quests_view(request):
    today = timezone.localdate()
    daily_quests = get_daily_quests(today.isoformat())
    completed_slugs = set(
        UserQuestCompletion.objects.filter(user=request.user, date=today)
        .values_list('quest__slug', flat=True)
    )
    quests = [{'quest': q, 'done': q.slug in completed_slugs} for q in daily_quests]
    return render(request, 'gamification/quests.html', {'quests': quests, 'today': today})


@login_required
def weekly_view(request):
    from datetime import date
    today = date.today()
    week_str = today.strftime('%G-W%V')

    weekly_entries = (
        WeeklyStats.objects.filter(week=week_str)
        .select_related('user')
        .order_by('-xp')[:20]
    )
    my_stats = WeeklyStats.objects.filter(user=request.user, week=week_str).first()
    return render(request, 'gamification/weekly.html', {
        'weekly_entries': weekly_entries,
        'my_stats': my_stats,
        'week_str': week_str,
    })
