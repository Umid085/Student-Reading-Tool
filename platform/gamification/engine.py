"""
Central gamification logic: XP, levels, streaks, badges, quests.
All functions are pure/stateless — callers handle DB writes.
"""
import datetime
from django.conf import settings
from django.utils import timezone


# ── XP & Levels ──────────────────────────────────────────────────────────────

def calculate_xp(score, max_score, cefr_level, time_secs, consecutive_streak=0):
    """Return (base_xp, time_bonus, streak_bonus, total_xp)."""
    mult       = settings.LEVEL_MULTIPLIERS.get(cefr_level, 1.0)
    time_limit = settings.LEVEL_TIME_LIMITS.get(cefr_level, 180)
    time_bonus_max = settings.LEVEL_TIME_BONUSES.get(cefr_level, 200)

    base_xp    = int(score * mult * 100)
    time_bonus = int(time_bonus_max * max(0, (time_limit - time_secs) / time_limit))
    streak_bonus = 50 if consecutive_streak >= 3 else 0
    return base_xp, time_bonus, streak_bonus, base_xp + time_bonus + streak_bonus


def get_user_level(xp):
    thresholds = settings.XP_THRESHOLDS
    for i in range(len(thresholds) - 1, -1, -1):
        if xp >= thresholds[i]:
            return i + 1
    return 1


def update_streak(user):
    """Recalculate and persist streak. Returns new streak value."""
    today = timezone.localdate()
    if user.last_active is None:
        user.streak = 1
    elif user.last_active == today:
        return user.streak  # already counted today
    elif user.last_active == today - datetime.timedelta(days=1):
        user.streak += 1
    else:
        user.streak = 1
    user.longest_streak = max(user.longest_streak, user.streak)
    user.last_active = today
    user.save(update_fields=['streak', 'longest_streak', 'last_active'])
    return user.streak


# ── Badges ───────────────────────────────────────────────────────────────────

BADGE_CHECKS = {
    'first_steps':    lambda ctx: ctx['games'] >= 1,
    'story_starter':  lambda ctx: ctx['games'] >= 5,
    'reader':         lambda ctx: ctx['games'] >= 10,
    'explorer':       lambda ctx: ctx['games'] >= 25,
    'bookworm':       lambda ctx: ctx['games'] >= 50,
    'quiz_master':    lambda ctx: ctx['perfect_games'] >= 1,
    'speed_reader':   lambda ctx: ctx['fast_games'] >= 1,
    'vocab_builder':  lambda ctx: ctx['vocab_count'] >= 10,
    'word_collector': lambda ctx: ctx['vocab_count'] >= 50,
    'on_fire':        lambda ctx: ctx['streak'] >= 3,
    'week_warrior':   lambda ctx: ctx['streak'] >= 7,
    'daily_champ':    lambda ctx: ctx['daily_games'] >= 1,
    'high_scorer':    lambda ctx: ctx['max_xp_single'] >= 500,
    'level_5':        lambda ctx: ctx['user_level'] >= 5,
}


def build_badge_context(user):
    from quiz.models import QuizAttempt
    from django.conf import settings

    attempts = QuizAttempt.objects.filter(user=user)
    return {
        'games':          attempts.count(),
        'perfect_games':  attempts.filter(pct=100).count(),
        'fast_games':     sum(
            1 for a in attempts.select_related('quiz__session')
            if a.quiz_secs < settings.LEVEL_TIME_LIMITS.get(a.quiz.session.cefr_level, 180) / 2
        ),
        'vocab_count':    user.vocab_words.count(),
        'streak':         user.streak,
        'daily_games':    attempts.filter(quiz__session__is_daily=True).count(),
        'max_xp_single':  attempts.order_by('-xp_earned').values_list('xp_earned', flat=True).first() or 0,
        'user_level':     user.level,
    }


def check_and_award_badges(user):
    """Award any newly earned badges. Returns list of new Badge objects."""
    from .models import Badge, UserBadge

    ctx = build_badge_context(user)
    earned_slugs = set(UserBadge.objects.filter(user=user).values_list('badge__slug', flat=True))
    new_badges = []

    for slug, check in BADGE_CHECKS.items():
        if slug not in earned_slugs and check(ctx):
            try:
                badge = Badge.objects.get(slug=slug)
                UserBadge.objects.create(user=user, badge=badge)
                new_badges.append(badge)
            except Badge.DoesNotExist:
                pass

    return new_badges


# ── Daily Quests ─────────────────────────────────────────────────────────────

def get_daily_quests(date_str):
    """Return 3 DailyQuest objects deterministically from date string."""
    from .models import DailyQuest
    quests = list(DailyQuest.objects.order_by('sort_order'))
    if not quests:
        return []
    seed = 0
    for ch in date_str:
        seed = seed * 31 + ord(ch)
    seed = abs(seed)
    n, picked = len(quests), []
    while len(picked) < min(3, n):
        idx = seed % n
        if idx not in picked:
            picked.append(idx)
        seed = abs(int(seed / n + seed * 7 + 13)) % 99991
    return [quests[i] for i in picked]


def check_quests(user, date, today_attempts, vocab_count, daily_done=False):
    """Return list of quest slugs newly completed."""
    from .models import DailyQuest, UserQuestCompletion

    quests = get_daily_quests(str(date))
    already_done = set(
        UserQuestCompletion.objects.filter(user=user, date=date)
        .values_list('quest__slug', flat=True)
    )
    newly_done = []
    for quest in quests:
        if quest.slug in already_done:
            continue
        if _quest_met(quest.slug, today_attempts, vocab_count, daily_done, user.streak):
            UserQuestCompletion.objects.get_or_create(user=user, quest=quest, date=date)
            newly_done.append(quest)
    return newly_done


def _quest_met(slug, attempts, vocab_count, daily_done, streak):
    if slug == 'play_story':     return len(attempts) >= 1
    if slug == 'score_80':       return any(a.pct >= 80 for a in attempts)
    if slug == 'save_words':     return vocab_count >= 3
    if slug == 'daily_challenge': return daily_done
    if slug == 'score_perfect':  return any(a.pct == 100 for a in attempts)
    if slug == 'play_b1plus':
        return any(a.quiz.session.cefr_level in ['B1','B2','C1','C2'] for a in attempts)
    if slug == 'fast_finish':    return any(a.quiz_secs < 120 for a in attempts)
    if slug == 'streak_day':     return streak >= 1
    return False


# ── Weekly stats ──────────────────────────────────────────────────────────────

def get_week_id(date=None):
    if date is None:
        date = timezone.localdate()
    year, week, _ = date.isocalendar()
    return f'{year}-W{week:02d}'


def update_weekly_stats(user, xp_earned):
    from .models import WeeklyStats
    week = get_week_id()
    obj, _ = WeeklyStats.objects.get_or_create(user=user, week=week)
    obj.xp    += xp_earned
    obj.games += 1
    obj.save(update_fields=['xp', 'games'])
    return obj
