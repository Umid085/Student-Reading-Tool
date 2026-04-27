from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.contrib import messages
from django.db.models import Avg, Count, Sum
from .models import Classroom, ClassroomMembership, Assignment
from reading.models import Story
from accounts.models import User


def teacher_required(view_func):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            from django.contrib.auth.views import redirect_to_login
            return redirect_to_login(request.get_full_path())
        if not request.user.is_teacher:
            messages.error(request, 'Teacher access required.')
            return redirect('reading:home')
        return view_func(request, *args, **kwargs)
    return wrapper


@teacher_required
def dashboard_view(request):
    classrooms = Classroom.objects.filter(teacher=request.user).annotate(
        student_count=Count('memberships')
    )
    return render(request, 'teacher/dashboard.html', {'classrooms': classrooms})


@teacher_required
@require_POST
def create_classroom_view(request):
    name = request.POST.get('name', '').strip()
    if not name:
        messages.error(request, 'Classroom name is required.')
        return redirect('teacher:dashboard')
    Classroom.objects.create(teacher=request.user, name=name)
    messages.success(request, f'Classroom "{name}" created!')
    return redirect('teacher:dashboard')


@teacher_required
def classroom_view(request, pk):
    classroom = get_object_or_404(Classroom, pk=pk, teacher=request.user)
    memberships = ClassroomMembership.objects.filter(classroom=classroom).select_related('student')
    assignments = Assignment.objects.filter(classroom=classroom).select_related('story')
    stories = Story.objects.filter(is_library=True)
    return render(request, 'teacher/classroom.html', {
        'classroom': classroom,
        'memberships': memberships,
        'assignments': assignments,
        'stories': stories,
    })


@teacher_required
@require_POST
def assign_story_view(request, pk):
    classroom = get_object_or_404(Classroom, pk=pk, teacher=request.user)
    story_id = request.POST.get('story_id')
    due_date = request.POST.get('due_date') or None
    story = get_object_or_404(Story, pk=story_id)
    Assignment.objects.get_or_create(classroom=classroom, story=story, defaults={'due_date': due_date, 'title': story.title})
    messages.success(request, f'"{story.title}" assigned.')
    return redirect('teacher:classroom', pk=pk)


@teacher_required
def classroom_analytics_view(request, pk):
    classroom = get_object_or_404(Classroom, pk=pk, teacher=request.user)
    students = User.objects.filter(
        classroom_memberships__classroom=classroom
    )
    from quiz.models import QuizAttempt
    analytics = []
    for student in students:
        attempts = QuizAttempt.objects.filter(user=student)
        agg = attempts.aggregate(
            games=Count('id'),
            avg_pct=Avg('pct'),
            total_xp=Sum('xp_earned'),
        )
        analytics.append({'student': student, **agg})

    return render(request, 'teacher/analytics.html', {
        'classroom': classroom,
        'analytics': analytics,
    })


@login_required
@require_POST
def join_classroom_view(request):
    code = request.POST.get('code', '').strip()
    try:
        classroom = Classroom.objects.get(join_code=code)
    except Classroom.DoesNotExist:
        messages.error(request, 'Invalid join code.')
        return redirect('reading:home')
    _, created = ClassroomMembership.objects.get_or_create(
        classroom=classroom, student=request.user
    )
    if created:
        messages.success(request, f'Joined "{classroom.name}"!')
    else:
        messages.info(request, f'You are already in "{classroom.name}".')
    return redirect('reading:home')
