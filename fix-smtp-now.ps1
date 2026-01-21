# Script para limpar SMTP do banco e testar email
# Execute este arquivo: .\fix-smtp-now.ps1

Write-Host "=" -ForegroundColor Cyan
Write-Host "🧹 LIMPANDO SMTP DO BANCO E TESTANDO EMAIL" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Passo 1: Limpar SMTP do banco
Write-Host "📤 Passo 1: Conectando ao Fly.io..." -ForegroundColor Green
cd "C:\Users\HP\Desktop\Lumini I.A"

Write-Host "🧹 Passo 2: Limpando configurações SMTP antigas do banco..." -ForegroundColor Green
$clearResult = fly ssh console -C "node -e `"const {Sequelize}=require('sequelize');const s=new Sequelize({dialect:'sqlite',storage:'./database.sqlite',logging:false});(async()=>{await s.authenticate();const r=await s.query('DELETE FROM SystemConfigs WHERE key IN (''SMTP_HOST'',''SMTP_PORT'',''SMTP_USER'',''SMTP_PASS'',''SMTP_SECURE'',''SMTP_FROM'')');console.log('✅ Removido:',r[0],'configs');process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});`""

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SMTP limpo com sucesso!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Houve um problema, mas continuando..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📧 Passo 3: Configuração ativa agora:" -ForegroundColor Green
Write-Host "   Host: smtp.hostinger.com" -ForegroundColor White
Write-Host "   Port: 587" -ForegroundColor White
Write-Host "   User: contato@luminiiadigital.com.br" -ForegroundColor White
Write-Host ""

Write-Host "🎉 PRONTO! Agora teste o email de recuperação de senha!" -ForegroundColor Green
Write-Host ""
Write-Host "👉 Acesse: https://www.luminiiadigital.com.br/forgot-password" -ForegroundColor Cyan
Write-Host "👉 Digite: sundaragopaldas@gmail.com" -ForegroundColor Cyan
Write-Host "👉 Verifique seu email (e SPAM)!" -ForegroundColor Cyan
Write-Host ""

pause
