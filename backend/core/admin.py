# backend/core/admin.py
from django.contrib import admin
from .models import Resolucion, Programa, Bloque, Modulo, Estudiante, Inscripcion, Examen, Nota, Asistencia, BloqueDeFechas

@admin.register(Estudiante)
class EstudianteAdmin(admin.ModelAdmin):
    list_display = ("dni", "apellido", "nombre", "email", "ciudad", "barrio", "posee_pc", "posee_conectividad", "trabaja", "estatus")
    search_fields = ("dni", "apellido", "nombre", "email")
    list_filter = ("ciudad", "barrio", "posee_pc", "posee_conectividad", "trabaja", "estatus")

@admin.register(Resolucion)
class ResolucionAdmin(admin.ModelAdmin):
    list_display = ("numero", "nombre", "fecha_publicacion", "vigente", "created_at")
    search_fields = ("numero", "nombre")
    list_filter = ("vigente", "fecha_publicacion")
    ordering = ("-fecha_publicacion",)
    date_hierarchy = "fecha_publicacion"

@admin.register(Programa)
class ProgramaAdmin(admin.ModelAdmin):
    list_display = ("codigo", "nombre", "resolucion", "activo")
    search_fields = ("codigo", "nombre")
    list_filter = ("activo", "resolucion")

admin.site.register([Bloque, Modulo, Inscripcion, Examen, Nota, Asistencia, BloqueDeFechas])
