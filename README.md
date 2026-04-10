# 🐦 Flock — Twitter Clone

Clon funcional de Twitter/X construido como challenge técnico para [The Flock](https://theflock.com).

## Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server Components + Server Actions eliminan la necesidad de una API REST separada. Rendering híbrido SSR/CSR. |
| **Frontend** | React 19 + Tailwind CSS 4 | Último estándar con `useActionState`, `useTransition`, `useOptimistic`. Tailwind para desarrollo rápido mobile-first. |
| **Base de datos** | PostgreSQL 17 (Docker) | Relacional, robusto, ideal para grafos de follows y queries complejas. |
| **ORM** | Prisma 7 (con adapter pg nativo) | Type-safety completo, migraciones declarativas, seeding integrado. |
| **Autenticación** | JWT custom (jose + bcryptjs) | Implementación propia sin dependencias de terceros: tokens firmados en cookies HttpOnly. |
| **Runtime** | Node.js 22+ | Requerido por Next.js 16. |

## Prerrequisitos

- **Node.js** >= 22.0
- **Docker** y **Docker Compose** (para PostgreSQL)
- **npm** >= 10

## Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/juangustavoperez/twitter-clone.git
cd twitter-clone

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env si es necesario (los valores por defecto funcionan con Docker)

# 4. Levantar PostgreSQL con Docker
docker compose up -d

# 5. Sincronizar esquema de base de datos
npx prisma db push

# 6. Generar el cliente de Prisma
npx prisma generate

# 7. Ejecutar seed de datos
npx prisma db seed

# 8. Levantar la aplicación en modo desarrollo
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## Credenciales de Prueba

| Campo | Valor |
|---|---|
| **Email** | `demo@flock.com` |
| **Password** | `Password1!` |

Todos los usuarios del seed comparten la misma contraseña: `Password1!`

## Features Implementadas

### Autenticación
- ✅ Registro con validación de email, username y password en tiempo real
- ✅ Login con email o username
- ✅ Logout
- ✅ Protección de rutas (redirect a login si no hay sesión)
- ✅ Recuperación de contraseña con tokens temporales
- ✅ Validación inline de contraseña (8 chars, mayúscula, número, símbolo)

### Tweets
- ✅ Crear tweet (max 280 caracteres)
- ✅ Subir imagen adjunta al tweet
- ✅ Eliminar tweet propio
- ✅ Timeline con tabs "Para ti" (todos) y "Siguiendo" (solo seguidos)
- ✅ Infinite scroll con IntersectionObserver
- ✅ Vista previa de imagen antes de publicar

### Interacciones Sociales
- ✅ Follow / Unfollow de usuarios
- ✅ Like / Unlike con UI optimista (actualización instantánea)
- ✅ Contador de likes visible
- ✅ Listado de followers en perfil (`/username/followers`)
- ✅ Listado de following en perfil (`/username/following`)

### Perfil de Usuario
- ✅ Página de perfil dinámica (`/username`)
- ✅ Bio, avatar (DiceBear), fecha de registro
- ✅ Contadores de posts, seguidores, siguiendo
- ✅ Botón Follow/Unfollow con hover toggle

### Búsqueda
- ✅ Búsqueda de usuarios por nombre o username (`/search`)
- ✅ Resultados en tiempo real con debounce

### Responsive Design
- ✅ Mobile-first con breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px)
- ✅ Barra de navegación inferior en mobile
- ✅ Sidebar colapsada en tablet, expandida en desktop
- ✅ Compose tweet oculto en mobile (accesible via nav)

## Decisiones Técnicas

### Modelado del Timeline
El timeline utiliza dos estrategias:
- **"Para ti"**: Query directa `SELECT * FROM Tweet ORDER BY createdAt DESC` con paginación cursor-based.
- **"Siguiendo"**: Join a través de la tabla `Follow` para filtrar solo tweets de usuarios seguidos.

### Grafo de Follows
Modelado como tabla intermedia `Follow` con llave primaria compuesta `(followerId, followingId)`, lo que:
- Previene duplicados a nivel de DB
- Permite queries bidireccionales eficientes
- Soporta `CASCADE` delete

### Autenticación
Implementación 100% custom sin Firebase/Supabase/Auth0:
- **Registro**: bcrypt hash (cost 10) + validación regex server-side
- **Sesión**: JWT firmado con HS256 via `jose`, almacenado en cookie HttpOnly con `SameSite=Lax`
- **Protección**: Verificación de sesión en cada Server Component/Action

### Trade-offs y Limitaciones
- Las imágenes se almacenan en el filesystem local (`/public/uploads`). En producción se usaría S3/Cloudinary.
- El timeline "Para ti" muestra todos los tweets (no hay algoritmo de ranking).
- No hay WebSockets para real-time updates; se usa `revalidatePath` de Next.js.
- La búsqueda usa `ILIKE` de PostgreSQL; para escala se usaría Elasticsearch.

## Herramientas de AI

Se utilizó **Google Antigravity (Gemini)** como copiloto de desarrollo agentic durante todo el proceso:
- Scaffolding inicial del proyecto y schema de Prisma
- Implementación de Server Actions y componentes React
- Debugging de incompatibilidades entre Prisma 7 y Next.js 16 Turbopack
- Diseño de interfaces con Tailwind CSS
- Optimización de queries y resolución de errores de runtime

## Cómo Correr Tests

```bash
npm test
```

## Estructura del Proyecto

```
src/
├── actions/          # Server Actions (auth, tweet, social, timeline, recovery)
├── app/
│   ├── (auth)/       # Rutas de autenticación (login, register, forgot/reset password)
│   ├── [username]/   # Perfil dinámico + followers/following
│   ├── search/       # Búsqueda de usuarios
│   └── page.tsx      # Timeline principal
├── components/       # Componentes reutilizables (ComposeTweet, FollowButton, etc.)
└── lib/              # Utilidades (db, session)
prisma/
├── schema.prisma     # Modelo de datos
└── seed.ts           # Datos de prueba
```
