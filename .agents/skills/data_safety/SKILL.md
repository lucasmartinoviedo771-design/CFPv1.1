---
name: Data Safety and Integrity
description: Critical rules about data deletion and modification to prevent accidental data loss.
---

# 🛑 REGLA DE ORO: SEGURIDAD DE DATOS Y ARCHIVOS

Esta es una instrucción crítica y mandatoria para todas las intervenciones en este proyecto (CFP).

## 1. Prohibición de Borrado No Autorizado
**NUNCA, bajo ningún concepto, se debe borrar información de la base de datos o archivos físicos del servidor (media, documentos, imágenes) sin una orden explícita y precisa del usuario.**

- No se deben usar comandos `delete()`, `destroy()`, `remove` o `rm` en scripts de limpieza o reseteo sin confirmación previa.
- Aunque se tenga "rienda suelta" para codificar, esta autonomía NO se extiende a la eliminación de datos existentes.
- Antes de realizar cualquier acción que implique pérdida de información, se debe consultar: *"¿Está seguro de que desea borrar [X]?"* y esperar la confirmación.

## 2. Acciones de Reseteo y Limpieza
- Si el usuario pide "limpiar" o "resetear" una ficha, se debe preguntar si se desea mantener los archivos adjuntos o si se deben eliminar.
- En caso de duda, **siempre optar por mantener el dato** o moverlo a una carpeta temporal (`/backups` o `/temporal`) en lugar de borrarlo.

## 3. Integridad de los Datos de Estudiantes
- Los archivos subidos por los alumnos (DNI, Selfies, Firmas) son documentos oficiales. Su pérdida implica un retrabajo para la institución y el alumno.
- Cualquier modificación en la lógica de estados que afecte la visibilidad de estos archivos debe probarse exhaustivamente para asegurar que el vínculo no se pierda.

---
*Este documento es una salvaguarda establecida después de incidentes de pérdida de datos accidentales. Su cumplimiento es obligatorio.*
