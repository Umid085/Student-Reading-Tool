import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_POST
from .models import Story, ReadingSession, FavoriteStory
from ai.models import DailyChallenge


@login_required
def home_view(request):
    user = request.user
    from quiz.models import QuizAttempt
    recent_attempts = (
        QuizAttempt.objects.filter(user=user)
        .select_related('quiz__session__story')
        .order_by('-completed_at')[:5]
    )
    today = timezone.localdate()
    daily = DailyChallenge.objects.filter(date=today).first()
    daily_done = False
    if daily:
        daily_done = QuizAttempt.objects.filter(
            user=user, quiz__session__is_daily=True,
            completed_at__date=today
        ).exists()

    level_stories = Story.objects.filter(cefr_level=user.cefr_level, is_library=True)
    recommendations = [s for s in level_stories if s.is_unlocked_for(user)][:3]

    context = {
        'recent_attempts': recent_attempts,
        'daily': daily,
        'daily_done': daily_done,
        'recommendations': recommendations,
    }
    return render(request, 'reading/home.html', context)


@login_required
def library_view(request):
    from django.conf import settings
    from django.db.models import Q

    level_filter = request.GET.get('level', '')
    search_query = request.GET.get('q', '').strip()

    stories_by_level = {}
    for level in settings.CEFR_LEVELS:
        qs = Story.objects.filter(cefr_level=level, is_library=True)
        if search_query:
            qs = qs.filter(Q(title__icontains=search_query) | Q(topic__icontains=search_query))
        stories_by_level[level] = [
            {'story': s, 'unlocked': s.is_unlocked_for(request.user)}
            for s in qs
        ]

    fav_ids = set(FavoriteStory.objects.filter(user=request.user).values_list('story_id', flat=True))
    total_results = sum(len(v) for v in stories_by_level.values())
    return render(request, 'reading/library.html', {
        'stories_by_level': stories_by_level,
        'fav_ids': fav_ids,
        'active_level': level_filter,
        'search_query': search_query,
        'total_results': total_results,
    })


@login_required
def story_view(request, story_id):
    story = get_object_or_404(Story, pk=story_id, is_library=True)
    if not story.is_unlocked_for(request.user):
        messages.error(request, 'Complete more stories at the previous level first.')
        return redirect('reading:library')

    session = ReadingSession.objects.create(
        user=request.user,
        story=story,
        passage_text=story.passage,
        cefr_level=story.cefr_level,
        topic=story.topic,
    )
    return render(request, 'reading/reading.html', {'story': story, 'session': session})


@login_required
def generate_view(request):
    if request.method == 'POST':
        from ai.utils import generate_passage_and_quiz
        level = request.POST.get('level', request.user.cefr_level)
        topic = request.POST.get('topic', 'general')
        try:
            data = generate_passage_and_quiz(level, topic)
        except Exception as e:
            messages.error(request, f'AI generation failed: {e}')
            return redirect('reading:home')

        session = ReadingSession.objects.create(
            user=request.user,
            passage_text=data['passage'],
            cefr_level=level,
            topic=topic,
        )
        from quiz.models import Quiz
        Quiz.objects.create(session=session, questions=data['questions'])
        return redirect('reading:story_session', session_id=session.pk)

    from django.conf import settings
    return render(request, 'reading/generate.html', {'levels': settings.CEFR_LEVELS})


@login_required
@require_POST
def finish_reading_view(request, session_id):
    session = get_object_or_404(ReadingSession, pk=session_id, user=request.user)
    time_secs = int(request.POST.get('time_secs', 0))
    wpm = int(request.POST.get('wpm', 0))
    session.time_secs = time_secs
    session.wpm = wpm
    session.ended_at = timezone.now()
    session.save(update_fields=['time_secs', 'wpm', 'ended_at'])

    from quiz.models import Quiz
    quiz = Quiz.objects.filter(session=session).first()
    if quiz:
        return redirect('quiz:quiz', session_id=session.pk)
    return redirect('reading:home')


@login_required
def favorites_view(request):
    favs = FavoriteStory.objects.filter(user=request.user).select_related('story').order_by('-saved_at')
    return render(request, 'reading/favorites.html', {'favs': favs})


@login_required
@require_POST
def toggle_favorite_view(request, story_id):
    story = get_object_or_404(Story, pk=story_id)
    fav, created = FavoriteStory.objects.get_or_create(user=request.user, story=story)
    if not created:
        fav.delete()
        favorited = False
    else:
        favorited = True
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'favorited': favorited})
    return redirect(request.META.get('HTTP_REFERER', 'reading:library'))


@login_required
def session_view(request, session_id):
    session = get_object_or_404(ReadingSession, pk=session_id, user=request.user)
    return render(request, 'reading/reading.html', {'session': session, 'story': session.story})
