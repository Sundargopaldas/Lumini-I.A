# Script de Deploy Rápido para Fly.io (PowerShell/Windows)
# Execute: .\deploy-fly.ps1

Write-Host "🚀 DEPLOY LUMINI I.A - FLY.IO" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Fly CLI está instalado
try {
    fly version | Out-Null
    Write-Host "✅ Fly CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Fly CLI não encontrado!" -ForegroundColor Red
    Write-Host "   Instale com: iwr https://fly.io/install.ps1 -useb | iex" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verificar se está logado
try {
    fly status 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "🔐 Fazendo login no Fly.io..." -ForegroundColor Yellow
        fly auth login
    }
} catch {
    Write-Host "🔐 Fazendo login no Fly.io..." -ForegroundColor Yellow
    fly auth login
}

Write-Host "✅ Autenticado no Fly.io" -ForegroundColor Green
Write-Host ""

# Verificar se app existe
try {
    fly status 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "📝 Criando novo app..." -ForegroundColor Yellow
        fly launch --no-deploy
        Write-Host ""
    }
} catch {
    Write-Host "📝 Criando novo app..." -ForegroundColor Yellow
    fly launch --no-deploy
    Write-Host ""
}

Write-Host "📦 Fazendo build e deploy..." -ForegroundColor Cyan
fly deploy

Write-Host ""
Write-Host "✅ Deploy concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Sua API está em: https://lumini-ia-backend.fly.dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Configure variáveis:" -ForegroundColor White
Write-Host "      fly secrets set JWT_SECRET='...'" -ForegroundColor Gray
Write-Host "   2. Conecte banco:" -ForegroundColor White
Write-Host "      fly postgres create --name lumini-db" -ForegroundColor Gray
Write-Host "      fly postgres attach lumini-db" -ForegroundColor Gray
Write-Host "   3. Teste:" -ForegroundColor White
Write-Host "      curl https://lumini-ia-backend.fly.dev/" -ForegroundColor Gray
Write-Host ""
