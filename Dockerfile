# ========================================
# LUMINI I.A - Dockerfile para Fly.io
# ========================================

# Stage 1: Build do Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copiar package.json do frontend
COPY frontend/package*.json ./

# Instalar dependências do frontend
RUN echo "=== INSTALANDO DEPENDÊNCIAS DO FRONTEND ===" && \
    npm ci && \
    echo "=== DEPENDÊNCIAS INSTALADAS ===" && \
    ls -la node_modules/ | head -20

# Copiar código do frontend
COPY frontend/ ./

# Build do frontend (gera pasta dist/)
RUN echo "=== INICIANDO BUILD DO FRONTEND ===" && \
    npm run build && \
    echo "=== BUILD CONCLUÍDO ===" && \
    echo "=== ARQUIVOS GERADOS EM dist/ ===" && \
    ls -la dist/ && \
    echo "=== VERIFICANDO INDEX.HTML ===" && \
    cat dist/index.html | head -20

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

# DEBUG: Verificar se os arquivos foram copiados
RUN echo "=== VERIFICANDO ARQUIVOS DO FRONTEND ===" && \
    ls -la ./public/ && \
    echo "=== ARQUIVOS DENTRO DE ASSETS (se existir) ===" && \
    (ls -la ./public/assets/ || echo "Pasta assets não existe") && \
    echo "=== VERIFICANDO INDEX.HTML ===" && \
    if [ -f ./public/index.html ]; then \
        echo "✅ index.html EXISTE!"; \
        echo "=== PRIMEIRAS LINHAS DO INDEX.HTML ==="; \
        head -20 ./public/index.html; \
    else \
        echo "❌ index.html NAO EXISTE!"; \
        echo "=== LISTANDO TUDO EM ./public RECURSIVAMENTE ==="; \
        find ./public -type f; \
    fi

# Criar diretórios necessários
RUN mkdir -p uploads/logos uploads/certificates logs

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=8080

# Expor porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usar tini como entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Iniciar aplicação
CMD ["node", "server.js"]
