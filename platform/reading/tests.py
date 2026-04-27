from django.test import TestCase, Client
from django.urls import reverse
from accounts.models import User
from .models import Story, ReadingSession, FavoriteStory
from django.conf import settings


def make_user(username='testuser', password='testpass123', **kwargs):
    return User.objects.create_user(username=username, password=password, **kwargs)


def make_story(**kwargs):
    defaults = {
        'title': 'Test Story',
        'topic': 'Testing',
        'passage': 'This is a test passage. It has two sentences.',
        'cefr_level': 'A1',
        'difficulty': 1,
        'is_library': True,
        'unlock_order': 0,
    }
    defaults.update(kwargs)
    return Story.objects.create(**defaults)


class StoryUnlockTests(TestCase):

    def setUp(self):
        self.user = make_user()

    def test_first_a1_story_always_unlocked(self):
        story = make_story(cefr_level='A1', unlock_order=0)
        self.assertTrue(story.is_unlocked_for(self.user))

    def test_second_a1_story_locked_without_attempts(self):
        story = make_story(cefr_level='A1', unlock_order=1)
        self.assertFalse(story.is_unlocked_for(self.user))

    def test_second_a1_story_unlocked_after_one_attempt(self):
        from quiz.models import Quiz, QuizAttempt
        story0 = make_story(cefr_level='A1', unlock_order=0, title='First')
        story1 = make_story(cefr_level='A1', unlock_order=1, title='Second')
        session = ReadingSession.objects.create(
            user=self.user, story=story0,
            passage_text=story0.passage, cefr_level='A1', topic='test'
        )
        quiz = Quiz.objects.create(session=session, questions=[])
        QuizAttempt.objects.create(
            user=self.user, quiz=quiz, answers={},
            score=5, max_score=6, pct=83, xp_earned=100,
            quiz_secs=60, type_stats={}
        )
        self.assertTrue(story1.is_unlocked_for(self.user))

    def test_a2_story_locked_without_a1_attempt(self):
        story = make_story(cefr_level='A2', unlock_order=0)
        self.assertFalse(story.is_unlocked_for(self.user))

    def test_word_count_auto_set_on_save(self):
        story = make_story(passage='one two three four five')
        self.assertEqual(story.word_count, 5)


class StoryWordCountTests(TestCase):

    def test_word_count_updates_on_resave(self):
        story = make_story(passage='hello world')
        self.assertEqual(story.word_count, 2)
        story.passage = 'one two three'
        story.save()
        self.assertEqual(story.word_count, 3)


class LibraryViewTests(TestCase):

    def setUp(self):
        self.client = Client()
        self.user = make_user()
        self.client.force_login(self.user)
        make_story(title='Alpha', topic='animals', cefr_level='A1')
        make_story(title='Beta', topic='science', cefr_level='B1')

    def test_library_returns_200(self):
        r = self.client.get(reverse('reading:library'))
        self.assertEqual(r.status_code, 200)

    def test_search_by_title(self):
        r = self.client.get(reverse('reading:library') + '?q=Alpha')
        self.assertContains(r, 'Alpha')
        self.assertEqual(r.context['total_results'], 1)

    def test_search_by_topic(self):
        r = self.client.get(reverse('reading:library') + '?q=science')
        self.assertContains(r, 'Beta')
        self.assertEqual(r.context['total_results'], 1)

    def test_search_no_results(self):
        r = self.client.get(reverse('reading:library') + '?q=zzznomatch')
        self.assertEqual(r.context['total_results'], 0)

    def test_library_redirects_unauthenticated(self):
        self.client.logout()
        r = self.client.get(reverse('reading:library'))
        self.assertEqual(r.status_code, 302)
        self.assertIn('/accounts/login/', r['Location'])

    def test_toggle_favorite(self):
        story = make_story(title='Fav Story')
        r = self.client.post(reverse('reading:toggle_favorite', args=[story.pk]))
        self.assertTrue(FavoriteStory.objects.filter(user=self.user, story=story).exists())
        # Toggle off
        self.client.post(reverse('reading:toggle_favorite', args=[story.pk]))
        self.assertFalse(FavoriteStory.objects.filter(user=self.user, story=story).exists())
