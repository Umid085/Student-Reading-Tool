import json
import random
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.contrib import messages
from .models import VocabWord
from .forms import VocabWordForm


@login_required
def notebook_view(request):
    status_filter = request.GET.get('status', '')
    words = VocabWord.objects.filter(user=request.user)
    if status_filter:
        words = words.filter(status=status_filter)
    words = words.order_by('-saved_at')
    return render(request, 'vocabulary/notebook.html', {
        'words': words,
        'status_filter': status_filter,
        'statuses': VocabWord.STATUS_CHOICES,
    })


@login_required
@require_POST
def add_word_view(request):
    form = VocabWordForm(request.POST)
    if form.is_valid():
        word = form.save(commit=False)
        word.user = request.user
        obj, created = VocabWord.objects.get_or_create(
            user=request.user, word=word.word,
            defaults={'definition': word.definition, 'example': word.example, 'status': 'new'}
        )
        if not created:
            messages.info(request, f'"{word.word}" is already in your notebook.')
        else:
            messages.success(request, f'"{word.word}" added to your notebook!')
    return redirect('vocabulary:notebook')


@login_required
@require_POST
def update_word_view(request, word_id):
    word = get_object_or_404(VocabWord, pk=word_id, user=request.user)
    new_status = request.POST.get('status')
    if new_status in dict(VocabWord.STATUS_CHOICES):
        word.status = new_status
        word.save(update_fields=['status'])
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'status': word.status})
    return redirect('vocabulary:notebook')


@login_required
@require_POST
def delete_word_view(request, word_id):
    word = get_object_or_404(VocabWord, pk=word_id, user=request.user)
    word.delete()
    messages.success(request, 'Word removed.')
    return redirect('vocabulary:notebook')


@login_required
def game_view(request):
    words = list(VocabWord.objects.filter(user=request.user).exclude(definition=''))
    if len(words) < 4:
        messages.warning(request, 'Add at least 4 words with definitions to play.')
        return redirect('vocabulary:notebook')
    random.shuffle(words)
    game_words = [{'id': w.id, 'word': w.word, 'definition': w.definition, 'example': w.example} for w in words[:20]]
    return render(request, 'vocabulary/game.html', {
        'game_words_json': json.dumps(game_words),
    })


@login_required
@require_POST
def game_check_view(request):
    data = json.loads(request.body)
    word_id = data.get('word_id')
    correct = data.get('correct', False)
    word = get_object_or_404(VocabWord, pk=word_id, user=request.user)
    if correct and word.status == 'new':
        word.status = 'reviewing'
        word.save(update_fields=['status'])
    elif correct and word.status == 'reviewing':
        word.status = 'known'
        word.save(update_fields=['status'])
    return JsonResponse({'status': word.status})
