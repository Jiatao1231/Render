from django.urls import path
from .views import (
    IndexView,
    PlataformaDetailView,
    PlataformaListView,
    PodcastDetailView,
    PodcastListView,
    TematicaDetailView,
    TematicaListView,
)

urlpatterns = [
    path('', IndexView.as_view(), name='index'),
    path('podcasts/', PodcastListView.as_view(), name='podcasts'),
    path('podcasts/<int:pk>/', PodcastDetailView.as_view(), name='podcast'),
    path('tematicas/', TematicaListView.as_view(), name='tematicas'),
    path('tematicas/<int:pk>/', TematicaDetailView.as_view(), name='tematica'),
    path('plataformas/', PlataformaListView.as_view(), name='plataformas'),
    path('plataformas/<int:pk>/', PlataformaDetailView.as_view(), name='plataforma'),
]