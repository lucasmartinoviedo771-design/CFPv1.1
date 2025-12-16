# 📧 API Endpoint: Enviar Credenciales por Email

## ✅ **Endpoint Implementado**

```
POST /api/users/{user_id}/enviar-credenciales
```

### **Descripción:**
Envía las credenciales de acceso por email a un usuario específico. El usuario debe tener:
- Un `UserProfile` asociado
- Una contraseña temporal (`temp_password`) generada
- Un email configurado

---

## 🔑 **Autenticación Requerida:**

- **Requiere**: Token JWT de un usuario administrador
- **Header**: `Authorization: Bearer {token}`

---

## 📝 **Uso Desde el Frontend (JavaScript/TypeScript):**

### **1. Obtener Token (Login)**

```javascript
const loginResponse = await fetch('https://cfp.lucasoviedodev.org/api/v2/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'password123'
  })
});

const { access } = await loginResponse.json();
```

### **2. Enviar Credenciales**

```javascript
const userId = 3;  // ID del usuario al que enviar credenciales

const response = await fetch(`https://cfp.lucasoviedodev.org/api/users/${userId}/enviar-credenciales`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();

if (result.success) {
  console.log(`✅ ${result.message}`);
  console.log(`Email enviado a: ${result.email}`);
  console.log(`Enviado en: ${result.sent_at}`);
} else {
  console.error(`❌ Error: ${result.error}`);
}
```

### **3. Ejemplo Completo en React:**

```tsx
const EnviarCredencialesButton = ({ userId }: { userId: number }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const enviarCredenciales = async () => {
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(
        `${API_URL}/api/users/${userId}/enviar-credenciales`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        setMessage(`✅ Credenciales enviadas a ${result.email}`);
      } else {
        setMessage(`❌ ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={enviarCredenciales}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Enviando...' : '📧 Enviar Credenciales'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};
```

---

## 📊 **Respuestas de la API:**

### **✅ Éxito (200 OK):**

```json
{
  "success": true,
  "message": "Credenciales enviadas exitosamente a docente@ejemplo.com",
  "user_id": 3,
  "email": "docente@ejemplo.com",
  "sent_at": "2025-12-15T22:23:17.789928+00:00"
}
```

### **❌ Error - Usuario sin UserProfile:**

```json
{
  "success": false,
  "error": "El usuario no tiene un UserProfile asociado"
}
```

### **❌ Error - Sin contraseña temporal:**

```json
{
  "success": false,
  "error": "El usuario no tiene contraseña temporal generada"
}
```

### **❌ Error - Sin email:**

```json
{
  "success": false,
  "error": "El usuario no tiene email configurado"
}
```

### **❌ Error - Fallo al enviar:**

```json
{
  "success": false,
  "error": "Error al enviar email: [detalle del error]"
}
```

---

## 🧪 **Prueba con cURL:**

```bash
# 1. Obtener token
curl -X POST http://localhost:8000/api/v2/token \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# 2. Enviar credenciales (reemplaza TOKEN y USER_ID)
curl -X POST http://localhost:8000/api/users/3/enviar-credenciales \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🔍 **Casos de Uso:**

### **Caso 1: Crear usuario y enviar credenciales inmediatamente**

```javascript
// 1. Crear usuario
const createResponse = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: '12345678',
    email: 'docente@ejemplo.com',
    first_name: 'Juan',
    last_name: 'Pérez',
    password: 'temp123',  // Contraseña temporal
    groups: ['docente']
  })
});

const newUser = await createResponse.json();

// 2. Enviar credenciales inmediatamente
await fetch(`/api/users/${newUser.id}/enviar-credenciales`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### **Caso 2: Reenviar credenciales**

```javascript
// Si un usuario perdió sus credenciales, puedes reenviarlas
// (siempre que todavía tenga temp_password y no haya cambiado su contraseña)
const response = await fetch(`/api/users/${userId}/enviar-credenciales`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 📋 **Flujo Completo:**

```
1. Admin crea usuario en el frontend
   ↓
2. Backend crea User + UserProfile con temp_password
   ↓
3. Frontend muestra botón "Enviar Credenciales"
   ↓
4. Admin hace clic en "Enviar Credenciales"
   ↓
5. Frontend llama a POST /api/users/{id}/enviar-credenciales
   ↓
6. Backend envía email con credenciales
   ↓
7. Backend marca credentials_sent_at en UserProfile
   ↓
8. Usuario recibe email y puede iniciar sesión
   ↓
9. Al primer login, usuario debe cambiar contraseña
```

---

## 🛠️ **Integración con el Frontend:**

En tu componente de administración de usuarios, puedes agregar un botón junto a cada usuario:

```tsx
<UserTable>
  {users.map(user => (
    <UserRow key={user.id}>
      <td>{user.username}</td>
      <td>{user.email}</td>
      <td>
        {user.profile?.temp_password && !user.profile?.credentials_sent_at ? (
          <button onClick={() => enviarCredenciales(user.id)}>
            📧 Enviar Credenciales
          </button>
        ) : user.profile?.credentials_sent_at ? (
          <span>✅ Enviado {formatDate(user.profile.credentials_sent_at)}</span>
        ) : (
          <span>-</span>
        )}
      </td>
    </UserRow>
  ))}
</UserTable>
```

---

**Creado**: 2025-12-15  
**Sistema**: CFP - Centro de Formación Profesional
