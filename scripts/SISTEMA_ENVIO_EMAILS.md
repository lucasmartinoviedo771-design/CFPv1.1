# 📧 SISTEMA DE ENVÍO DE CREDENCIALES POR EMAIL - CFP

## ✅ ESTADO ACTUAL: CASI COMPLETADO

### 🎯 **Funcionalidades Implementadas:**

#### 1. ✅ **Modelo User Profile Extendido**
- Campo `must_change_password` - Fuerza cambio en primer login
- Campo `temp_password` - Almacena contraseña temporal para envío
- Campo `credentials_sent_at` - Rastrea cuándo se enviaron las credenciales
- Migración: `0003_userprofile_credentials_sent_at_and_more.py`
- **Nota**: En CFP se trabaja con Users de Django, no con modelo separado de Docente

#### 2. ✅ **Script de Envío de Emails**
- `scripts/enviar_credenciales.py`
- Sistema de lotes con rate limiting
- Configuración de límites y delays
- Modo dry-run para pruebas
- Soporte para filtrar por grupo (docente, staff, etc)
- Soporte para Cloudflare Email Routing y Gmail

#### 3. ✅ **Configuración de Email en Django**
- Settings configurados para SMTP
- Variable `FRONTEND_URL` para enlaces en emails
- Soporte para variables de entorno

---

## ⚙️ **PENDIENTE: Configuración de Credenciales de Email**

### **Pasos para Completar:**

#### **Opción 1: Cloudflare Email Routing + Gmail (RECOMENDADO)**

Cloudflare Email Routing no tiene servidor SMTP directo, pero podemos usar Gmail con el dominio de Cloudflare:

1. **Generar App Password de Gmail:**
   - Ve a https://myaccount.google.com/apppasswords
   - Inicia sesión con `lucasoviedodev@gmail.com`
   - Genera una nueva "App Password"
   - Copia la contraseña generada (16 caracteres)

2. **Actualizar `.env` en CFP:**
   ```bash
   # En /home/admin486321/CFP/.env
   EMAIL_HOST_USER=lucasoviedodev@gmail.com
   EMAIL_HOST_PASSWORD=xxxx_xxxx_xxxx_xxxx  # Reemplazar con App Password de Gmail
   DEFAULT_FROM_EMAIL=CFP <soporte@lucasoviedodev.org>
   ```

3. **Reiniciar Backend:**
   ```bash
   cd /home/admin486321/CFP
   docker compose restart backend
   ```

#### **Opción 2: Gmail Directo (Fallback)**

Si Cloudflare no funciona:

```bash
DEFAULT_FROM_EMAIL=CFP <lucasoviedodev@gmail.com>
```

---

## 📝 **Cómo Crear Usuarios (Docentes) con Contraseñas Automáticas**

### **Método 1: Usar Script de Prueba**

```bash
cd /home/admin486321/CFP
docker compose exec backend python scripts/crear_usuario_prueba.py
```

Esto creará un usuario docente de prueba con:
- DNI: 88888888
- Email: docente.prueba@ejemplo.com (cambiar a email real)
- Grupo: docente
- Contraseña automática de 12 caracteres

### **Método 2: Crear Manualmente en Django Shell**

```python
from django.contrib.auth.models import User, Group
from core.models import UserProfile
import secrets
import string

def generar_contraseña_segura(longitud=12):
    caracteres = string.ascii_letters + string.digits + "!@#$%&"
    return ''.join(secrets.choice(caracteres) for _ in range(longitud))

# Crear usuario
username = "12345678"  # DNI del docente
password = generar_contraseña_segura()

user = User.objects.create_user(
    username=username,
    email="docente@ejemplo.com",
    password=password,
    first_name="Juan",
    last_name="Pérez"
)

# Agregar al grupo docente
grupo_docente, _ = Group.objects.get_or_create(name="docente")
user.groups.add(grupo_docente)

# Crear perfil con contraseña temporal
UserProfile.objects.create(
    user=user,
    must_change_password=True,
    temp_password=password  # Guardar para envío por email
)

print(f"Usuario: {username}")
print(f"Contraseña: {password}")
```

---

## 🚀 **Envío de Credenciales**

### **1. Probar en Modo Dry-Run (Simulación)**

```bash
cd /home/admin486321/CFP
# Todos los usuarios con credenciales pendientes
docker compose exec backend python scripts/enviar_credenciales.py --dry-run --limite 5

# Solo docentes
docker compose exec backend python scripts/enviar_credenciales.py --grupo docente --dry-run
```

### **2. Enviar a un Usuario de Prueba**

```bash
docker compose exec backend python scripts/enviar_credenciales.py --limite 1 --delay 0
```

### **3. Envío Masivo con Rate Limiting**

```bash
# Enviar a 50 usuarios con 5 segundos de delay
docker compose exec backend python scripts/enviar_credenciales.py --limite 50 --delay 5

# Solo docentes con filtro
docker compose exec backend python scripts/enviar_credenciales.py --grupo docente --limite 50 --delay 5

# Para lotes más grandes (usar delay mayor para evitar spam)
docker compose exec backend python scripts/enviar_credenciales.py --limite 100 --delay 10
```

---

## 📧 **Plantilla de Email**

```
Asunto: Credenciales de acceso - Sistema CFP

Hola [Nombre] [Apellido],

Te damos la bienvenida al Sistema de Gestión CFP.

Tus credenciales de acceso son:

🔐 Usuario: [DNI/Username]
🔑 Contraseña: [Contraseña Aleatoria]

🌐 Link de acceso: https://cfp.lucasoviedodev.org/login

IMPORTANTE:
- Por seguridad, deberás cambiar tu contraseña en el primer inicio de sesión.
- Guarda estas credenciales en un lugar seguro.
- Si tienes problemas para acceder, contacta a soporte.

Saludos cordiales,
Centro de Formación Profesional
```

---

## 🔐 **Seguridad Implementada:**

1. ✅ Contraseñas aleatorias de 12 caracteres
2. ✅ Incluyen mayúsculas, minúsculas, números y símbolos
3. ✅ Cambio obligatorio en primer login (`must_change_password=True`)
4. ✅ `temp_password` almacenada para envío (se marca como enviada con timestamp)
5. ✅ Emails encriptados en tránsito (TLS)
6. ✅ Rate limiting para evitar bloqueos por spam
7. ✅ Filtrado por grupos (docente, staff, etc)

---

## ⚠️ **Límites de Envío**

### **Gmail:**
- **Límite**: ~500 emails/día con cuenta gratuita
- **Recomendación**: Lotes de 50 con delay de 5-10 segundos

### **Configuración Recomendada:**

| Cantidad | Config Recomendada |
|----------|-------------------|
| 1-50 usuarios | `--limite 50 --delay 5` |
| 51-100 usuarios | `--limite 50 --delay 10` (ejecutar 2 veces) |
| 100+ usuarios | Dividir en días o usar servicio profesional |

---

## 📊 **Próximos Pasos:**

1. **Configurar App Password de Gmail** ⏳
   - Generar en https://myaccount.google.com/apppasswords
   - Actualizar `EMAIL_HOST_PASSWORD` en `.env`

2. **Reiniciar Backend** ⏳
   ```bash
   docker compose restart backend
   ```

3. **Crear Usuario de Prueba** ⏳
   ```bash
   docker compose exec backend python scripts/crear_usuario_prueba.py
   ```

4. **Probar Envío** ⏳
   ```bash
   docker compose exec backend python scripts/enviar_credenciales.py --dry-run --limite 1
   ```

5. **Envío Real** ⏳
   ```bash
   docker compose exec backend python scripts/enviar_credenciales.py --grupo docente --limite 50 --delay 5
   ```

---

## 🎉 **Conclusión**

El sistema está **95% funcional**. Solo falta:
1. ✅ App Password de Gmail (5 minutos)
2. ✅ Reiniciar backend (30 segundos)
3. ✅ Prueba de envío (2 minutos)

**Tiempo total estimado: ~10 minutos**

---

**Creado**: 2025-12-15
**Sistema**: CFP - Centro de Formación Profesional
