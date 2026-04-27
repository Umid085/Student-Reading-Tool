"""
Creates a superuser non-interactively from env vars or arguments.
Usage:
    python manage.py create_superuser_quick --username admin --password secret
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Create a superuser without interactive prompts'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='admin')
        parser.add_argument('--password', default='admin123')
        parser.add_argument('--email', default='admin@example.com')

    def handle(self, *args, **options):
        User = get_user_model()
        username = options['username']
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'User "{username}" already exists — skipping.'))
            return
        User.objects.create_superuser(
            username=username,
            email=options['email'],
            password=options['password'],
        )
        self.stdout.write(self.style.SUCCESS(f'✓ Superuser "{username}" created.'))
