# ✅ CHECKLIST RÁPIDO DE DEPLOY - LUMINI I.A

## 🎯 DOMÍNIO E EMAIL CONFIGURADOS
- [x] Domínio registrado: **luminiiadigital.com.br** (Register.br)
- [x] Email criado: **contato@luminiiadigital.com.br** (Hostinger)

---

## 📋 FASE 1: PREPARAÇÃO (30-60 min)

### 1.1 Configurar Backend (.env)
```bash
cd backend
# Criar arquivo .env com as configurações de CONFIG_AMBIENTE.md
```

**Variáveis críticas:**
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` (gerar com crypto)
- [ ] `EMAIL_HOST=smtp.hostinger.com`
- [ ] `EMAIL_USER=contato@luminiiadigital.com.br`
- [ ] `EMAIL_PASS=...` (senha do email)
- [ ] `FRONTEND_URL=https://luminiiadigital.com.br`
- [ ] `DATABASE_URL=...` (PostgreSQL)
- [ ] `GEMINI_API_KEY=...`
- [ ] `STRIPE_SECRET_KEY=sk_live_...` (LIVE KEY!)

### 1.2 Testar Configuração
```bash
cd backend
node setup_production.js
```

### 1.3 Configurar Frontend (.env)
```bash
cd frontend
# Criar arquivo .env
```

**Variáveis:**
- [ ] `VITE_API_URL=https://api.luminiiadigital.com.br/api`
- [ ] `VITE_ENV=production`
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...`

---

## 📋 FASE 2: DEPLOY (1-2 horas)

### Opção A: Render.com (Recomendado)

#### Backend
- [ ] Criar conta em https://render.com
- [ ] New > Web Service
- [ ] Conectar repositório GitHub
- [ ] Configurar:
  - Build: `cd backend && npm install`
  - Start: `cd backend && npm start`
  - Environment: Node
- [ ] Adicionar **todas** variáveis .env
- [ ] Deploy

#### Frontend
- [ ] New > Static Site
- [ ] Build: `cd frontend && npm install && npm run build`
- [ ] Publish: `frontend/dist`
- [ ] Adicionar variáveis .env
- [ ] Deploy

### Opção B: Vercel + Railway
```bash
# Frontend (Vercel)
cd frontend
npm install -g vercel
vercel --prod

# Backend (Railway)
# Usar interface web
```

---

## 📋 FASE 3: DNS (2-48 horas propagação)

### No Register.br

**1. Apontar domínio para frontend:**
```
Tipo: A
Nome: @
Valor: [IP do Render/Vercel]
```

**2. Subdomain para API:**
```
Tipo: A
Nome: api
Valor: [IP do backend]
```

**3. WWW (opcional):**
```
Tipo: CNAME
Nome: www
Valor: luminiiadigital.com.br
```

**4. MX Records (email):**
```
Tipo: MX
Prioridade: 10
Valor: mx1.hostinger.com

Tipo: MX
Prioridade: 20
Valor: mx2.hostinger.com
```

**5. SPF (melhor entrega):**
```
Tipo: TXT
Nome: @
Valor: v=spf1 include:_spf.hostinger.com ~all
```

---

## 📋 FASE 4: SSL/HTTPS (Automático)

- [ ] Render/Vercel configuram HTTPS automaticamente
- [ ] Aguardar emissão do certificado (5-10 min)
- [ ] Testar: https://luminiiadigital.com.br
- [ ] Testar: https://api.luminiiadigital.com.br

---

## 📋 FASE 5: TESTES EM PRODUÇÃO

### Backend API
```bash
# Health check
curl https://api.luminiiadigital.com.br/

# Login
curl -X POST https://api.luminiiadigital.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"Teste@123"}'
```

### Frontend
- [ ] Acessar https://luminiiadigital.com.br
- [ ] Criar conta
- [ ] Fazer login
- [ ] Adicionar transação
- [ ] Testar IA (Gemini)
- [ ] Testar upgrade (Stripe)

### Email
- [ ] Solicitar reset de senha
- [ ] Verificar recebimento no email
- [ ] Clicar no link e resetar senha

---

## 📋 FASE 6: MONITORAMENTO

### Configurar Uptime Monitor
- [ ] Criar conta em https://uptimerobot.com
- [ ] Adicionar monitor: https://luminiiadigital.com.br
- [ ] Adicionar monitor: https://api.luminiiadigital.com.br
- [ ] Configurar alertas por email

### Logs
```bash
# Render: Ver logs no dashboard
# Railway: Ver logs no dashboard
```

---

## 📋 FASE 7: SEGURANÇA FINAL

- [ ] HTTPS ativo
- [ ] JWT_SECRET forte (64+ caracteres)
- [ ] CORS configurado
- [ ] Rate limiting ativo
- [ ] Stripe em modo LIVE
- [ ] Backup do banco configurado

---

## 🎉 LANÇAMENTO!

- [ ] Anunciar nas redes sociais
- [ ] Enviar para primeiros usuários
- [ ] Monitorar logs nas primeiras 24h
- [ ] Estar disponível para ajustes

---

## 📞 SUPORTE

**Problemas comuns:**

### "ERR_NAME_NOT_RESOLVED"
➜ DNS ainda não propagou. Aguarde até 48h.

### "Cannot connect to database"
➜ Verifique DATABASE_URL no .env do Render.

### "Emails não chegam"
➜ Verifique SMTP no Hostinger e SPF no DNS.

### "Stripe error"
➜ Use chaves LIVE (sk_live_, pk_live_) em produção.

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **Deploy:** `GUIA_DEPLOY_PRODUCAO.md`
- **Configuração:** `backend/CONFIG_AMBIENTE.md`
- **Análise:** `ANALISE_COMPLETA_LUMINI_IA.md`

---

**Boa sorte! 🚀**

