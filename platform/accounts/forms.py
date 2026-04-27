from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import User


class RegisterForm(UserCreationForm):
    email = forms.EmailField(required=False, help_text='Optional')
    is_teacher = forms.BooleanField(required=False, label='I am a teacher')

    class Meta:
        model = User
        fields = ('username', 'email', 'is_teacher', 'password1', 'password2')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.update({'class': 'form-input'})


class LoginForm(AuthenticationForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.update({'class': 'form-input'})


class ProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ('avatar', 'bio', 'cefr_level')
        widgets = {
            'bio': forms.Textarea(attrs={'rows': 3, 'class': 'form-input'}),
            'cefr_level': forms.Select(attrs={'class': 'form-input'}),
        }

    AVATAR_CHOICES = [
        ('📚', '📚 Book'), ('🦉', '🦉 Owl'), ('🌟', '🌟 Star'),
        ('🎯', '🎯 Target'), ('🔥', '🔥 Fire'), ('💎', '💎 Diamond'),
        ('🚀', '🚀 Rocket'), ('🌈', '🌈 Rainbow'),
    ]
    avatar = forms.ChoiceField(choices=AVATAR_CHOICES, widget=forms.RadioSelect(attrs={'class': 'avatar-radio'}))
