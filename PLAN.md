# Plan de Trabajo - CFP Terciario

## Contexto
Proyecto separado del CFP original para gestionar preinscripciones del
**Centro Politécnico Superior Malvinas Argentinas**
Tecnicatura en Ciencias de Datos e Inteligencia Artificial.

- Repo: https://github.com/lucasmartinoviedo771-design/CFP-TERCIARIO
- URL producción: https://cfp-terciario.lucasoviedodev.org
- Directorio: /home/admin486321/CFP-TERCIARIO

## Paleta de colores (del sitio oficial politecnico.ar)
- Navy oscuro: `#1a1f4e` (header/footer)
- Gris cálido: `#c8c4bc` (secciones)
- Celeste grisáceo: `#b8ccd8` (secciones alternadas)
- Amarillo: `#f5c518` (botón destacado)
- Blanco: cards y formularios

---

## Estado actual

### ✅ Completado
- [x] Entorno Docker corriendo en puertos separados (frontend: 8087/8447, DB: 3309)
- [x] Base de datos `CFP_TERCIARIO` con copia de producción
- [x] Cloudflare tunnel configurado para cfp-terciario.lucasoviedodev.org
- [x] Modelo `PreinscripcionTerciario` creado y migrado (migración 0021)
- [x] Archivo API `/app/core/api/preinscripcion_terciario.py` creado
- [x] Router registrado en `core/api/__init__.py` y `academia/api.py`

### 🔄 Pendiente (en orden)

#### 1. Sincronizar archivos al contenedor y verificar API
```bash
cd /home/admin486321/CFP-TERCIARIO
docker cp backend/core/api/preinscripcion_terciario.py cfp_terciario_backend:/app/core/api/preinscripcion_terciario.py
docker cp backend/core/api/__init__.py cfp_terciario_backend:/app/core/api/__init__.py
docker cp backend/academia/api.py cfp_terciario_backend:/app/academia/api.py
docker restart cfp_terciario_backend
# Verificar:
curl -sk https://cfp-terciario.lucasoviedodev.org/api/v2/docs | grep -o "preinscripcion-terciario"
```

#### 2. Crear página pública de preinscripción (frontend)
- Archivo: `frontend/src/pages/PreinscripcionTerciario.jsx`
- Ruta: `/preinscripcion-terciario` (agregar en `App.jsx`)
- Diseño: pasos tipo wizard igual que PreinscripcionPublica.jsx pero con colores del Politécnico
- Secciones del formulario:
  1. **Datos Personales**: email, apellido/nombre (tal cual DNI), DNI, CUIL, sexo (F/M/Otro), celular, fecha nacimiento, localidad nacimiento, provincia nacimiento, nacionalidad, domicilio, localidad (desplegable con lógica de rechazo para "Otras Ciudades")
  2. **Datos Académicos**: ¿finalizó secundaria? (Sí/No/Cursando último año), ¿posee estudios superiores? → si Sí: ¿los finalizó? + nombre de carrera
  3. **Datos Tecnológicos**: ¿posee PC/notebook?, ¿posee conectividad a internet?
  4. **Datos Complementarios**: ¿pueblos originarios?, ¿discapacidad? → si Sí: tipo (Visual/Auditiva/Intelectual/Motora/TEA/Otra/Múltiple), CUD, apoyo en aula, ¿requiere apoyo específico? → si Sí: descripción
- **Lógica de rechazo**: si localidad = "Otras Ciudades" → mostrar pantalla "La Tecnicatura es solo para residentes de Tierra del Fuego" y no permitir continuar
- Header: logo/nombre del Politécnico, título de la tecnicatura
- Al enviar: llamar a `POST /api/v2/preinscripcion-terciario`
- Confirmación: pantalla de éxito con mensaje de que recibirá un email

#### 3. Agregar ruta en App.jsx
```jsx
<Route path="/preinscripcion-terciario" element={<PreinscripcionTerciario />} />
```
Sin protección de autenticación (pública).

#### 4. Panel de gestión para admin
- Archivo: `frontend/src/pages/GestionPreinscripcionesTerciario.jsx`
- Ruta protegida: `/preinscripciones-terciario`
- Vista de tabla con todas las preinscripciones
- Filtros: estado (pendiente/aprobada/rechazada), localidad, secundaria completa
- Acciones: ver detalle completo, cambiar estado, agregar observaciones
- Endpoint backend: `GET /api/v2/preinscripciones-terciario` (requiere auth)

#### 5. Agregar endpoint de listado al backend
- En `preinscripcion_terciario.py` agregar endpoint GET con autenticación
- Serializar todos los campos del modelo

#### 6. Agregar link en el sidebar/nav del panel admin

#### 7. Rebuild y deploy
```bash
cd /home/admin486321/CFP-TERCIARIO
docker compose up -d --build
```

#### 8. Commit y push al repo
```bash
git add -A
git commit -m "feat: formulario de preinscripcion terciario completo"
git push origin main
```

---

## Notas importantes
- Producción (CFP original) está en `/home/admin486321/CFP` — NO tocar
- El terciario NO usa test de nivelación digital
- El terciario NO se inscribe a materias del CFP
- Solo residentes de Tierra del Fuego pueden preinscribirse
- Email de contacto del Politécnico: tecnicaturedatos@tdf.edu.ar
- El superusuario del terciario usa las mismas credenciales que el CFP (DB copiada de prod)
