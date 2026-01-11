# 🚀 GUIA DE DEPLOY - LUMINI I.A
**Domínio:** luminiiadigital.com.br  
**Email:** contato@luminiiadigital.com.br  
**Hospedagem Email:** Hostinger

---

## 📋 CHECKLIST PRÉ-DEPLOY

### ✅ Já Configurado
- [x] Domínio registrado (luminiiadigital.com.br)
- [x] Email profissional (contato@luminiiadigital.com.br)
- [x] Correções de segurança aplicadas
- [x] Rate limiting implementado
- [x] Validação de senha forte

### ⏳ Pendente
- [ ] Configurar DNS
- [ ] Configurar SMTP da Hostinger
- [ ] Configurar variáveis de ambiente de produção
- [ ] Fazer deploy do backend
- [ ] Fazer deploy do frontend
- [ ] Configurar SSL/HTTPS
- [ ] Testar em produção

---

## 📧 PARTE 1: CONFIGURAR EMAIL SMTP (HOSTINGER)

### 1.1 Obter Credenciais SMTP

**Acesse o painel da Hostinger:**
1. Vá em **Email > Email Accounts**
2. Clique em **Manage** ao lado de `contato@luminiiadigital.com.br`
3. Role até **Configuration** ou **Email Client Configuration**

**Configurações SMTP da Hostinger:**
```
Host: smtp.hostinger.com
Porta: 587 (STARTTLS) ou 465 (SSL)
Segurança: STARTTLS (recomendado)
Usuário: contato@luminiiadigital.com.br
Senha: [Sua senha do email]
```

### 1.2 Configurar no Backend

**Arquivo:** `backend/.env` (PRODUÇÃO)

```env
# ===== EMAIL CONFIGURATION (HOSTINGER) =====
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_SECURE=false  # false para STARTTLS (587), true para SSL (465)
EMAIL_USER=contato@luminiiadigital.com.br
EMAIL_PASS=SUA_SENHA_EMAIL_AQUI
EMAIL_FROM="Lumini I.A <contato@luminiiadigital.com.br>"

# Email de suporte (para receber notificações)
SUPPORT_EMAIL=contato@luminiiadigital.com.br
```

### 1.3 Testar Email

Execute este comando para testar:
```bash
cd backend
node -e "require('./services/EmailService').sendCancellationEmail({email: 'seu-email-pessoal@gmail.com', name: 'Teste'}, 'teste')"
```

---

## 🌐 PARTE 2: CONFIGURAR DOMÍNIO E DNS

### 2.1 Configurar DNS no Register.br

**Acesse:** https://registro.br/

**Adicionar registros DNS:**

#### Para Backend (API)
```
Tipo: A
Nome: api
Valor: [IP DO SEU SERVIDOR BACKEND]
TTL: 3600
```

#### Para Frontend
```
Tipo: A
Nome: @
Valor: [IP DO SEU SERVIDOR FRONTEND/CDN]
TTL: 3600

Tipo: A
Nome: www
Valor: [IP DO SEU SERVIDOR FRONTEND/CDN]
TTL: 3600
```

#### Para Email (se necessário)
```
Tipo: MX
Nome: @
Valor: mx1.hostinger.com
Prioridade: 10

Tipo: MX
Nome: @
Valor: mx2.hostinger.com
Prioridade: 20
```

#### SPF (Melhorar entrega de emails)
```
Tipo: TXT
Nome: @
Valor: v=spf1 include:_spf.hostinger.com ~all
TTL: 3600
```

### 2.2 Propagação DNS
- ⏰ Aguarde 24-48h para propagação completa
- 🧪 Teste com: `nslookup luminiiadigital.com.br`

---

## ⚙️ PARTE 3: VARIÁVEIS DE AMBIENTE COMPLETAS

### 3.1 Backend - Produção (.env)

```env
# ===== ENVIRONMENT =====
NODE_ENV=production
PORT=8080

# ===== DOMAIN =====
FRONTEND_URL=https://luminiiadigital.com.br
BACKEND_URL=https://api.luminiiadigital.com.br

# ===== DATABASE =====
# PostgreSQL (Render/Railway/Supabase)
DATABASE_URL=postgresql://usuario:senha@host:5432/lumini_ia

# Ou MySQL (se preferir)
# DB_HOST=seu-host-mysql.com
# DB_PORT=3306
# DB_USER=usuario
# DB_PASS=senha
# DB_NAME=lumini_ia

# ===== SECURITY =====
JWT_SECRET=GERE_UM_SEGREDO_FORTE_AQUI_64_CARACTERES_MINIMO

# ===== EMAIL (HOSTINGER) =====
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=contato@luminiiadigital.com.br
EMAIL_PASS=SUA_SENHA_EMAIL_AQUI
EMAIL_FROM="Lumini I.A <contato@luminiiadigital.com.br>"
SUPPORT_EMAIL=contato@luminiiadigital.com.br

# ===== GOOGLE GEMINI AI =====
GEMINI_API_KEY=SUA_CHAVE_GEMINI_AQUI

# ===== STRIPE (PAGAMENTOS) =====
STRIPE_SECRET_KEY=sk_live_...  # Live key
STRIPE_PUBLISHABLE_KEY=pk_live_...  # Live key
STRIPE_WEBHOOK_SECRET=whsec_...

# ===== NUVEM FISCAL (NF-E) =====
NUVEM_FISCAL_CLIENT_ID=seu_client_id
NUVEM_FISCAL_CLIENT_SECRET=seu_client_secret
NUVEM_FISCAL_MOCK=false  # false em produção

# ===== OPEN FINANCE (PLUGGY) =====
PLUGGY_CLIENT_ID=seu_client_id
PLUGGY_CLIENT_SECRET=seu_client_secret

# ===== HOTMART INTEGRATION =====
HOTMART_CLIENT_ID=seu_client_id
HOTMART_CLIENT_SECRET=seu_client_secret
HOTMART_BASIC_AUTH=seu_basic_auth

# ===== YOUTUBE API =====
YOUTUBE_API_KEY=sua_chave_youtube
```

### 3.2 Gerar JWT_SECRET Forte

**No terminal:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copie o resultado e use como `JWT_SECRET`.

### 3.3 Frontend - Produção (.env)

```env
# Backend API URL
VITE_API_URL=https://api.luminiiadigital.com.br/api

# Environment
VITE_ENV=production

# Stripe Publishable Key (Live)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 🚀 PARTE 4: DEPLOY

### 4.1 Opção A: Render.com (RECOMENDADO - Gratuito)

#### Backend
1. Acesse https://render.com
2. **New > Web Service**
3. Conecte seu repositório GitHub
4. Configurações:
   - **Name:** lumini-ia-backend
   - **Environment:** Node
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Environment Variables:** Cole todas as variáveis do .env acima

#### Frontend
1. **New > Static Site**
2. Configurações:
   - **Name:** lumini-ia-frontend
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
   - **Environment Variables:** Cole as variáveis do frontend

### 4.2 Opção B: Vercel (Frontend) + Railway (Backend)

#### Frontend no Vercel
```bash
cd frontend
npm install -g vercel
vercel --prod
```

#### Backend no Railway
1. Acesse https://railway.app
2. **New Project > Deploy from GitHub**
3. Selecione o repositório
4. Configure variáveis de ambiente

### 4.3 Opção C: VPS (DigitalOcean, AWS, etc)

**Instalar Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Instalar PM2:**
```bash
sudo npm install -g pm2
```

**Deploy Backend:**
```bash
cd /var/www/lumini-ia/backend
npm install --production
pm2 start server.js --name lumini-backend
pm2 save
pm2 startup
```

**Nginx para Frontend:**
```nginx
server {
    listen 80;
    server_name luminiiadigital.com.br www.luminiiadigital.com.br;
    
    root /var/www/lumini-ia/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Configurar SSL (Certbot):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d luminiiadigital.com.br -d www.luminiiadigital.com.br
```

---

## 🔒 PARTE 5: SEGURANÇA EM PRODUÇÃO

### 5.1 Checklist de Segurança

- [ ] `JWT_SECRET` forte e único (64+ caracteres)
- [ ] HTTPS configurado (SSL)
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Senhas do email não expostas
- [ ] `.env` no `.gitignore`
- [ ] Headers de segurança (Helmet)
- [ ] Backups do banco configurados

### 5.2 Configurar HTTPS Redirect

**Adicionar no server.js (backend):**
```javascript
// Redirect HTTP to HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

---

## 🧪 PARTE 6: TESTES PÓS-DEPLOY

### 6.1 Checklist de Testes

#### Backend API
```bash
# Health Check
curl https://api.luminiiadigital.com.br/

# Registro de usuário
curl -X POST https://api.luminiiadigital.com.br/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"teste","email":"teste@teste.com","password":"Teste@123"}'

# Login
curl -X POST https://api.luminiiadigital.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"Teste@123"}'
```

#### Frontend
- [ ] Acessar https://luminiiadigital.com.br
- [ ] Criar conta
- [ ] Fazer login
- [ ] Adicionar transação
- [ ] Testar IA
- [ ] Testar pagamento

#### Email
- [ ] Testar email de boas-vindas
- [ ] Testar reset de senha
- [ ] Verificar recebimento no Gmail/Outlook

---

## 📊 PARTE 7: MONITORAMENTO

### 7.1 Configurar Uptime Monitor

**Opções gratuitas:**
- **UptimeRobot:** https://uptimerobot.com
- **Pingdom:** https://www.pingdom.com
- **StatusCake:** https://www.statuscake.com

**Monitorar:**
- `https://luminiiadigital.com.br` (Frontend)
- `https://api.luminiiadigital.com.br` (Backend)

### 7.2 Logs

**PM2 Logs:**
```bash
pm2 logs lumini-backend
pm2 logs lumini-backend --lines 100
```

**Render Logs:**
- Acessar dashboard > Logs

---

## 🔄 PARTE 8: ATUALIZAÇÕES

### 8.1 Deploy de Atualizações

**Com Git:**
```bash
git add .
git commit -m "Atualização X"
git push origin main
```

**Render/Vercel:** Faz deploy automático  
**VPS/PM2:**
```bash
git pull
cd backend && npm install
pm2 restart lumini-backend
```

---

## 📞 PARTE 9: SUPORTE E BACKUP

### 9.1 Backup do Banco

**Script de backup automático (Cron):**
```bash
# Adicionar ao crontab (crontab -e)
0 3 * * * /usr/bin/pg_dump lumini_ia > /backups/db_$(date +\%Y\%m\%d).sql
```

### 9.2 Contatos de Suporte

- **Domínio:** https://registro.br
- **Email/Hosting:** https://hostinger.com.br/cpanel
- **Render:** https://render.com
- **Stripe:** https://stripe.com/br

---

## ✅ PRÓXIMOS PASSOS

1. **Agora:** Configurar SMTP da Hostinger
2. **Hoje:** Fazer deploy do backend (Render)
3. **Hoje:** Fazer deploy do frontend (Vercel/Render)
4. **Amanhã:** Configurar DNS no Register.br
5. **2-3 dias:** Aguardar propagação DNS
6. **Semana 1:** Testes completos em produção
7. **Semana 2:** Monitoramento e ajustes

---

## 🎯 COMANDOS RÁPIDOS

```bash
# Gerar JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Testar API local
curl http://localhost:8080/

# Ver logs PM2
pm2 logs lumini-backend --lines 50

# Restart PM2
pm2 restart lumini-backend

# Check DNS
nslookup luminiiadigital.com.br
dig luminiiadigital.com.br

# Test SSL
openssl s_client -connect luminiiadigital.com.br:443
```

---

**Boa sorte com o deploy! 🚀**

