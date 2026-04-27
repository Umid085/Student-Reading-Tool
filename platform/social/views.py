from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.contrib import messages
from django.utils import timezone
from .models import Friendship, Challenge, Discussion
from accounts.models import User


@login_required
def friends_view(request):
    user = request.user
    accepted_qs = Friendship.objects.filter(status='accepted')
    accepted_as_req = accepted_qs.filter(from_user=user).values_list('to_user_id', flat=True)
    accepted_as_rec = accepted_qs.filter(to_user=user).values_list('from_user_id', flat=True)
    friend_ids = list(accepted_as_req) + list(accepted_as_rec)
    friends = User.objects.filter(pk__in=friend_ids)

    incoming = Friendship.objects.filter(to_user=user, status='pending').select_related('from_user')
    outgoing = Friendship.objects.filter(from_user=user, status='pending').select_related('to_user')

    query = request.GET.get('q', '')
    search_results = []
    if query:
        search_results = User.objects.filter(username__icontains=query).exclude(pk=user.pk)[:10]

    return render(request, 'social/friends.html', {
        'friends': friends,
        'incoming': incoming,
        'outgoing': outgoing,
        'search_results': search_results,
        'query': query,
    })


@login_required
@require_POST
def send_request_view(request, user_id):
    target = get_object_or_404(User, pk=user_id)
    if target == request.user:
        messages.error(request, 'You cannot friend yourself.')
        return redirect('social:friends')
    _, created = Friendship.objects.get_or_create(from_user=request.user, to_user=target)
    if created:
        messages.success(request, f'Friend request sent to {target.username}.')
    else:
        messages.info(request, 'Request already sent.')
    return redirect('social:friends')


@login_required
@require_POST
def respond_request_view(request, friendship_id, action):
    friendship = get_object_or_404(Friendship, pk=friendship_id, to_user=request.user)
    if action == 'accept':
        friendship.status = 'accepted'
        friendship.save(update_fields=['status'])
        messages.success(request, f'You are now friends with {friendship.from_user.username}!')
    elif action == 'decline':
        friendship.status = 'declined'
        friendship.save(update_fields=['status'])
    return redirect('social:friends')


@login_required
def challenges_view(request):
    user = request.user
    received = Challenge.objects.filter(to_user=user).select_related('from_user')
    sent = Challenge.objects.filter(from_user=user).select_related('to_user')
    return render(request, 'social/challenges.html', {
        'received': received,
        'sent': sent,
    })


@login_required
@require_POST
def send_challenge_view(request, user_id):
    target = get_object_or_404(User, pk=user_id)
    level = request.POST.get('level', request.user.cefr_level)
    Challenge.objects.create(from_user=request.user, to_user=target, cefr_level=level)
    messages.success(request, f'Challenge sent to {target.username}!')
    return redirect('social:challenges')


@login_required
def discussion_view(request, story_id):
    from reading.models import Story
    story = get_object_or_404(Story, pk=story_id)
    posts = Discussion.objects.filter(story=story).select_related('user').order_by('created_at')
    today = timezone.localdate()
    already_posted = Discussion.objects.filter(
        story=story, user=request.user, created_at__date=today
    ).exists()
    return render(request, 'social/discussion.html', {
        'story': story,
        'posts': posts,
        'already_posted': already_posted,
    })


@login_required
@require_POST
def post_discussion_view(request, story_id):
    from reading.models import Story
    story = get_object_or_404(Story, pk=story_id)
    today = timezone.localdate()
    if Discussion.objects.filter(story=story, user=request.user, created_at__date=today).exists():
        messages.error(request, 'You can only post once per day per story.')
        return redirect('social:discussion', story_id=story_id)
    content = request.POST.get('content', '').strip()
    if len(content) < 5:
        messages.error(request, 'Post is too short.')
        return redirect('social:discussion', story_id=story_id)
    Discussion.objects.create(story=story, user=request.user, text=content[:500])
    return redirect('social:discussion', story_id=story_id)
