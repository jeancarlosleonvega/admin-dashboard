# Instrucciones de Setup de Base de Datos

## Estado Actual

✅ **Completado:**
- RegisterPage creado en frontend
- Ruta /register agregada a App.tsx
- LoginPage actualizado con link a registro

⚠️ **Pendiente (requiere PostgreSQL):**
- Crear migraciones de base de datos
- Ejecutar seed inicial

---

## Prerequisitos

### 1. Instalar PostgreSQL

Si aún no tienes PostgreSQL instalado:

**Windows:**
- Descarga desde: https://www.postgresql.org/download/windows/
- Instala PostgreSQL 14 o superior
- Durante la instalación, recuerda la contraseña del usuario `postgres`
- Por defecto, PostgreSQL corre en el puerto 5432

**Alternativa con Docker:**
```bash
docker run --name postgres-admin-dashboard \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=admin_dashboard \
  -p 5432:5432 \
  -d postgres:14
```

### 2. Verificar que PostgreSQL está corriendo

**Windows (usando servicios):**
- Abre "Servicios" (services.msc)
- Busca "postgresql-x64-14" o similar
- Asegúrate que esté en estado "En ejecución"

**O verifica con psql:**
```bash
psql -U postgres -c "SELECT version();"
```

---

## Pasos para Completar el Setup

### Paso 1: Crear la Base de Datos

Conéctate a PostgreSQL y crea la base de datos:

```bash
# Conectarse como usuario postgres
psql -U postgres

# Dentro de psql:
CREATE DATABASE admin_dashboard;

# Verificar que se creó
\l

# Salir
\q
```

### Paso 2: Verificar el .env

El archivo `backend/.env` ya está configurado con:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/admin_dashboard
```

Si tu contraseña de PostgreSQL es diferente, actualiza el `.env`:

```env
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/admin_dashboard
```

### Paso 3: Ejecutar Migraciones (Push Schema)

Desde la raíz del proyecto:

```bash
cd backend
npm run db:push
```

Este comando:
- Sincroniza el schema de Prisma con la base de datos
- Crea todas las tablas (users, roles, permissions, etc.)
- Es más rápido que las migraciones para desarrollo inicial

**Output esperado:**
```
Prisma schema loaded from src/infrastructure/database/prisma/schema.prisma
Datasource "db": PostgreSQL database "admin_dashboard" at "localhost:5432"

🚀  Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

### Paso 4: Ejecutar Seed

Después de que el schema esté sincronizado:

```bash
npm run db:seed
```

Esto creará:
- **Permisos**: dashboard.view, users.*, roles.*
- **Roles**:
  - Super Admin (todos los permisos)
  - Admin (dashboard, users view/create/edit, roles view)
  - User (solo dashboard)
- **Usuario Admin**:
  - Email: `admin@example.com`
  - Password: `admin123`

**Output esperado:**
```
Seeding database...
Permissions created
Roles created
Admin user created: admin@example.com / admin123
Seeding completed!
```

### Paso 5: Verificar las Tablas

```bash
npm run db:studio
```

Esto abre Prisma Studio en tu navegador (http://localhost:5555) donde puedes:
- Ver todas las tablas creadas
- Ver los datos del seed
- Explorar las relaciones

---

## Verificación del Setup Completo

### 1. Verificar Backend

Inicia el backend:

```bash
npm run dev:backend
```

Deberías ver:
```
Server listening on http://0.0.0.0:3000
✓ Database connection successful
```

### 2. Probar Login con Usuario Admin

Puedes probar con curl o Postman:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Respuesta esperada:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "status": "ACTIVE"
    },
    "permissions": ["dashboard.view", "users.view", ...],
    "accessToken": "eyJhbGc..."
  }
}
```

### 3. Probar Frontend

Inicia el frontend:

```bash
npm run dev:frontend
```

Abre http://localhost:5173 y:
- Haz clic en "Create one" para ir a /register
- Crea una nueva cuenta con tus datos
- O usa el admin: admin@example.com / admin123

---

## Comandos Útiles de Prisma

```bash
# Ver el estado de las migraciones
npm run db:migrate status -w backend

# Crear una migración (después de cambiar schema.prisma)
npm run db:migrate -w backend

# Resetear la base de datos (CUIDADO: borra todos los datos)
npx prisma migrate reset

# Regenerar el Prisma Client después de cambios en schema
npm run db:generate -w backend

# Ver los datos en navegador
npm run db:studio -w backend
```

---

## Troubleshooting

### Error: "Can't reach database server"

**Problema:** PostgreSQL no está corriendo o el puerto es incorrecto.

**Solución:**
1. Verifica que PostgreSQL esté corriendo (servicios de Windows)
2. Verifica que el puerto sea 5432
3. Verifica las credenciales en DATABASE_URL

### Error: "database does not exist"

**Problema:** La base de datos `admin_dashboard` no fue creada.

**Solución:**
```bash
psql -U postgres
CREATE DATABASE admin_dashboard;
\q
```

### Error: "password authentication failed"

**Problema:** La contraseña en DATABASE_URL no coincide.

**Solución:** Actualiza el .env con la contraseña correcta de tu instalación de PostgreSQL.

### Error: "P1001: Can't reach database server at localhost:5432"

**Problema:** PostgreSQL no está escuchando en localhost.

**Solución:** Verifica la configuración de PostgreSQL en `postgresql.conf`:
```
listen_addresses = 'localhost'
port = 5432
```

---

## Próximos Pasos

Una vez que la base de datos esté configurada:

1. ✅ Puedes probar el registro de nuevos usuarios en /register
2. ✅ Puedes hacer login con admin@example.com
3. 🔄 Completar Phase 4: Conectar UsersListPage con el backend
4. 🔄 Crear formularios de crear/editar usuarios
5. 🔄 Implementar password reset flow

---

## Resumen de URLs

- **Backend API**: http://localhost:3000/api
- **Frontend**: http://localhost:5173
- **Prisma Studio**: http://localhost:5555 (cuando corre db:studio)
- **API Docs (Swagger)**: http://localhost:3000/documentation (en desarrollo)

---

¿Necesitas ayuda con algún paso? No dudes en preguntar!
