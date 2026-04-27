import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.contrib import messages
from django.conf import settings
from django.utils import timezone
from django.db.models import F
from .models import Quiz, QuizAttempt
from reading.models import ReadingSession


def _score_question(q, answer):
    """Server-side scoring matching the React logic."""
    qtype = q.get('type')
    correct = q.get('correct')

    if qtype == 'mcq':
        return (1, 1) if answer == correct else (0, 1)

    if qtype in ('gap_word', 'gap_sentence', 'open'):
        user_a = str(answer).strip().lower()
        corr_a = str(correct).strip().lower()
        return (1, 1) if user_a == corr_a else (0, 1)

    if qtype == 'matching':
        pairs = q.get('pairs', [])
        if not pairs:
            return (0, 0)
        correct_map = {p['left']: p['right'] for p in pairs}
        got = sum(1 for left, right in (answer or {}).items() if correct_map.get(left) == right)
        return (got, len(pairs))

    if qtype == 'headings':
        sections = q.get('sections', [])
        if not sections:
            return (0, 0)
        got = sum(1 for s in sections if (answer or {}).get(s['id']) == s['heading'])
        return (got, len(sections))

    return (0, 1)


@login_required
def quiz_view(request, session_id):
    session = get_object_or_404(ReadingSession, pk=session_id, user=request.user)
    quiz = get_object_or_404(Quiz, session=session)

    if QuizAttempt.objects.filter(user=request.user, quiz=quiz).exists():
        attempt = QuizAttempt.objects.filter(user=request.user, quiz=quiz).first()
        return redirect('quiz:result', attempt_id=attempt.pk)

    if request.method == 'POST':
        answers_raw = request.POST.get('answers', '{}')
        quiz_secs = int(request.POST.get('quiz_secs', 0))
        try:
            answers = json.loads(answers_raw)
        except json.JSONDecodeError:
            answers = {}

        total_score = 0
        total_max = 0
        type_stats = {}
        consecutive = 0
        max_consecutive = 0

        for i, q in enumerate(quiz.questions):
            answer = answers.get(str(i))
            got, max_pts = _score_question(q, answer)
            total_score += got
            total_max += max_pts
            qtype = q.get('type', 'unknown')
            if qtype not in type_stats:
                type_stats[qtype] = {'score': 0, 'max': 0}
            type_stats[qtype]['score'] += got
            type_stats[qtype]['max'] += max_pts
            if got == max_pts and max_pts > 0:
                consecutive += 1
                max_consecutive = max(max_consecutive, consecutive)
            else:
                consecutive = 0

        pct = int(total_score / total_max * 100) if total_max else 0

        from gamification.engine import calculate_xp, update_streak, check_and_award_badges, check_quests, update_weekly_stats
        from gamification.models import DailyQuest
        from django.db.models import Sum, Count
        from quiz.models import QuizAttempt as QA
        from vocabulary.models import VocabWord

        base_xp, time_bonus, streak_bonus, total_xp = calculate_xp(
            total_score, total_max, session.cefr_level, session.time_secs, max_consecutive
        )

        today_attempts = QA.objects.filter(user=request.user, completed_at__date=timezone.localdate()).count()
        vocab_count = VocabWord.objects.filter(user=request.user).count()

        new_streak = update_streak(request.user)
        new_badges = check_and_award_badges(request.user)
        new_quests = check_quests(
            request.user, timezone.localdate(), today_attempts + 1,
            vocab_count, daily_done=session.is_daily
        )
        quest_bonus = sum(q.xp_reward for q in new_quests)
        total_xp += quest_bonus

        request.user.xp = F('xp') + total_xp
        request.user.save(update_fields=['xp'])
        request.user.refresh_from_db()
        from gamification.engine import get_user_level
        new_level = get_user_level(request.user.xp)
        if new_level != request.user.level:
            request.user.level = new_level
            request.user.save(update_fields=['level'])

        update_weekly_stats(request.user, total_xp)

        attempt = QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            answers=answers,
            score=total_score,
            max_score=total_max,
            pct=pct,
            xp_earned=total_xp,
            time_bonus=time_bonus,
            streak_bonus=streak_bonus,
            quest_bonus=quest_bonus,
            quiz_secs=quiz_secs,
            wpm=session.wpm,
            type_stats=type_stats,
        )

        request.session['new_badges'] = [b.name for b in new_badges]
        request.session['new_quests'] = [q.title for q in new_quests]
        return redirect('quiz:result', attempt_id=attempt.pk)

    time_limit = settings.LEVEL_TIME_LIMITS.get(session.cefr_level, 180)
    return render(request, 'quiz/quiz.html', {
        'session': session,
        'quiz': quiz,
        'questions_json': json.dumps(quiz.questions),
        'time_limit': time_limit,
    })


@login_required
def result_view(request, attempt_id):
    attempt = get_object_or_404(QuizAttempt, pk=attempt_id, user=request.user)
    new_badges = request.session.pop('new_badges', [])
    new_quests = request.session.pop('new_quests', [])
    return render(request, 'quiz/result.html', {
        'attempt': attempt,
        'new_badges': new_badges,
        'new_quests': new_quests,
    })


@login_required
def history_view(request):
    attempts = (
        QuizAttempt.objects.filter(user=request.user)
        .select_related('quiz__session__story')
        .order_by('-completed_at')[:50]
    )
    return render(request, 'quiz/history.html', {'attempts': attempts})
