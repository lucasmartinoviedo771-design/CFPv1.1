from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from core.roles import ROLE_ORDER


class Command(BaseCommand):
    help = 'Crea los grupos de usuario definidos en roles.py'

    def handle(self, *args, **options):
        created_count = 0
        existing_count = 0
        
        for role_name in ROLE_ORDER:
            group, created = Group.objects.get_or_create(name=role_name)
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Grupo creado: {role_name}'))
            else:
                existing_count += 1
                self.stdout.write(f'  Grupo existente: {role_name}')
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Proceso completado: {created_count} creados, {existing_count} existentes'))
