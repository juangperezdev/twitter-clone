# 📖 Runbook: Setup & Operación

Este documento contiene las instrucciones exactas para configurar, ejecutar y testear la aplicación **Flock (Twitter Clone)** desde cero.

---

## 🛠️ Prerrequisitos

Para ejecutar este proyecto, necesitas tener instaladas las siguientes herramientas en tu sistema:

*   **Node.js**: `v20.x` o superior (LTS recomendada).
*   **npm**: `v10.x` o superior.
*   **Docker**: `v25.x` o superior (para orquestación de base de datos local).
*   **Docker Compose**: `v2.x` o superior.
*   **Git**: Para clonar el repositorio.

---

## 📥 Pasos de Instalación

Sigue estos comandos en orden para dejar el entorno listo. No se asumen pasos previos.

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/juangustavoperez/twitter-clone.git
    cd twitter-clone
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno**:
    Crea una copia del archivo de ejemplo y asegúrate de que los valores sean correctos para tu entorno local.
    ```bash
    cp .env.example .env
    ```

4.  **Levantar la base de datos (Docker)**:
    Este comando descarga la imagen de PostgreSQL e inicia el contenedor con la configuración requerida.
    ```bash
    docker-compose up -d db
    ```

5.  **Preparar la Base de Datos (Prisma)**:
    Sincroniza el esquema con la base de datos y genera el cliente de Prisma. (Nota: Si usas Docker Compose, esto ocurre automáticamente).
    ```bash
    npx prisma generate
    npx prisma db push
    ```

---

## ⚡ Cómo levantar la aplicación (Modo Desarrollo)

### Opción A (Recomendada para Evaluadores): Docker Todo-en-uno
Este comando levanta la DB y la App, configurando el esquema y los datos iniciales automáticamente:
```bash
docker-compose up --build
```

### Opción B: Ejecución Nativa
Si prefieres correrlo fuera de Docker:
```bash
npm run dev
```
La aplicación estará disponible en: [http://localhost:3000](http://localhost:3000)

---

## 🌱 Cómo correr el Seed de Datos

Si usas la **Opción B (Nativa)** o quieres resetear la base de datos:

Si deseas poblar la base de datos con usuarios, tweets, likes y seguidores de prueba (faker):

```bash
npx prisma db seed
```

**Credenciales generadas por el seed:**
*   **Usuario**: `demo@flock.com`
*   **Password**: `Password1!`

---

## 🧪 Cómo correr la suite de Tests completa

La aplicación utiliza **Vitest** y **React Testing Library**. Para ejecutar todos los tests (Unitarios e Integración):

```bash
npm test
```

Para ver la cobertura de los tests:
```bash
npm run test:coverage
```

---

## 🔑 Variables de Entorno Requeridas

Asegúrate de tener definidas las siguientes variables en tu archivo `.env`:

| Variable | Descripción | Valor de Ejemplo |
| :--- | :--- | :--- |
| `DATABASE_URL` | URL de conexión a PostgreSQL. | `postgresql://twitter:twitter123@localhost:5432/twitter_clone` |
| `SESSION_SECRET` | Llave para cifrar las cookies de sesión (JWT). | `minimo-32-caracteres-aleatorios-aqui` |
| `BLOB_READ_WRITE_TOKEN` | (Opcional) Token para Vercel Blob en producción. | `vercel_blob_rw_...` |

> **Nota**: Si usas el `docker-compose.yml` incluido, los valores de `DATABASE_URL` por defecto en el `.env.example` funcionarán automáticamente.
