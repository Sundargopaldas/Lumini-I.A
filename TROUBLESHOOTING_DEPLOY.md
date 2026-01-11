# 🔧 TROUBLESHOOTING - Problemas de Deploy

## 🚨 ERROS COMUNS E SOLUÇÕES

### ❌ RENDER - "Build failed: Cannot find module"

**Erro típico:**
```
Error: Cannot find module './backend/server.js'
Module not found: Can't resolve './backend/package.json'
```

**Causa:** Render tenta buildar da raiz, mas o código está em `backend/`

**Solução 1 - Configurar Build Command:**
```
Build Command: cd backend && npm install
Start Command: cd backend && npm start
```

**Solução 2 - Adicionar Root Path:**
No Render Dashboard:
- Settings > Build & Deploy
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

---

### ❌ RAILWAY - "Application failed to respond"

**Erro típico:**
```
Application failed to respond on port 8080
Connection timeout
```

**Causa:** Railway precisa que a aplicação use a variável `PORT` dinâmica

**Solução - Verificar server.js:**
```javascript
// ✅ Correto
const PORT = process.env.PORT || 8080;

// ❌ Errado
const PORT = 8080;
```

Seu `server.js` **já está correto**, mas Railway precisa desta configuração:

**No Railway:**
1. Settings > Variables
2. Adicionar: `PORT=8080` (Railway sobrescreve automaticamente)

---

### ❌ "Database connection refused"

**Erro típico:**
```
Error: connect ECONNREFUSED
getaddrinfo ENOTFOUND
```

**Causa:** DATABASE_URL incorreto ou banco não provisionado

**Soluções:**

**Render:**
```bash
# Criar PostgreSQL no Render
1. Dashboard > New > PostgreSQL
2. Copiar Internal Database URL
3. Adicionar em Environment Variables: DATABASE_URL
```

**Railway:**
```bash
# Railway provisiona automaticamente
1. New > Database > PostgreSQL
2. Conectar ao seu service
3. DATABASE_URL é criado automaticamente
```

**Fly.io:**
```bash
fly postgres create --name lumini-db
fly postgres attach lumini-db
```

---

### ❌ "JWT_SECRET is not defined"

**Erro típico:**
```
Error: FATAL: JWT_SECRET is not defined!
Server configuration error
```

**Causa:** Variável de ambiente não configurada

**Solução:**

**Gerar secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Render:**
- Environment > Add Environment Variable
- Key: `JWT_SECRET`
- Value: (cole o secret gerado)

**Railway:**
- Variables > New Variable
- `JWT_SECRET` = (seu secret)

**Fly.io:**
```bash
fly secrets set JWT_SECRET="seu_secret_aqui"
```

---

### ❌ "Node version mismatch"

**Erro típico:**
```
npm ERR! engine Unsupported engine
Node version 14.x required, but 16.x found
```

**Solução - Especificar versão do Node:**

**package.json (backend):**
```json
{
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

---

### ❌ "npm install failed - Permission denied"

**Erro típico:**
```
Error: EACCES: permission denied, mkdir '/app/node_modules'
```

**Solução - Usar npm ci ao invés de npm install:**

**Build Command:**
```
cd backend && npm ci --only=production
```

---

### ❌ "Module did not self-register" (SQLite)

**Erro típico:**
```
Error: Module did not self-register
/app/backend/node_modules/sqlite3/
```

**Causa:** SQLite3 precisa de rebuild em produção

**Solução - USAR POSTGRESQL em produção:**

1. Remover SQLite de produção
2. Usar DATABASE_URL (PostgreSQL)
3. Nosso código já detecta automaticamente!

---

### ❌ "CORS policy error"

**Erro típico:**
```
Access to fetch at 'https://api...' from origin 'https://lumini...' 
has been blocked by CORS policy
```

**Solução - Verificar FRONTEND_URL:**

```bash
# Adicionar variável de ambiente
FRONTEND_URL=https://luminiiadigital.com.br
```

Nosso `server.js` já está configurado corretamente!

---

### ❌ "Memory limit exceeded"

**Erro típico:**
```
Error: JavaScript heap out of memory
FATAL ERROR: Reached heap limit
```

**Solução - Aumentar memória Node:**

**package.json scripts:**
```json
{
  "scripts": {
    "start": "node --max-old-space-size=512 server.js"
  }
}
```

**Ou upgrade do plano:**
- Render: Starter → Standard
- Railway: Developer → Team
- Fly.io: Adicionar mais RAM

---

### ❌ "502 Bad Gateway" ou "503 Service Unavailable"

**Causas possíveis:**

1. **Aplicação não iniciou:** Verificar logs
2. **Porta errada:** Usar `process.env.PORT`
3. **Timeout:** Aplicação demora muito para iniciar

**Solução:**
```bash
# Ver logs
Render: Dashboard > Logs
Railway: View Logs
Fly.io: fly logs

# Verificar health check
curl https://sua-api.com/
```

---

## ✅ CHECKLIST PRÉ-DEPLOY

Antes de fazer deploy, verifique:

- [ ] `process.env.PORT` configurado no server.js ✅ (já está)
- [ ] `.gitignore` contém `node_modules`, `.env` ✅
- [ ] `package.json` tem `engines` definido
- [ ] Todas variáveis de ambiente configuradas
- [ ] DATABASE_URL aponta para PostgreSQL (não SQLite)
- [ ] CORS configurado para domínio de produção ✅ (já está)
- [ ] JWT_SECRET gerado e configurado

---

## 🆘 AINDA COM PROBLEMAS?

### 1. Ver logs detalhados

**Render:**
```
Dashboard > Logs (ativar Real-time)
```

**Railway:**
```
Deployment > View Logs
```

**Fly.io:**
```bash
fly logs
fly logs --app lumini-ia-backend
```

### 2. Testar localmente em modo produção

```bash
cd backend
NODE_ENV=production npm start
```

### 3. Verificar build localmente

**Docker (simula Fly.io):**
```bash
docker build -t lumini-test .
docker run -p 8080:8080 lumini-test
```

---

## 📞 PLATAFORMAS DE SUPORTE

- **Render:** https://render.com/docs
- **Railway:** https://docs.railway.app
- **Fly.io:** https://fly.io/docs
- **Vercel:** https://vercel.com/docs

---

## 💡 RECOMENDAÇÃO FINAL

Se Render e Railway falharam, tente nesta ordem:

1. **Fly.io** (execute `.\deploy-fly.ps1`)
2. **Heroku** (mais confiável, pago)
3. **Hostinger VPS** (você já tem conta!)

Cada plataforma tem suas peculiaridades. Me diga qual erro específico você teve e eu te ajudo a resolver!

