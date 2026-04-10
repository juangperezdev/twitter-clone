FROM node:20-alpine

WORKDIR /app

# Copiamos los archivos de dependencias
COPY package.json package-lock.json* ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto de desarrollo
EXPOSE 3000

# Iniciamos el servidor de desarrollo de Next.js
CMD ["npm", "run", "dev"]
