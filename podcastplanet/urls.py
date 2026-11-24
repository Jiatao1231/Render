from django.conf.urls.i18n import i18n_patterns
from django.contrib import admin
from django.urls import include, path
from django.views.i18n import JavaScriptCatalog

# El panel de administración queda fuera del prefijo de idioma (sigue en /admin/)
urlpatterns = [
    path('admin/', admin.site.urls),
]

# Todo lo demás lleva el idioma en la URL: /es/podcasts/, /en/podcasts/, ...
urlpatterns += i18n_patterns(
    path('i18n/', include('django.conf.urls.i18n')),  # vista set_language (selector de idioma)
    path('jsi18n/', JavaScriptCatalog.as_view(), name='javascript-catalog'),  # textos traducidos de app.js
    path('', include('apppodcasts.urls')),
)
