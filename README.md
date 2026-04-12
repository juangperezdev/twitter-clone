# 🐦 Flock — Twitter Clone

Clon funcional de Twitter/X construido como challenge técnico para [The Flock](https://theflock.com).

## 🚀 Despliegue Rápido (Docker)

Si tienes Docker instalado, puedes levantar todo el stack (Next.js + PostgreSQL) con un solo comando:

```bash
docker-compose up --build
```

Esto automáticamente configurará la base de datos, sincronizará el esquema de Prisma e iniciará la aplicación en [http://localhost:3000](http://localhost:3000).

---

## ⚡ Características Principales

### Core & Social
- ✅ **Threads & Replies**: Sistema de hilos jerárquicos con visualización de conversaciones.
- ✅ **Notificaciones**: Sistema básico para Follows, Likes y Respuestas con contador en tiempo real.
- ✅ **Timeline Dual**: Feed "Para ti" y feed de personas que sigues.
- ✅ **Interacción UI Optimista**: Likes instantáneos y carga fluida de contenido.
- ✅ **Búsqueda Real-time**: Localización de usuarios con debounce.
- ✅ **Perfiles**: Gestión de follows, visualización de posts y likes.

### Infraestructura & Seguridad
- ✅ **Real-Time SSE**: Actualizaciones del timeline sin recargar la página via Server-Sent Events.
- ✅ **Autenticación JWT**: Implementación stateless personalizada con cookies HttpOnly.
- ✅ **Recuperación de Pass**: Flujo completo de recuperación via email (simulado en consola).
- ✅ **Media**: Upload de imágenes (Vercel Blob / Local Storage).
- ✅ **Testing Robusto**: Cobertura de tests unitarios y de integración (+50 tests).
- ✅ **Dockerized**: Orquestación completa lista para producción.

---

## 🛠️ Instalación Manual

1.  **Dependencias**: `npm install`
2.  **Variables de Entorno**: Configurar `.env` basado en `.env.example`.
3.  **Base de Datos**: `npx prisma db push`
4.  **Ejecutar**: `npm run dev`

---

## 📐 Decisiones Técnicas y Arquitectura

### 1. Stack Tecnológico: Next.js + Prisma + PostgreSQL
He elegido **Next.js** (App Router) por su capacidad de mezclar Server e In-memory components, lo que permite una velocidad de respuesta inicial muy alta (SSR) y una gran interactividad. **Prisma** se utiliza como ORM por su robustez en el tipado y facilidad para manejar relaciones complejas.

### 2. Modelado del Grafo de Follows y Timeline
Para el grafo social, utilicé una relación **N:M (muchos a muchos)** sobre la misma tabla `User` a través de una tabla intermedia `Follow`.
- **Timeline**: El feed "Siguiendo" realiza una consulta `OR` que busca tweets donde el `authorId` sea el usuario actual o donde el autor esté presente en la lista de `following` del usuario. Esto garantiza que el usuario vea su propio contenido y el de sus contactos en un solo query ordenado por `createdAt`.

### 3. Autenticación Stateless (JWT)
Para cumplir con el requerimiento de **autenticación propia**, implementé un flujo basado en JWT utilizando la librería `jose`. 
- Las sesiones son **stateless**: se cifran en un JWT almacenado en una cookie `HttpOnly`, `Secure` y `SameSite=Lax`. Esto elimina la necesidad de consultar una tabla de sesiones pesada, permitiendo que la app escale horizontalmente de forma sencilla.

### 4. Real-time híbrido (SSE + Polling)
Para el bonus de tiempo real, implementé un **Event Bus** en el backend. 
- En local/servidores persistentes, se usa **SSE** para actualizaciones instantáneas. 
- Para entornos serverless (Vercel), se añadió un mecanismo de **polling de respaldo** corto (10s) para asegurar que las notificaciones lleguen incluso si la conexión SSE se interrumpe por el ciclo de vida de la función.

### 5. Uso de IA (Agentic Coding)
Este proyecto fue desarrollado utilizando un enfoque de **Agentic Coding** coordinado por Antigravity, alternando entre diversos modelos de lenguaje de vanguardia según la complejidad de la tarea:
- **Gemini 3.1 Pro (High/Low)**: Utilizado para el razonamiento arquitectónico profundo, diseño del esquema de base de datos y debugging de problemas complejos de concurrencia.
- **Claude Sonnet 4.6 (Thinking)**: Clave para el refinamiento de la UI/UX y la lógica de componentes de frontend.
- **Claude Opus 4.6 (Thinking)**: Empleado para tareas de refactorización crítica y lógica de negocio sensible.
- **Gemini 3 Flash**: Utilizado para iteraciones rápidas, ajustes de estilos CSS y tareas de mantenimiento repetitivas.

El uso de estos modelos permitió:
- **Refactorización acelerada**: Mover lógica de componentes de cliente a Server Actions para mejorar el SEO y la seguridad.
- **Generación de Tests**: Creación de una suite de integración robusta rápidamente con Vitest.
- **Arquitectura**: Diseño inicial del esquema de base de datos recursivo para los hilos de conversación.
- **Debugging Real-time**: Resolución de problemas de persistencia en SSE y EventBus en entornos serverless.

---

## 🧪 Testing y Credenciales

Para ejecutar los tests:
```bash
npm test
```

**Credenciales de Prueba (Demo User):**
- **Email**: `demo@flock.com`
- **Password**: `Password1!`

---

## 👨‍💻 Créditos
Desarrollado como parte del challenge de The Flock por Juangperezdev.
- [GitHub](https://github.com/juangperezdev)
- [LinkedIn](https://www.linkedin.com/in/juangustavoperez/)
