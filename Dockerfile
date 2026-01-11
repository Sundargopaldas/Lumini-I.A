# ========================================
# LUMINI I.A - Dockerfile para Fly.io
# ========================================

# Stage 1: Build do Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copiar package.json do frontend
COPY frontend/package*.json ./

# Instalar dependências do frontend
RUN npm ci

# Copiar código do frontend
COPY frontend/ ./

# Build do frontend (gera pasta dist/)
RUN npm run build

# ========================================
# Stage 2: Backend + Frontend servido
# ========================================
FROM node:18-alpine

WORKDIR /app

# Instalar dependências do sistema necessárias para compilar sqlite3
RUN apk add --no-cache \
    tini \
    python3 \
    make \
    g++ \
    sqlite

# Copiar package.json do backend
COPY backend/package*.json ./

# Instalar dependências do backend (incluindo rebuild do sqlite3)
RUN npm ci --only=production && \
    npm rebuild sqlite3 --build-from-source

# Copiar código do backend
COPY backend/ ./

# Copiar frontend buildado para pasta public do backend
COPY --from=frontend-builder /app/frontend/dist ./public

# Criar diretórios necessários
RUN mkdir -p uploads/logos uploads/certificates logs

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=8080

# Expor porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usar tini como entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Iniciar aplicação
CMD ["node", "server.js"]
