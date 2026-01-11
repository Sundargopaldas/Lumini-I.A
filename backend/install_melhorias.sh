#!/bin/bash

echo "🚀 Instalando dependências das melhorias..."
echo ""

# Instalar dependências de produção
echo "📦 Instalando dependências de produção..."
npm install redis

# Instalar dependências de desenvolvimento
echo "📦 Instalando dependências de desenvolvimento..."
npm install --save-dev jest supertest @types/jest

echo ""
echo "✅ Dependências instaladas com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure o .env com ENCRYPTION_KEY e LOG_LEVEL"
echo "2. (Opcional) Configure REDIS_URL se quiser usar Redis"
echo "3. Execute: npm test"
echo "4. Execute: npm start"
echo ""
echo "🎉 Pronto para usar!"
