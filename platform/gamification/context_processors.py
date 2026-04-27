from django.utils import timezone
from .engine import get_daily_quests
from .models import UserQuestCompletion


def gamification_context(request):
    if not request.user.is_authenticated:
        return {}

    user = request.user
    today = timezone.localdate()
    date_str = today.isoformat()

    daily_quests = get_daily_quests(date_str)
    completed_slugs = set(
        UserQuestCompletion.objects.filter(user=user, date=today)
        .values_list('quest__slug', flat=True)
    )

    quests_with_status = [
        {'quest': q, 'done': q.slug in completed_slugs}
        for q in daily_quests
    ]

    progress = user.get_level_progress()

    return {
        'gam_user': user,
        'gam_xp': user.xp,
        'gam_level': user.level,
        'gam_streak': user.streak,
        'gam_quests': quests_with_status,
        'gam_xp_pct': progress['pct'],
        'gam_xp_current': progress['current_min'],
        'gam_xp_needed': progress['xp_needed'],
    }
