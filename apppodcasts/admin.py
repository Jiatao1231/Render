from django.contrib import admin
from .models import Tematica, Plataforma, Podcast, Comentario

admin.site.register(Tematica)
admin.site.register(Plataforma)
admin.site.register(Podcast)
admin.site.register(Comentario)