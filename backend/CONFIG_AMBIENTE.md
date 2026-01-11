# ⚙️ CONFIGURAÇÃO DE AMBIENTE - LUMINI I.A

## 📝 Arquivo `.env` do Backend

Crie o arquivo `backend/.env` com estas variáveis:

```env
# ===== ENVIRONMENT =====
NODE_ENV=production
PORT=8080

# ===== DOMAIN =====
FRONTEND_URL=https://luminiiadigital.com.br
BACKEND_URL=https://api.luminiiadigital.com.br

# ===== DATABASE =====
# PostgreSQL (Recomendado para produção)
DATABASE_URL=postgresql://usuario:senha@host:5432/lumini_ia

# ===== SECURITY =====
# Gerar com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=COLE_AQUI_UM_SECRET_FORTE_64_CARACTERES

# ===== EMAIL HOSTINGER =====
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=contato@luminiiadigital.com.br
EMAIL_PASS=SUA_SENHA_DO_EMAIL
EMAIL_FROM="Lumini I.A <contato@luminiiadigital.com.br>"
SUPPORT_EMAIL=contato@luminiiadigital.com.br

# ===== GEMINI AI =====
GEMINI_API_KEY=SUA_CHAVE_GEMINI

# ===== STRIPE (KEYS LIVE!) =====
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ===== NUVEM FISCAL =====
NUVEM_FISCAL_CLIENT_ID=seu_id
NUVEM_FISCAL_CLIENT_SECRET=seu_secret
NUVEM_FISCAL_MOCK=false
```

---

## 📝 Arquivo `.env` do Frontend

Crie o arquivo `frontend/.env` com estas variáveis:

```env
# Backend API
VITE_API_URL=https://api.luminiiadigital.com.br/api

# Environment
VITE_ENV=production

# Stripe (chave pública LIVE)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 🔐 Como Gerar JWT_SECRET

Execute no terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copie o resultado e cole em `JWT_SECRET`.

---

## 📧 Configurações SMTP da Hostinger

### Onde Encontrar no Painel Hostinger:
1. Login em: https://hpanel.hostinger.com
2. **Emails > Email Accounts**
3. Clique em **Manage** ao lado de `contato@luminiiadigital.com.br`
4. Role até **Configuration**

### Configurações:
- **Host:** smtp.hostinger.com
- **Porta:** 587 (STARTTLS recomendado)
- **Segurança:** STARTTLS
- **Usuário:** contato@luminiiadigital.com.br
- **Senha:** A senha que você criou para o email

---

## ✅ Testar Configuração de Email

```bash
cd backend
node -e "
const { sendPasswordResetEmail } = require('./services/EmailService');
const user = { email: 'SEU_EMAIL_PESSOAL@gmail.com', name: 'Teste' };
const link = 'https://luminiiadigital.com.br/test';
sendPasswordResetEmail(user, link).then(() => console.log('Email enviado!')).catch(e => console.error(e));
"
```

---

## 🚀 Deploy em Plataformas

### Render.com
Na página de configuração do Web Service, adicione cada variável em:
**Environment > Add Environment Variable**

### Vercel
```bash
vercel env add VITE_API_URL
# Cole o valor: https://api.luminiiadigital.com.br/api
```

### Railway
No dashboard do projeto:
**Variables > New Variable** e adicione uma por uma.

---

## ⚠️ IMPORTANTE

- ✅ **NUNCA** commite o arquivo `.env` no Git
- ✅ O `.env` já está no `.gitignore`
- ✅ Use `.env.example` para documentar variáveis (sem valores reais)
- ✅ Em produção, use keys LIVE do Stripe (sk_live_, pk_live_)
- ✅ Mantenha o `JWT_SECRET` seguro e único por ambiente

