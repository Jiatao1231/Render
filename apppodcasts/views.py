from django.http import JsonResponse
from django.shortcuts import redirect
from django.utils import timezone
from django.views.generic import DetailView, ListView, TemplateView

from .forms import ComentarioForm
from .models import Plataforma, Podcast, Tematica


# Portada: el podcast más reciente de cada temática (1 consulta con JOIN en lugar de N+1)
class IndexView(TemplateView):
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        destacados = []
        vistos = set()
        podcasts = Podcast.objects.select_related('tematica').order_by('tematica__nombre', '-fecha')
        for podcast in podcasts:
            if podcast.tematica_id not in vistos:
                vistos.add(podcast.tematica_id)
                destacados.append(podcast)
        context['destacados'] = destacados
        return context


# Lista de podcasts (1 consulta con JOIN a Tematica)
class PodcastListView(ListView):
    model = Podcast
    queryset = Podcast.objects.select_related('tematica').order_by('nombre')
    template_name = 'podcasts.html'
    context_object_name = 'podcasts'


# Detalle de un podcast, navegación anterior/siguiente y comentarios (GET y POST / AJAX)
class PodcastDetailView(DetailView):
    model = Podcast
    queryset = Podcast.objects.select_related('tematica').prefetch_related('plataformas', 'comentarios')
    template_name = 'podcast.html'
    context_object_name = 'podcast'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        podcast = self.object

        # Calcular podcast anterior y siguiente según orden alfabético
        todos_podcasts = list(Podcast.objects.order_by('nombre').only('id', 'nombre'))
        indice = todos_podcasts.index(podcast)
        anterior = todos_podcasts[indice - 1] if indice > 0 else None
        siguiente = todos_podcasts[indice + 1] if indice < len(todos_podcasts) - 1 else None

        context['plataformas'] = podcast.plataformas.all()
        context['comentarios'] = podcast.comentarios.all()
        context['form'] = kwargs.get('form') or ComentarioForm()
        context['anterior'] = anterior
        context['siguiente'] = siguiente
        return context

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        form = ComentarioForm(request.POST)
        es_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

        if form.is_valid():
            comentario = form.save(commit=False)
            comentario.podcast = self.object
            comentario.save()

            if es_ajax:
                return JsonResponse({
                    'ok': True,
                    'autor': comentario.autor,
                    'valoracion': comentario.get_valoracion_display(),
                    'fecha': timezone.localtime(comentario.fecha).strftime('%d/%m/%Y %H:%M'),
                    'texto': comentario.texto,
                    'total': self.object.comentarios.count(),
                })
            return redirect('podcast', pk=self.object.pk)

        if es_ajax:
            return JsonResponse({'ok': False, 'errores': form.errors}, status=400)

        return self.render_to_response(self.get_context_data(form=form))


# Lista de temáticas
class TematicaListView(ListView):
    model = Tematica
    queryset = Tematica.objects.order_by('nombre')
    template_name = 'tematicas.html'
    context_object_name = 'tematicas'


# Detalle de una temática y sus podcasts
class TematicaDetailView(DetailView):
    model = Tematica
    template_name = 'tematica.html'
    context_object_name = 'tematica'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['podcasts'] = self.object.podcast_set.order_by('nombre')
        return context


# Lista de plataformas
class PlataformaListView(ListView):
    model = Plataforma
    queryset = Plataforma.objects.order_by('nombre')
    template_name = 'plataformas.html'
    context_object_name = 'plataformas'


# Detalle de una plataforma y sus podcasts (1 consulta con JOIN a Tematica)
class PlataformaDetailView(DetailView):
    model = Plataforma
    template_name = 'plataforma.html'
    context_object_name = 'plataforma'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['podcasts'] = self.object.podcast_set.select_related('tematica').order_by('nombre')
        return context