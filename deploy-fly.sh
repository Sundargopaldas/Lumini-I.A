#!/bin/bash

# Script de Deploy Rápido para Fly.io
# Execute: bash deploy-fly.sh

echo "🚀 DEPLOY LUMINI I.A - FLY.IO"
echo "================================"
echo ""

# Verificar se Fly CLI está instalado
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI não encontrado!"
    echo "   Instale com: curl -L https://fly.io/install.sh | sh"
    exit 1
fi

echo "✅ Fly CLI encontrado"
echo ""

# Verificar se está logado
if ! fly status &> /dev/null; then
    echo "🔐 Fazendo login no Fly.io..."
    fly auth login
fi

echo "✅ Autenticado no Fly.io"
echo ""

# Verificar se app existe
if ! fly status &> /dev/null; then
    echo "📝 Criando novo app..."
    fly launch --no-deploy
    echo ""
fi

echo "📦 Fazendo build e deploy..."
fly deploy

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "🌐 Sua API está em: https://lumini-ia-backend.fly.dev"
echo ""
echo "📋 Próximos passos:"
echo "   1. Configure variáveis: fly secrets set JWT_SECRET='...'"
echo "   2. Conecte banco: fly postgres attach"
echo "   3. Teste: curl https://lumini-ia-backend.fly.dev/"
echo ""
