from django.test import TestCase, Client
from django.urls import reverse
from .models import User


class RegistrationTests(TestCase):

    def test_register_creates_user(self):
        r = self.client.post(reverse('accounts:register'), {
            'username': 'newstudent',
            'password1': 'Str0ngP@ss!',
            'password2': 'Str0ngP@ss!',
        })
        self.assertTrue(User.objects.filter(username='newstudent').exists())

    def test_register_redirects_to_home(self):
        r = self.client.post(reverse('accounts:register'), {
            'username': 'student2',
            'password1': 'Str0ngP@ss!',
            'password2': 'Str0ngP@ss!',
        })
        self.assertRedirects(r, reverse('reading:home'))

    def test_register_teacher_flag(self):
        self.client.post(reverse('accounts:register'), {
            'username': 'myteacher',
            'password1': 'Str0ngP@ss!',
            'password2': 'Str0ngP@ss!',
            'is_teacher': 'on',
        })
        user = User.objects.get(username='myteacher')
        self.assertTrue(user.is_teacher)

    def test_duplicate_username_fails(self):
        User.objects.create_user(username='taken', password='pass')
        r = self.client.post(reverse('accounts:register'), {
            'username': 'taken',
            'password1': 'Str0ngP@ss!',
            'password2': 'Str0ngP@ss!',
        })
        self.assertEqual(r.status_code, 200)
        self.assertEqual(User.objects.filter(username='taken').count(), 1)


class LoginLogoutTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass1234')

    def test_login_correct_credentials(self):
        r = self.client.post(reverse('accounts:login'), {
            'username': 'tester',
            'password': 'pass1234',
        })
        self.assertRedirects(r, reverse('reading:home'))

    def test_login_wrong_password(self):
        r = self.client.post(reverse('accounts:login'), {
            'username': 'tester',
            'password': 'wrongpass',
        })
        self.assertEqual(r.status_code, 200)

    def test_logout_redirects(self):
        self.client.force_login(self.user)
        r = self.client.post(reverse('accounts:logout'))
        self.assertRedirects(r, reverse('accounts:login'))


class UserModelTests(TestCase):

    def test_default_values(self):
        user = User.objects.create_user(username='fresh', password='pass')
        self.assertEqual(user.xp, 0)
        self.assertEqual(user.level, 1)
        self.assertEqual(user.streak, 0)
        self.assertEqual(user.cefr_level, 'A1')
        self.assertEqual(user.avatar, '📚')
        self.assertFalse(user.is_teacher)

    def test_level_progress_at_zero_xp(self):
        user = User.objects.create_user(username='zero', password='pass')
        p = user.get_level_progress()
        self.assertEqual(p['pct'], 0)
        self.assertEqual(p['current_min'], 0)

    def test_level_progress_mid_level(self):
        user = User.objects.create_user(username='mid', password='pass')
        # Level 1: 0–1000. At 500 XP → 50%
        user.xp = 500
        user.save()
        p = user.get_level_progress()
        self.assertEqual(p['pct'], 50)
