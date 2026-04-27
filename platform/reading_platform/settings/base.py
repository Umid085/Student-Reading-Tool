from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production')

DEBUG = False
ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'accounts',
    'reading',
    'quiz',
    'vocabulary',
    'gamification',
    'social',
    'teacher',
    'ai',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'reading_platform.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'gamification.context_processors.gamification_context',
            ],
        },
    },
]

WSGI_APPLICATION = 'reading_platform.wsgi.application'

AUTH_USER_MODEL = 'accounts.User'
LOGIN_URL = '/accounts/login/'
LOGIN_REDIRECT_URL = '/reading/'
LOGOUT_REDIRECT_URL = '/accounts/login/'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

ANTHROPIC_API_KEY = config('ANTHROPIC_API_KEY', default='')

CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

LEVEL_MULTIPLIERS = {
    'A1': 1.0, 'A2': 1.5, 'B1': 2.0,
    'B2': 2.5, 'C1': 3.0, 'C2': 4.0,
}
LEVEL_TIME_LIMITS = {
    'A1': 150, 'A2': 150, 'B1': 180,
    'B2': 180, 'C1': 210, 'C2': 210,
}
LEVEL_TIME_BONUSES = {
    'A1': 200, 'A2': 200, 'B1': 300,
    'B2': 300, 'C1': 400, 'C2': 400,
}
XP_THRESHOLDS = [
    0, 1000, 2500, 4500, 7000, 10500, 15000, 21000,
    28000, 36000, 45000, 55000, 66000, 78000, 91000,
    105000, 120000, 136000, 153000, 171000, 190000,
]
