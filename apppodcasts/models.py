from django.db import models
from django.utils.translation import get_language, gettext_lazy as _


def _segun_idioma(texto_es, texto_en):
    """Devuelve el texto en inglés si ese es el idioma activo y existe; si no, el original en español."""
    if (get_language() or '').startswith('en') and texto_en:
        return texto_en
    return texto_es


class Tematica(models.Model):
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField()
    nombre_en = models.CharField(max_length=50, blank=True, default='')
    descripcion_en = models.TextField(blank=True, default='')

    # Versión en el idioma activo (para usar en las plantillas)
    @property
    def nombre_t(self):
        return _segun_idioma(self.nombre, self.nombre_en)

    @property
    def descripcion_t(self):
        return _segun_idioma(self.descripcion, self.descripcion_en)

    def __str__(self):
        return self.nombre


class Plataforma(models.Model):
    nombre = models.CharField(max_length=50)
    web = models.URLField()

    def __str__(self):
        return self.nombre


class Podcast(models.Model):
    tematica = models.ForeignKey(Tematica, on_delete=models.CASCADE)
    plataformas = models.ManyToManyField(Plataforma)
    nombre = models.CharField(max_length=80)
    descripcion = models.TextField()
    descripcion_en = models.TextField(blank=True, default='')
    fecha = models.DateField()

    # Versión en el idioma activo (el nombre de un podcast es un título propio y no se traduce)
    @property
    def descripcion_t(self):
        return _segun_idioma(self.descripcion, self.descripcion_en)

    def __str__(self):
        return self.nombre


class Comentario(models.Model):
    VALORACIONES = [
        (1, _('1 ★ - Muy malo')),
        (2, _('2 ★ - Regular')),
        (3, _('3 ★ - Bueno')),
        (4, _('4 ★ - Muy bueno')),
        (5, _('5 ★ - Excelente')),
    ]

    podcast = models.ForeignKey(Podcast, on_delete=models.CASCADE, related_name='comentarios')
    autor = models.CharField(max_length=60)
    texto = models.TextField()
    valoracion = models.IntegerField(choices=VALORACIONES, default=5)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.autor} - {self.podcast.nombre}"