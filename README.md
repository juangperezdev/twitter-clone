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

### 1. Sistema de Notificaciones
He diseñado un sistema de notificaciones **push-based** integrado en los Server Actions. 
- Cada vez que ocurre una acción (Like, Follow, Reply), se inserta un registro en la tabla `Notification` apuntando al destinatario. 
- Para optimizar el rendimiento, el contador de notificaciones no leídas se consulta en el `layout` o componentes principales. 
- **Trade-off**: En un sistema masivo, esto podría generar mucha escritura. Se recomienda mover esto a un sistema de colas (Redis) en el futuro.

### 2. Threads (Hilos de Respuestas)
He implementado una relación recursiva en el modelo `Tweet`:
```prisma
model Tweet {
  parentId  String?
  parent    Tweet?   @relation("replies", fields: [parentId], references: [id])
  replies   Tweet[]  @relation("replies")
}
```
Esto permite:
- Visualizar el contexto (padre) al ver un tweet específico.
- Cargar respuestas anidadas de forma eficiente mediante `include: { replies: true }`.
- El feed principal filtra `parentId: null` para evitar duplicar contenido que ya está en hilos.

### 3. Autenticación Stateless
Se utiliza la librería `jose` para manejar JWTs en el Edge. Al ser stateless, no necesitamos consultar una tabla de sesiones en cada petición, lo que reduce la latencia de la DB considerablemente en el App Router de Next.js.

---

## 🧪 Testing

La estabilidad del backend está garantizada por una suite de tests automáticos que cubren Auth, Tweets, Social, Timeline y Recovery:

```bash
npm test
```

---

## 👨‍💻 Créditos
Desarrollado como parte del challenge de The Flock por Juangperezdev.
- [GitHub](https://github.com/juangustavoperez)
- [LinkedIn](https://linkedin.com/in/juangperezdev)
