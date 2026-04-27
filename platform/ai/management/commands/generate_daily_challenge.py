"""
Management command: generate today's daily challenge via Claude API.
Run daily via cron or a scheduler (e.g. Heroku Scheduler).

Usage:
    python manage.py generate_daily_challenge
    python manage.py generate_daily_challenge --level B2 --topic science
    python manage.py generate_daily_challenge --date 2026-05-01
"""
import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from ai.models import DailyChallenge
from ai.utils import generate_passage_and_quiz


LEVEL_ROTATION = ['A1', 'A2', 'B1', 'B1', 'B2', 'B2', 'C1']
TOPIC_ROTATION = [
    'science and technology', 'history and culture', 'nature and environment',
    'health and lifestyle', 'travel and adventure', 'art and music',
    'society and education',
]


class Command(BaseCommand):
    help = 'Generate today\'s daily reading challenge via Claude API'

    def add_arguments(self, parser):
        parser.add_argument('--level', type=str, default='', help='Force a specific CEFR level')
        parser.add_argument('--topic', type=str, default='', help='Force a specific topic')
        parser.add_argument('--date', type=str, default='', help='Target date YYYY-MM-DD (default: today)')

    def handle(self, *args, **options):
        target_date_str = options['date'] or datetime.date.today().isoformat()
        try:
            target_date = datetime.date.fromisoformat(target_date_str)
        except ValueError:
            self.stderr.write(self.style.ERROR(f'Invalid date: {target_date_str}'))
            return

        if DailyChallenge.objects.filter(date=target_date).exists():
            self.stdout.write(self.style.WARNING(f'Daily challenge for {target_date} already exists — skipping.'))
            return

        # Rotate level and topic deterministically by day-of-year
        day_idx = target_date.timetuple().tm_yday
        level = options['level'] or LEVEL_ROTATION[day_idx % len(LEVEL_ROTATION)]
        topic = options['topic'] or TOPIC_ROTATION[day_idx % len(TOPIC_ROTATION)]

        self.stdout.write(f'Generating {level} challenge on "{topic}" for {target_date}…')
        try:
            data = generate_passage_and_quiz(level, topic)
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'Generation failed: {e}'))
            return

        DailyChallenge.objects.create(
            date=target_date,
            cefr_level=level,
            topic=topic,
            passage=data['passage'],
            questions=data['questions'],
        )
        self.stdout.write(self.style.SUCCESS(f'✓ Daily challenge created for {target_date} ({level} – {topic})'))
