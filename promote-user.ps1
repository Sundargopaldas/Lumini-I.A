# Script PowerShell para promover usuário via API

$url = "https://lumini-i-a.fly.dev/api/admin/promote-to-premium"
$email = "contato@luminiiadigital.com.br"

# Você precisa estar logado como admin
# Cole aqui seu token JWT (do localStorage quando logado)
$token = "SEU_TOKEN_AQUI"

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

$body = @{
    email = $email
} | ConvertTo-Json

Write-Host "🔄 Promovendo usuário: $email" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
    Write-Host "✅ SUCESSO!" -ForegroundColor Green
    Write-Host $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ ERRO:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
