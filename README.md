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

### 1. ¿Por qué este Stack?

**Next.js 16 (App Router)** fue elegido por tres razones concretas:
- **Server Actions**: Eliminan la necesidad de una capa REST/GraphQL separada. Cada mutación (crear tweet, follow, like) es una función `async` con `'use server'` que se invoca directamente desde el formulario o componente. Esto reduce el boilerplate en un ~60% comparado con un enfoque API + fetch.
- **React Server Components (RSC)**: Las páginas como el timeline y el perfil renderizan en el servidor sin enviar JavaScript innecesario al cliente. Solo los componentes interactivos (`ComposeTweet`, `FollowButton`, `TweetInteraction`) son Client Components.
- **Streaming + Suspense**: Next.js 16 permite renderizado incremental, lo que mejora TTFB en páginas que dependen de queries a la DB.

**PostgreSQL sobre SQLite**: El modelo de follows es esencialmente un grafo dirigido. PostgreSQL soporta `JOIN`s complejos, `ILIKE` para búsqueda case-insensitive, y conexiones concurrentes — tres cosas que SQLite maneja con limitaciones significativas. Además, servicios como Neon ofrecen PostgreSQL serverless gratuito, alineándose con el deploy en Vercel.

**Prisma 7 con adapter `pg`**: Prisma 7 introdujo un cambio arquitectural importante: ya no maneja el connection string internamente. En su lugar, delegamos la conexión a un `Pool` de `pg` (Node.js nativo) a través de `@prisma/adapter-pg`. Esto nos da control total sobre SSL, pool size, y timeouts — crítico para Vercel serverless donde cada invocación crea una función efímera.

**Tailwind CSS 4**: Desarrollo mobile-first con utilities atómicos. Permite iterar rápido en la UI sin context-switching entre archivos CSS y componentes.

### 2. Modelado del Timeline

El timeline implementa dos modos con queries diferenciadas:

```
"Para ti" (todos los tweets):
  SELECT * FROM "Tweet"
  ORDER BY "createdAt" DESC
  LIMIT 11 OFFSET {page * 10}

"Siguiendo" (solo tweets de seguidos):
  SELECT t.* FROM "Tweet" t
  INNER JOIN "Follow" f ON f."followingId" = t."authorId"
  WHERE f."followerId" = {currentUserId}
  ORDER BY t."createdAt" DESC
  LIMIT 11 OFFSET {page * 10}
```

**Decisión de paginación offset-based vs cursor-based**: Elegí offset-based por simplicidad. El trade-off es que inserciones durante la navegación pueden causar duplicados en la siguiente página. Para un MVP esto es aceptable; en producción usaría cursor-based (`WHERE createdAt < :lastSeen`).

**Truco del `LIMIT 11`**: Para detectar si hay más páginas sin una query `COUNT(*)` separada, pido `TWEETS_PER_PAGE + 1`. Si recibo 11 resultados, hay más; si recibo ≤10, es la última página. Luego trimeo a 10 para el cliente.

**Infinite scroll**: Implementado con `IntersectionObserver` sobre un div sentinel al final de la lista. Cuando entra al viewport, dispara un `useTransition` que carga la siguiente página via Server Action (`loadTweets`).

### 3. Grafo de Follows

```prisma
model Follow {
  follower    User   @relation("following", fields: [followerId], references: [id])
  followerId  String
  following   User   @relation("followers", fields: [followingId], references: [id])
  followingId String
  @@id([followerId, followingId])
}
```

**Llave primaria compuesta `(followerId, followingId)`**: Previene duplicados a nivel de DB sin necesidad de un unique constraint separado. Si el user A intenta seguir al user B dos veces, PostgreSQL rechaza la segunda inserción.

**Relaciones bidireccionales**: Cada `User` tiene dos relaciones con `Follow`:
- `followers`: Quiénes me siguen → `Follow.followingId = myId`
- `following`: A quiénes sigo → `Follow.followerId = myId`

Esto permite queries eficientes en ambas direcciones. Para verificar si `userA` sigue a `userB`:
```ts
prisma.follow.findUnique({
  where: { followerId_followingId: { followerId: userA, followingId: userB } }
})
```
Single query, O(1) por la primary key compuesta.

### 4. Autenticación

Implementación 100% custom sin Auth0/Clerk/Firebase, cumpliendo el requisito del challenge:

**Flujo de registro:**
1. Validación client-side en tiempo real (debounce de 500ms contra DB para email + username)
2. Validación server-side con regex: `^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$`
3. Hash con `bcryptjs` cost 10 (balance entre seguridad y latencia)
4. `prisma.user.create()` → `createSession()` → `redirect('/')`

**Sesión:**
- JWT firmado con HMAC-SHA256 via librería `jose` (Web Crypto API, no Node.js crypto)
- Cookie `HttpOnly` + `Secure` (en producción) + `SameSite=Lax` + `Path=/`
- Expiración de 7 días en el claim `exp` del JWT
- No se almacenan sesiones en DB (stateless) → escalabilidad horizontal sin coordinación

**Protección de rutas:**
- Cada Server Component (página) verifica la cookie al inicio: `cookies().get('session')` → `decrypt()` → si falla, `redirect('/login')`
- Cada Server Action repite la verificación via `getUserId()` interno
- Doble capa: incluso si el browser tiene una cookie válida, la Action verifica ownership antes de mutaciones

**Recuperación de contraseña:**
- Token criptográfico de 32 bytes (`crypto.randomBytes(32).toString('hex')`)
- Expiración de 1 hora, almacenado en `User.resetToken`
- Anti-enumeración OWASP: si el email no existe, la respuesta es idéntica a cuando sí existe

### 5. Trade-offs y Limitaciones Conocidas

| Aspecto | Decisión Actual | Alternativa en Producción |
|---|---|---|
| **Almacenamiento de imágenes** | Filesystem local en dev, Vercel Blob en prod | S3 + CloudFront CDN para better caching |
| **Timeline "Para ti"** | Cronológico reverso (todos los tweets) | Algoritmo de ranking (engagement, recency, affinity) |
| **Real-time updates** | `revalidatePath()` al crear tweet/like | WebSockets o Server-Sent Events para push |
| **Búsqueda** | `ILIKE` de PostgreSQL | Elasticsearch/Meilisearch con fuzzy matching |
| **Paginación** | Offset-based | Cursor-based para consistencia en feeds con alta escritura |
| **Rate limiting** | No implementado | `express-rate-limit` o Vercel Edge Middleware |
| **Email transaccional** | Console log (dev) | SendGrid/Resend para password reset |
| **Pool de conexiones** | `pg.Pool` por request | PgBouncer o Neon's connection pooler para high concurrency |
| **Sesiones** | JWT stateless | Sessions en Redis para revocación instantánea |
| **Testing** | Unit + Integration con mocks | E2E con Playwright contra DB de test |

### 6. Herramientas de AI

Se utilizó **Google Antigravity** (Gemini 2.5 Pro, agentic coding assistant) como copiloto durante **todo el ciclo de desarrollo**. No se escribió código manualmente; todo fue generado, revisado, y corregido via prompts iterativos.

**Cómo se aprovechó:**

| Fase | Uso de AI | Impacto |
|---|---|---|
| **Arquitectura** | Definición del schema Prisma y estructura de carpetas | Evitó iteraciones de modelado. El grafo de follows quedó correcto al primer intento. |
| **Scaffolding** | Generación de Server Actions, componentes React, y configuración | ~15 archivos creados en una sesión, todos funcionales. |
| **Debugging** | Resolución de errores de Prisma 7 (adapter pg, config.ts vs schema.prisma) | Errores que manualmente llevarían horas de Stack Overflow se resolvieron en minutos. |
| **Deploy** | Configuración de Vercel + Neon + SSL + env vars | Diagnóstico de errores de runtime en producción (SSL, cookies, PrismaClient init). |
| **Testing** | Suite completa de 52 tests con Vitest | Generados y depurados iterativamente hasta 100% pass rate. |
| **UI/UX** | Diseño de interfaces premium con Tailwind CSS | Resultado visual coherente con Twitter/X sin maquetas previas. |

**Reflexión:** La AI fue más efectiva en:
1. **Boilerplate repetitivo** (tests, mocks, CRUD actions) — 10x más rápido que manualmente
2. **Debugging de errores crípticos** (Prisma 7 breaking changes, Next.js 16 cookie restrictions)
3. **Integración de servicios** (Vercel + Neon + Blob) con configuraciones correctas

Fue menos efectiva en:
1. **Diseño de lógica de negocio compleja** — requirió dirección explícita para el timeline filtrado
2. **Decisiones de arquitectura a largo plazo** — el humano decidió qué trade-offs aceptar

## Cómo Correr Tests

```bash
# Correr todos los tests
npm test

# Tests en modo watch (desarrollo)
npm run test:watch

# Tests con reporte de cobertura
npm run test:coverage
```

### Cobertura de Tests (52 tests)

| Suite | Tests | Módulo |
|---|---|---|
| `auth.test.ts` | 17 | Registro, login, validación de password, username/email availability |
| `tweet.test.ts` | 10 | Crear tweet, límite 280 chars, like toggle, delete con ownership |
| `session.test.ts` | 8 | JWT encrypt/decrypt, tokens inválidos, tamper detection, wrong key |
| `recovery.test.ts` | 7 | Forgot password, reset token expiry, anti-enumeración OWASP |
| `social.test.ts` | 6 | Follow/unfollow, self-follow prevention, búsqueda |
| `timeline.test.ts` | 4 | Paginación, hasMore detection, filtro por seguidos |

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
