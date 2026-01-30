# Phase 3: Authorization (RBAC) - Testing Guide

## ✅ Implementaciones Completadas

### Backend
1. ✅ **Permission Caching con Redis**
   - Permisos se cachean por 15 minutos
   - Cache key: `permissions:{userId}`
   - Se invalida automáticamente en logout
   - Se invalida al cambiar roles de usuario

2. ✅ **Middleware de Autorización Mejorado**
   - Primer request: consulta DB y cachea permisos
   - Requests subsecuentes: usa cache (mucho más rápido)
   - Soporta permisos múltiples

### Frontend
1. ✅ **PermissionGate Component**
   - Muestra/oculta elementos según permisos
   - Soporta un permiso o array de permisos
   - Modos: requireAll (todos) o requireAny (cualquiera)
   - Soporte para fallback customizado

2. ✅ **PermissionRoute Component**
   - Guard de ruta con verificación de permisos
   - Redirect a dashboard si no tiene permisos
   - Combinable con ProtectedRoute

3. ✅ **Aplicación en Componentes**
   - UsersListPage: Botón "Add User" visible solo con `users.create`
   - Sidebar: Items filtrados por permisos
   - App.tsx: Rutas protegidas con permisos específicos

---

## 🧪 Plan de Pruebas

### Preparación

Asegúrate de tener los 3 roles seeded:
- **Super Admin**: Todos los permisos
- **Admin**: dashboard.view, users.view, users.create, users.edit, roles.view
- **User**: solo dashboard.view

```bash
# Si no lo has hecho, ejecuta el seed
cd backend
npm run db:seed
```

---

### Test 1: Verificar Usuarios con Diferentes Roles

```bash
cd backend
node verify-admin.js
```

Deberías ver:
```
✅ Admin user found:
   Email: admin@example.com
   Name: Admin User
   Status: ACTIVE

📋 Roles:
   - Super Admin
     Permissions:
      • dashboard.view
      • users.view
      • users.create
      • users.edit
      • users.delete
      • roles.view
      • roles.manage
```

---

### Test 2: Login como Super Admin

1. Inicia backend y frontend:
   ```bash
   npm run dev:backend  # Terminal 1
   npm run dev:frontend # Terminal 2
   ```

2. Login con:
   - Email: `admin@example.com`
   - Password: `admin123`

3. ✅ **Verificar que puedes ver:**
   - Sidebar: Dashboard, Users, Roles, Settings
   - UsersListPage: Botón "Add User" visible
   - Puedes acceder a /dashboard y /users

---

### Test 3: Crear Usuario con Rol "User"

**Opción A: Via Backend (Postman/curl)**

```bash
# 1. Login para obtener token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# Copia el accessToken de la respuesta

# 2. Obtener ID del rol "User"
curl http://localhost:3000/api/roles \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"

# Copia el id del rol "User"

# 3. Crear nuevo usuario
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Test1234",
    "firstName": "John",
    "lastName": "Doe",
    "roleIds": ["ID_DEL_ROL_USER"]
  }'
```

**Opción B: Via Frontend (cuando esté el form)**
- Crear usuario manualmente desde la UI cuando esté implementado

---

### Test 4: Login como Usuario Regular (Rol "User")

1. Logout del admin
2. Login con:
   - Email: `john@example.com`
   - Password: `Test1234`

3. ✅ **Verificar restricciones:**
   - Sidebar: Solo ve "Dashboard" y "Settings"
   - NO ve "Users" ni "Roles" en el sidebar
   - Intenta ir a `/users` manualmente → Redirect a `/dashboard`
   - En UsersListPage (si accedes via URL directa): NO ves botón "Add User"

---

### Test 5: Verificar Caching de Permisos

#### Con Redis habilitado:

1. Asegúrate que Redis está corriendo
2. Uncomment `REDIS_URL` en `backend/.env`:
   ```env
   REDIS_URL=redis://localhost:6379
   ```
3. Reinicia el backend

4. Abre Redis CLI (o Redis Commander):
   ```bash
   redis-cli
   > KEYS permissions:*
   ```

5. Login como admin → Haz varias requests
6. ✅ **Verificar:**
   - Primera request: más lenta (consulta DB)
   - Requests subsecuentes: muy rápidas (usa cache)
   - En Redis CLI deberías ver: `permissions:{userId}`

7. Hacer logout → Cache se invalida:
   ```bash
   redis-cli
   > KEYS permissions:*
   (empty array)
   ```

#### Sin Redis (modo fallback):

Si Redis no está disponible o REDIS_URL está comentado:
- El sistema funciona igual
- Simplemente NO cachea
- Cada request consulta la DB

---

### Test 6: PermissionGate Component

Edita temporalmente `UsersListPage.tsx` para probar diferentes escenarios:

```tsx
// Test 1: Single permission
<PermissionGate permission="users.create">
  <button>Solo con users.create</button>
</PermissionGate>

// Test 2: Multiple permissions (ANY)
<PermissionGate permission={["users.edit", "users.delete"]}>
  <button>Con edit O delete</button>
</PermissionGate>

// Test 3: Multiple permissions (ALL)
<PermissionGate
  permission={["users.view", "users.edit"]}
  requireAll
>
  <button>Con view Y edit</button>
</PermissionGate>

// Test 4: With fallback
<PermissionGate
  permission="users.delete"
  fallback={<span className="text-gray-400">Sin permisos</span>}
>
  <button>Delete</button>
</PermissionGate>
```

Login con diferentes usuarios y verifica qué botones aparecen.

---

### Test 7: PermissionRoute Component

Prueba acceso directo a rutas:

1. Login como Usuario con rol "User" (solo dashboard.view)

2. Intenta acceder manualmente a:
   - `http://localhost:5173/dashboard` → ✅ Acceso permitido
   - `http://localhost:5173/users` → ❌ Redirect a `/dashboard`

3. Verifica en DevTools → Console:
   - No deberías ver errores
   - El redirect es silencioso

---

### Test 8: Invalidación de Cache al Cambiar Roles

1. Login como admin (Super Admin)
2. Actualiza el rol de un usuario (cuando esté el form)
3. ✅ **Verificar:**
   - Cache de ese usuario se invalida automáticamente
   - Siguiente request del usuario afectado recarga permisos

Para verificar manualmente:

```bash
# En Redis CLI
redis-cli
> GET permissions:USER_ID_HERE
# Debería mostrar los permisos cached

# Después de actualizar roles del usuario
> GET permissions:USER_ID_HERE
(nil)  # Cache fue invalidado
```

---

## 🐛 Troubleshooting

### Redis no conecta

**Síntoma:** Logs muestran "Redis connection failed"

**Solución:**
1. Verifica que Redis está corriendo
2. O simplemente comenta `REDIS_URL` en .env
3. El sistema funciona sin Redis (sin caching)

### Usuario no ve cambios de permisos

**Síntoma:** Cambié roles pero el usuario sigue viendo lo mismo

**Soluciones:**
1. Usuario debe hacer logout y login nuevamente
2. O esperar 15 minutos (TTL del cache)
3. O invalidar cache manualmente:
   ```bash
   redis-cli
   > DEL permissions:USER_ID
   ```

### PermissionGate no oculta elementos

**Verificar:**
1. Usuario tiene permisos en BD
2. Permisos fueron cargados en authStore (ver DevTools → Application → Zustand)
3. Permiso escrito correctamente: `"users.view"` (no `"user.view"`)

### Rutas no redirigen

**Verificar:**
1. PermissionRoute está envolviendo el componente en App.tsx
2. El permiso existe en BD
3. Usuario tiene el permiso asignado via rol

---

## 📊 Resumen de Permisos por Rol

| Permiso | Super Admin | Admin | User |
|---------|-------------|-------|------|
| dashboard.view | ✅ | ✅ | ✅ |
| users.view | ✅ | ✅ | ❌ |
| users.create | ✅ | ✅ | ❌ |
| users.edit | ✅ | ✅ | ❌ |
| users.delete | ✅ | ❌ | ❌ |
| roles.view | ✅ | ✅ | ❌ |
| roles.manage | ✅ | ❌ | ❌ |

---

## 🎯 Próximos Pasos

Phase 3 está completa. Ahora puedes:

1. **Phase 4**: Implementar CRUD completo de usuarios con formularios
2. **Phase 5**: Agregar roles management
3. **Testing**: Escribir tests automatizados para RBAC
4. **Production**: Configurar Redis en producción para mejor performance

---

¡Todo el sistema RBAC está funcional y listo para usar! 🚀
