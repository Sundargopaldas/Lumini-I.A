Write-Host "🚀 Instalando dependências das melhorias..." -ForegroundColor Cyan
Write-Host ""

# Instalar dependências de produção
Write-Host "📦 Instalando dependências de produção..." -ForegroundColor Yellow
npm install redis

# Instalar dependências de desenvolvimento
Write-Host "📦 Instalando dependências de desenvolvimento..." -ForegroundColor Yellow
npm install --save-dev jest supertest @types/jest

Write-Host ""
Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Configure o .env com ENCRYPTION_KEY e LOG_LEVEL"
Write-Host "2. (Opcional) Configure REDIS_URL se quiser usar Redis"
Write-Host "3. Execute: npm test"
Write-Host "4. Execute: npm start"
Write-Host ""
Write-Host "🎉 Pronto para usar!" -ForegroundColor Green
