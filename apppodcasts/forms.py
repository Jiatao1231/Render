from django import forms
from django.utils.translation import gettext_lazy as _

from .models import Comentario


class ComentarioForm(forms.ModelForm):
    class Meta:
        model = Comentario
        fields = ['autor', 'valoracion', 'texto']
        labels = {
            'autor': _('Tu nombre'),
            'valoracion': _('Valoración'),
            'texto': _('Comentario'),
        }
        widgets = {
            'autor': forms.TextInput(attrs={
                'placeholder': _('Escribe tu nombre o alias'),
            }),
            'texto': forms.Textarea(attrs={
                'rows': 4,
                'placeholder': _('Comparte tu opinión sobre este podcast...'),
            }),
        }