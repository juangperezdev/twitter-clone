FROM node:22

WORKDIR /app


# Copiamos archivos
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalamos dependencias (incluyendo devDeps para prisma generate)
# Usamos --frozen-lockfile si es posible, pero aquí vamos simple
RUN npm install

# Copiamos el resto de la app
COPY . .

# Generamos el cliente de Prisma explícitamente en el build
RUN npx prisma generate

# Exponemos puerto
EXPOSE 3000

# Iniciamos
CMD ["npm", "run", "dev"]
