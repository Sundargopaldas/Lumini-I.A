# 🚀 COMANDOS RÁPIDOS - LUMINI I.A

## 📦 INSTALAÇÃO DAS MELHORIAS

### Windows (PowerShell):
```powershell
cd backend
.\install_melhorias.ps1
```

### Linux/Mac:
```bash
cd backend
chmod +x install_melhorias.sh
./install_melhorias.sh
```

### Manual:
```bash
cd backend
npm install isomorphic-dompurify redis
npm install --save-dev jest supertest @types/jest
```

---

## ✅ TESTES

### Rodar todos os testes:
```bash
cd backend
npm test
```

### Modo watch (desenvolvimento):
```bash
npm run test:watch
```

### Com coverage:
```bash
npm run test:coverage
```

---

## 🔐 GERAR CHAVES

### Gerar ENCRYPTION_KEY:
```bash
cd backend
node -e "console.log(require('./utils/encryption').generateEncryptionKey())"
```

### Gerar JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🗄️ BANCO DE DADOS

### SQLite (Desenvolvimento):
```bash
# Criar banco e seed
cd backend
node seed_dev.js
```

### Upgrade usuário para admin/premium:
```bash
cd backend
node upgrade_user.js
```

### PostgreSQL (Produção):
Configure `DATABASE_URL` no .env

---

## 🚀 RODAR APLICAÇÃO

### Backend:
```bash
cd backend
npm start
```

### Frontend:
```bash
cd frontend
npm run dev
```

### Ambos (2 terminais):
```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm run dev
```

---

## 🧹 LIMPAR CACHE

### Node modules:
```bash
rm -rf node_modules
npm install
```

### Vite (Frontend):
```bash
cd frontend
rm -rf node_modules/.vite
npm cache clean --force
```

### Processos Node (Windows):
```powershell
Stop-Process -Name node -Force
```

### Processos Node (Linux/Mac):
```bash
killall node
```

---

## 📊 LOGS

### Ver logs estruturados:
```bash
cd backend
tail -f logs/info.log
tail -f logs/error.log
```

### Configurar nível de log:
```bash
# .env
LOG_LEVEL=DEBUG  # DEBUG, INFO, WARN, ERROR
```

---

## 🗃️ REDIS

### Instalar Redis (Windows - WSL):
```bash
sudo apt update
sudo apt install redis-server
redis-server
```

### Instalar Redis (Mac):
```bash
brew install redis
brew services start redis
```

### Instalar Redis (Docker):
```bash
docker run -d -p 6379:6379 redis:alpine
```

### Verificar Redis:
```bash
redis-cli ping
# Deve retornar: PONG
```

---

## 🔍 DEBUG

### Ver processos Node rodando:
```bash
# Windows
Get-Process node

# Linux/Mac
ps aux | grep node
```

### Ver porta 8080 em uso:
```bash
# Windows
netstat -ano | findstr :8080

# Linux/Mac
lsof -i :8080
```

### Matar processo na porta:
```bash
# Windows
netstat -ano | findstr :8080
# Pegar o PID e:
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti :8080 | xargs kill -9
```

---

## 📝 GIT

### Commit descritivo:
```bash
git add .
git commit -m "feat: adicionar validação Joi nas rotas"
git push
```

### Ver status:
```bash
git status
git log --oneline -10
```

---

## 🔧 TROUBLESHOOTING

### Erro: "Module not found":
```bash
cd backend
npm install
```

### Erro: "Port 8080 already in use":
```powershell
# Windows
Stop-Process -Name node -Force

# Linux/Mac
killall node
```

### Erro: "Cannot find module 'sqlite3'":
```bash
cd backend
npm install sqlite3
```

### Erro: "Redis connection failed":
Cache funcionará em memória. Para usar Redis:
```bash
# Instalar Redis ou comentar no .env:
# REDIS_URL=
```

### Frontend não conecta ao backend:
1. Verificar se backend está rodando: `http://localhost:8080`
2. Limpar cache do navegador: `Ctrl + Shift + R`
3. Modo anônimo: `Ctrl + Shift + N`
4. Verificar console: `F12 > Console`

---

## 📚 DOCUMENTAÇÃO

- **MELHORIAS_IMPLEMENTADAS.md** - Documentação completa das melhorias
- **GUIA_DEPLOY_PRODUCAO.md** - Como fazer deploy
- **CHECKLIST_DEPLOY.md** - Checklist de deploy
- **TROUBLESHOOTING_DEPLOY.md** - Problemas comuns de deploy
- **DEPLOY_ALTERNATIVAS.md** - Opções de hospedagem

---

## 🎯 COMANDOS MAIS USADOS

```bash
# Desenvolvimento completo
cd backend && npm start
cd frontend && npm run dev

# Testar
cd backend && npm test

# Deploy
git add .
git commit -m "feat: nova funcionalidade"
git push

# Troubleshooting
Stop-Process -Name node -Force  # Windows
killall node                     # Linux/Mac
```

---

**💡 Dica:** Mantenha 2 terminais abertos - um para backend, outro para frontend!
