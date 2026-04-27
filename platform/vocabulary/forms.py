from django import forms
from .models import VocabWord


class VocabWordForm(forms.ModelForm):
    class Meta:
        model = VocabWord
        fields = ['word', 'definition', 'example']
        widgets = {
            'word': forms.TextInput(attrs={'placeholder': 'Word or phrase'}),
            'definition': forms.TextInput(attrs={'placeholder': 'Definition'}),
            'example': forms.Textarea(attrs={'rows': 2, 'placeholder': 'Example sentence (optional)'}),
        }
