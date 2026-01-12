# Script de Deploy Rápido para Fly.io (PowerShell/Windows)
# Execute: .\deploy-fly.ps1

Write-Host "🚀 DEPLOY LUMINI I.A - FLY.IO (V4 - COM FRONTEND)" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Fly CLI está instalado
try {
    $flyVersion = fly version 2>&1 | Out-String
    Write-Host "✅ Fly CLI encontrado: $($flyVersion.Trim())" -ForegroundColor Green
} catch {
    Write-Host "❌ Fly CLI não encontrado!" -ForegroundColor Red
    Write-Host "   Instale com: iwr https://fly.io/install.ps1 -useb | iex" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verificar se está logado
try {
    $status = fly status 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        Write-Host "🔐 Fazendo login no Fly.io..." -ForegroundColor Yellow
        fly auth login
    } else {
        Write-Host "✅ Autenticado no Fly.io" -ForegroundColor Green
    }
} catch {
    Write-Host "🔐 Fazendo login no Fly.io..." -ForegroundColor Yellow
    fly auth login
}

Write-Host ""

# Verificar se app existe
try {
    $appStatus = fly status 2>&1 | Out-String
    if ($appStatus -match "running|stopped") {
        Write-Host "✅ App 'lumini-i-a' encontrado" -ForegroundColor Green
    }
} catch {
    Write-Host "📝 App não encontrado. Criando..." -ForegroundColor Yellow
    fly launch --no-deploy
    Write-Host ""
}

Write-Host ""

# Verificar variáveis de ambiente críticas
Write-Host "🔍 Verificando variáveis de ambiente..." -ForegroundColor Cyan
$secrets = fly secrets list 2>&1 | Out-String

$hasNodeEnv = $secrets -match "NODE_ENV"
$hasJWT = $secrets -match "JWT_SECRET"

if (-not $hasNodeEnv) {
    Write-Host "⚠️  NODE_ENV não configurado!" -ForegroundColor Yellow
    Write-Host "   Execute: fly secrets set NODE_ENV=production" -ForegroundColor Gray
}

if (-not $hasJWT) {
    Write-Host "⚠️  JWT_SECRET não configurado!" -ForegroundColor Yellow
    Write-Host "   Execute: fly secrets set JWT_SECRET='seu_secret_aqui'" -ForegroundColor Gray
}

if ($hasNodeEnv -and $hasJWT) {
    Write-Host "✅ Variáveis críticas configuradas" -ForegroundColor Green
}

Write-Host ""

# Perguntar se deseja continuar
Write-Host "📦 Pronto para fazer deploy. Pressione Enter para continuar ou Ctrl+C para cancelar..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "🔨 Fazendo build e deploy..." -ForegroundColor Cyan
Write-Host ""

fly deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Sua aplicação está em:" -ForegroundColor Cyan
    Write-Host "   https://lumini-i-a.fly.dev" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
    Write-Host "   1. Abrir app: fly open" -ForegroundColor White
    Write-Host "   2. Ver logs: fly logs" -ForegroundColor White
    Write-Host "   3. Ver status: fly status" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Verificando se o frontend foi incluído..." -ForegroundColor Cyan
    Write-Host "   Procure nos logs por: '✅ index.html EXISTE!'" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deploy falhou! Veja os erros acima." -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Dicas:" -ForegroundColor Yellow
    Write-Host "   - Execute 'fly logs' para ver detalhes" -ForegroundColor White
    Write-Host "   - Verifique o FLY_DEPLOY_INSTRUCTIONS.md" -ForegroundColor White
    Write-Host ""
}

