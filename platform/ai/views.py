from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from .models import DailyChallenge
from .utils import generate_passage_and_quiz
from reading.models import ReadingSession
from quiz.models import Quiz


@login_required
def daily_challenge_view(request):
    today = timezone.localdate()
    challenge = DailyChallenge.objects.filter(date=today).first()
    if not challenge:
        messages.info(request, 'No daily challenge today — check back tomorrow!')
        return redirect('reading:home')

    already_done = Quiz.objects.filter(
        session__user=request.user,
        session__is_daily=True,
        session__started_at__date=today,
    ).exists()

    if request.method == 'POST' and not already_done:
        session = ReadingSession.objects.create(
            user=request.user,
            passage_text=challenge.passage,
            cefr_level=challenge.cefr_level,
            topic='Daily Challenge',
            is_daily=True,
        )
        Quiz.objects.create(session=session, questions=challenge.questions)
        return redirect('quiz:quiz', session_id=session.pk)

    return render(request, 'ai/daily.html', {
        'challenge': challenge,
        'already_done': already_done,
    })


@login_required
def generate_passage_view(request):
    if request.method == 'POST':
        from django.conf import settings
        level = request.POST.get('level', request.user.cefr_level)
        topic = request.POST.get('topic', 'general knowledge').strip() or 'general knowledge'
        if level not in settings.CEFR_LEVELS:
            level = request.user.cefr_level
        try:
            data = generate_passage_and_quiz(level, topic)
        except Exception as e:
            messages.error(request, f'Generation failed: {e}')
            return redirect('reading:home')

        session = ReadingSession.objects.create(
            user=request.user,
            passage_text=data['passage'],
            cefr_level=level,
            topic=topic,
        )
        Quiz.objects.create(session=session, questions=data['questions'])
        return redirect('reading:story_session', session_id=session.pk)

    from django.conf import settings
    return render(request, 'ai/generate.html', {'levels': settings.CEFR_LEVELS})
