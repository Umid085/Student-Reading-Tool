from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum, Count, Avg
from .forms import RegisterForm, LoginForm, ProfileForm
from .models import User


def register_view(request):
    if request.user.is_authenticated:
        return redirect('reading:home')
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f'Welcome, {user.username}! Your journey begins.')
            return redirect('reading:home')
    else:
        form = RegisterForm()
    return render(request, 'accounts/register.html', {'form': form})


def login_view(request):
    if request.user.is_authenticated:
        return redirect('reading:home')
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect(request.GET.get('next', 'reading:home'))
        messages.error(request, 'Invalid username or password.')
    else:
        form = LoginForm()
    return render(request, 'accounts/login.html', {'form': form})


def logout_view(request):
    logout(request)
    return redirect('accounts:login')


@login_required
def profile_view(request, username=None):
    if username:
        profile_user = get_object_or_404(User, username=username)
    else:
        profile_user = request.user

    from quiz.models import QuizAttempt
    attempts = QuizAttempt.objects.filter(user=profile_user).select_related('quiz__session')
    stats = attempts.aggregate(
        total_games=Count('id'),
        total_xp=Sum('xp_earned'),
        avg_pct=Avg('pct'),
    )
    recent = attempts.order_by('-completed_at')[:10]
    from gamification.models import UserBadge
    badges = UserBadge.objects.filter(user=profile_user).select_related('badge').order_by('-earned_at')

    context = {
        'profile_user': profile_user,
        'stats': stats,
        'recent_attempts': recent,
        'badges': badges,
        'is_own_profile': profile_user == request.user,
        'level_progress': profile_user.get_level_progress(),
    }
    return render(request, 'accounts/profile.html', context)


@login_required
def edit_profile_view(request):
    if request.method == 'POST':
        form = ProfileForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile updated!')
            return redirect('accounts:profile')
    else:
        form = ProfileForm(instance=request.user)
    return render(request, 'accounts/edit_profile.html', {'form': form})
