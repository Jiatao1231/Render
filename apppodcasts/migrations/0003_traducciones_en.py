from django.db import migrations, models

# Traducciones al inglés de los datos que ya existen (se buscan por su nombre en español)
TEMATICAS = {
    'True crime': ('True crime', 'Real criminal cases and investigations told in depth.'),
    'Humor': ('Comedy', 'Comedy and improv shows for a few laughs.'),
    'Actualidad': ('Current affairs', "Analysis and conversation about the week's news."),
    'Ciencia': ('Science', 'Science communication to understand the universe and nature.'),
    'Feminismo': ('Feminism', 'Voices and stories from a feminist perspective.'),
    'Tecnología': ('Technology', 'News, gadgets and the internet explained in a friendly way.'),
}

PODCASTS = {
    'Crims': 'Each episode reviews a real criminal case with testimonies and documents.',
    'Criminopatía': 'Criminal cases and psychological profiles analyzed in detail.',
    'Nadie Sabe Nada': 'Unscripted humor and improv about any topic.',
    'Estirando el chicle': 'Comedy and analysis of series, films and pop culture.',
    'Hoy en EL PAÍS': 'Daily summary of current events in just a few minutes.',
    'Carne Cruda': 'Current affairs program with interviews and reports.',
    'Coffee Break: Señal y Ruido': 'Weekly roundtable on astrophysics and current science.',
    'La Ciencia de la Vida': 'Biology and medicine explained in an accessible way.',
    'Tenemos que hablar': 'Conversations about equality, rights and society.',
    'Mujeres con historia': 'Biographies of women who made history and were forgotten.',
    'Loop Infinito': 'News from the Apple world and consumer technology.',
    'Territorio Xataka': "Analysis of the week's technology news.",
}


def rellenar_ingles(apps, schema_editor):
    Tematica = apps.get_model('apppodcasts', 'Tematica')
    Podcast = apps.get_model('apppodcasts', 'Podcast')
    for nombre, (nombre_en, descripcion_en) in TEMATICAS.items():
        Tematica.objects.filter(nombre=nombre).update(nombre_en=nombre_en, descripcion_en=descripcion_en)
    for nombre, descripcion_en in PODCASTS.items():
        Podcast.objects.filter(nombre=nombre).update(descripcion_en=descripcion_en)


class Migration(migrations.Migration):

    dependencies = [
        ('apppodcasts', '0002_comentario'),
    ]

    operations = [
        migrations.AddField(
            model_name='tematica',
            name='nombre_en',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
        migrations.AddField(
            model_name='tematica',
            name='descripcion_en',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='podcast',
            name='descripcion_en',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.RunPython(rellenar_ingles, migrations.RunPython.noop),
    ]
