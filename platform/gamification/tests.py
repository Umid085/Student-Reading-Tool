from django.test import TestCase
from django.conf import settings
from .engine import calculate_xp, get_user_level, update_streak
import datetime


class XPCalculationTests(TestCase):

    def test_base_xp_scales_with_score(self):
        # Score 6/6 at A1 (mult=1.0) → base = 600
        # Finish in 60s on 150s limit → time_bonus = 200*(150-60)/150 = 120
        base, time_bonus, _, total = calculate_xp(6, 6, 'A1', 60)
        self.assertEqual(base, 600)
        self.assertEqual(time_bonus, 120)
        self.assertEqual(total, 720)

    def test_level_multiplier_applied(self):
        base, _, _, _ = calculate_xp(6, 6, 'C2', 60)
        self.assertEqual(base, 2400)       # 6 * 4.0 * 100

    def test_time_bonus_when_fast(self):
        # A1 time limit = 150s. Finish in 0s → full bonus (200)
        _, time_bonus, _, _ = calculate_xp(6, 6, 'A1', 0)
        self.assertEqual(time_bonus, 200)

    def test_no_time_bonus_when_at_limit(self):
        _, time_bonus, _, _ = calculate_xp(6, 6, 'A1', 150)
        self.assertEqual(time_bonus, 0)

    def test_no_time_bonus_when_over_limit(self):
        _, time_bonus, _, _ = calculate_xp(6, 6, 'A1', 200)
        self.assertEqual(time_bonus, 0)

    def test_streak_bonus_triggers_at_3(self):
        _, _, streak_bonus, _ = calculate_xp(6, 6, 'A1', 0, consecutive_streak=3)
        self.assertEqual(streak_bonus, 50)

    def test_streak_bonus_not_triggered_below_3(self):
        _, _, streak_bonus, _ = calculate_xp(6, 6, 'A1', 0, consecutive_streak=2)
        self.assertEqual(streak_bonus, 0)

    def test_total_is_sum_of_components(self):
        base, time_bonus, streak_bonus, total = calculate_xp(6, 6, 'B1', 0, consecutive_streak=3)
        self.assertEqual(total, base + time_bonus + streak_bonus)

    def test_zero_score_gives_zero_base_xp(self):
        base, _, _, _ = calculate_xp(0, 6, 'B1', 0)
        self.assertEqual(base, 0)


class LevelCalculationTests(TestCase):

    def test_level_1_at_zero_xp(self):
        self.assertEqual(get_user_level(0), 1)

    def test_level_2_at_threshold(self):
        self.assertEqual(get_user_level(1000), 2)

    def test_level_2_just_below_threshold(self):
        self.assertEqual(get_user_level(999), 1)

    def test_level_3(self):
        self.assertEqual(get_user_level(2500), 3)

    def test_max_level_does_not_crash(self):
        level = get_user_level(999_999_999)
        self.assertGreaterEqual(level, 1)


class StreakTests(TestCase):

    def _make_user(self):
        from accounts.models import User
        return User.objects.create_user(username='streaker', password='pass')

    def test_first_active_day_sets_streak_1(self):
        user = self._make_user()
        self.assertIsNone(user.last_active)
        new_streak = update_streak(user)
        self.assertEqual(new_streak, 1)

    def test_same_day_does_not_increment(self):
        from django.utils import timezone
        user = self._make_user()
        user.last_active = timezone.localdate()
        user.streak = 5
        user.save()
        new_streak = update_streak(user)
        self.assertEqual(new_streak, 5)

    def test_consecutive_day_increments(self):
        from django.utils import timezone
        user = self._make_user()
        yesterday = timezone.localdate() - datetime.timedelta(days=1)
        user.last_active = yesterday
        user.streak = 4
        user.save()
        new_streak = update_streak(user)
        self.assertEqual(new_streak, 5)

    def test_broken_streak_resets_to_1(self):
        from django.utils import timezone
        user = self._make_user()
        three_days_ago = timezone.localdate() - datetime.timedelta(days=3)
        user.last_active = three_days_ago
        user.streak = 10
        user.save()
        new_streak = update_streak(user)
        self.assertEqual(new_streak, 1)

    def test_longest_streak_updated(self):
        from django.utils import timezone
        user = self._make_user()
        yesterday = timezone.localdate() - datetime.timedelta(days=1)
        user.last_active = yesterday
        user.streak = 6
        user.longest_streak = 6
        user.save()
        update_streak(user)
        user.refresh_from_db()
        self.assertEqual(user.longest_streak, 7)
