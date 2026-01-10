# CHECKLIST DE DEPLOY - SÁBADO (LUA MINGUANTE)
# Instruções: Copiar os valores abaixo (que pegaremos do seu .env local) para a aba "Variables" no Railway.

# --- SISTEMA ---
NODE_ENV=production
PORT=8080
JWT_SECRET= (Copiaremos do seu .env)
SESSION_SECRET= (Copiaremos do seu .env)

# --- BANCO DE DADOS ---
# O Railway cria o DATABASE_URL automaticamente, não precisamos colar.

# --- INTELIGÊNCIA ARTIFICIAL ---
GEMINI_API_KEY= (Copiaremos do seu .env)

# --- PAGAMENTOS ---
STRIPE_SECRET_KEY= (Copiaremos do seu .env)
STRIPE_WEBHOOK_SECRET= (Opcional por enquanto)

# --- EMAIL (HOSTINGER) ---
# Aqui usaremos a senha que você definiu na Hostinger
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=contato@luminiiadigital.com.br
SMTP_PASS= (Sua senha da Hostinger)
EMAIL_FROM="Equipe Lumini I.A" <contato@luminiiadigital.com.br>
