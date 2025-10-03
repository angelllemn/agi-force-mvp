# Dockerfile para AGI Force MVP
# Imagen base con Node.js 20 LTS
FROM node:20-alpine

# Metadatos
LABEL maintainer="AGI Force Team"
LABEL version="1.0.0"
LABEL description="Contenedor de desarrollo para AGI Force MVP"

# Instalar dependencias del sistema
RUN apk add --no-cache \
    git \
    bash \
    curl \
    postgresql-client \
    vim \
    && rm -rf /var/cache/apk/*

# Crear usuario no-root para desarrollo
RUN addgroup -g 1001 -S agi && \
    adduser -S agi -u 1001 -G agi

# Configurar directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias (incluyendo dev para desarrollo)
RUN npm ci && \
    npm cache clean --force

# Cambiar propiedad del directorio a usuario agi
RUN chown -R agi:agi /app

# Cambiar a usuario no-root
USER agi

# Copiar código fuente
COPY --chown=agi:agi . .

# Exponer puerto de la aplicación
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=development
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_NAME=agi_force_mvp
ENV DB_USER=agi_user
ENV DB_PASSWORD=agi_pass

# Comando por defecto
CMD ["npm", "run", "dev"]