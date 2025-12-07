# Plan de Migracion CFP por Fases (v2)

Resumen ejecutable de las 6 fases, sin fechas rigidas. Prefijo de convivencia: `/api/v2/` (Django Ninja), manteniendo `/api/` (DRF) hasta completar la migracion.

## Fase 1 · Preparación
- Rama de trabajo: `feat/estandarizacion-ipes6` (desde `master`).
- Backups verificados: dump MySQL `cfp_db` y codigo; carpeta `backups/` ignorada en git.
- Estado inicial documentado: versiones (Django/DRF/libs), endpoints criticos (Estudiante, Programa, Bloque, Modulo, Examen/Nota, Asistencia, Inscripcion, KPIs).
- Plan de rollback: restore dump + media (si aplica) + checkout rama estable.

## Fase 2 · Backend → Django Ninja
- Base Ninja en `/api/v2/` (NinjaAPI con routers por dominio).
- Schemas Pydantic para Estudiante, Programa, Bloque, Cohorte, Modulo, Examen, Nota, Asistencia, Inscripcion.
- Migracion incremental de endpoints (catalogos -> Programa/Bloque/Modulo -> Estudiante/Inscripcion -> Examen/Nota/Asistencia -> analytics/KPI).
- Convivencia: DRF activo en `/api/`; Ninja crece en `/api/v2/`; documentacion Ninja en `/api/v2/docs`.

## Fase 3 · Frontend → TypeScript + pnpm + TanStack Query
- Tooling: pnpm, tsconfig, tipos estrictos.
- Cliente API tipado apuntando a `/api/v2/` (mantener `/api/` para v1 mientras conviven).
- Integrar TanStack Query (hooks CRUD por dominio, manejo de cache/refetch/errores).
- Migrar vistas críticas a la API nueva sin romper UX actual (feature flags si hace falta).

## Fase 4 · Testing
- Backend: pytest para endpoints Ninja y logica de dominio; datos semilla minimos.
- Frontend: Vitest + React Testing Library para componentes y hooks de datos.
- CI: jobs de lint + tests para backend y frontend; cobertura objetivo 60–70 % en modulos criticos.

## Fase 5 · Seguridad y Performance
- Rate limiting en login y endpoints de alta frecuencia.
- Revision de permisos/roles y limpieza de mensajes de error.
- Optimizaciones: select_related/prefetch_related, paginacion coherente, indices si faltan.

## Fase 6 · Validación Integral + Staging
- Pruebas end-to-end de flujos completos y comparacion vs sistema previo.
- Metricas: tiempos de respuesta, errores/logs, feedback usuarios clave.
- Deploy a staging (migraciones incluidas), smoke tests y checklist de produccion/rollback.

## Entregables / Referencias
- Este archivo: fases y criterios de éxito.
- `PREPARACION_MIGRACION.md`: comandos y respuestas base (rama, dumps, CI, prefijos).
- `MIGRACION_PASO_A_PASO.md`: comandos tecnicos detallados.
- `EJEMPLO_MIGRACION_DRF_NINJA.md`: snippets de referencia para Ninja.
- `CHECKLIST_MIGRACION.md`: checklist imprimible.
