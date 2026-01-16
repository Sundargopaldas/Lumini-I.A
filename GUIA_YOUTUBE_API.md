# 🎥 GUIA COMPLETO: Configurar YouTube Data API v3

## 📌 **O QUE VAMOS FAZER:**
Conectar a API do YouTube para que seus usuários YouTubers possam:
- ✅ Ver receitas estimadas do AdSense
- ✅ Visualizar estatísticas do canal
- ✅ Acompanhar views e ganhos
- ✅ Sincronizar dados automaticamente

---

## 🚀 **PASSO 1: Criar Projeto no Google Cloud**

### 1.1 Acesse:
```
https://console.cloud.google.com/
```

### 1.2 Clique em **"Selecionar um projeto"** (topo esquerdo)

### 1.3 Clique em **"NOVO PROJETO"**

### 1.4 Preencha:
```
Nome do projeto: Lumini I.A
Organização: (deixe em branco se não tiver)
Local: (pode deixar padrão)
```

### 1.5 Clique em **"CRIAR"**

---

## 🔑 **PASSO 2: Ativar YouTube Data API v3**

### 2.1 No menu lateral, vá em:
```
APIs e serviços → Biblioteca
```

### 2.2 Na busca, digite:
```
YouTube Data API v3
```

### 2.3 Clique na API que aparece

### 2.4 Clique em **"ATIVAR"**

---

## 🎯 **PASSO 3: Criar Credenciais OAuth 2.0**

### 3.1 Vá em:
```
APIs e serviços → Credenciais
```

### 3.2 Clique em **"+ CRIAR CREDENCIAIS"**

### 3.3 Selecione **"ID do cliente OAuth"**

### 3.4 Se pedir para configurar "Tela de consentimento OAuth":

#### 3.4.1 Clique em **"CONFIGURAR TELA DE CONSENTIMENTO"**

#### 3.4.2 Escolha **"Externo"** → **"CRIAR"**

#### 3.4.3 Preencha:
```
Nome do app: Lumini I.A
Email de suporte do usuário: seu_email@gmail.com
Logo do app: (opcional)
Domínio do app: lumini-i-a.fly.dev
Domínio autorizado: lumini-i-a.fly.dev
Email do desenvolvedor: seu_email@gmail.com
```

#### 3.4.4 Clique em **"SALVAR E CONTINUAR"**

#### 3.4.5 Em **"Escopos"**, clique em **"ADICIONAR OU REMOVER ESCOPOS"**

#### 3.4.6 Procure e adicione:
```
✅ YouTube Data API v3
   - https://www.googleapis.com/auth/youtube.readonly
   - https://www.googleapis.com/auth/yt-analytics.readonly
```

#### 3.4.7 Clique em **"ATUALIZAR"** → **"SALVAR E CONTINUAR"**

#### 3.4.8 Em **"Usuários de teste"**, clique em **"+ ADD USERS"**

#### 3.4.9 Adicione seu email (para testes)

#### 3.4.10 Clique em **"SALVAR E CONTINUAR"** → **"VOLTAR AO PAINEL"**

---

### 3.5 Agora volte para **Credenciais**:

```
APIs e serviços → Credenciais → + CRIAR CREDENCIAIS → ID do cliente OAuth
```

### 3.6 Selecione **"Aplicativo da Web"**

### 3.7 Preencha:
```
Nome: Lumini I.A - YouTube Integration

Origens JavaScript autorizadas:
  - http://localhost:5173 (para desenvolvimento)
  - https://lumini-i-a.fly.dev (para produção)

URIs de redirecionamento autorizados:
  - http://localhost:5173/integrations (para desenvolvimento)
  - https://lumini-i-a.fly.dev/integrations (para produção)
```

### 3.8 Clique em **"CRIAR"**

### 3.9 **COPIE AS CREDENCIAIS** que aparecem:
```
Client ID: algo-como-123456.apps.googleusercontent.com
Client Secret: algo-como-GOCSPX-abc123xyz
```

⚠️ **IMPORTANTE: Guarde essas credenciais com segurança!**

---

## 🔧 **PASSO 4: Configurar no Lumini**

### 4.1 Adicione no arquivo `.env` do backend:

```bash
# YouTube API
YOUTUBE_CLIENT_ID=seu_client_id_aqui
YOUTUBE_CLIENT_SECRET=seu_client_secret_aqui
YOUTUBE_REDIRECT_URI=https://lumini-i-a.fly.dev/integrations
```

### 4.2 Me envie as credenciais e eu atualizo o código!

---

## 📊 **O QUE OS USUÁRIOS TERÃO:**

### ✅ **No Dashboard:**
```
📺 Receita do YouTube (mês atual)
👁️ Views totais
📈 Gráfico de crescimento
💰 Estimativa de ganhos
```

### ✅ **Na Página Integrações:**
```
🔗 Botão "Conectar YouTube"
🔄 Sincronização automática
📊 Dados atualizados diariamente
```

---

## ⏱️ **TEMPO ESTIMADO:**
- **Criar projeto**: 2 minutos
- **Ativar API**: 1 minuto
- **Configurar OAuth**: 5 minutos
- **Configurar Lumini**: 2 minutos
- **TOTAL**: ~10 minutos

---

## 💰 **CUSTO:**
```
✅ GRATUITO até 10.000 requests/dia
✅ Suficiente para 100+ usuários
✅ Sem cobrança de setup
```

---

## 🆘 **PRECISA DE AJUDA?**

Se tiver dúvidas em algum passo:
1. Tire print da tela
2. Me envie
3. Eu te guio!

---

## 📝 **CHECKLIST:**

- [ ] Criar projeto no Google Cloud
- [ ] Ativar YouTube Data API v3
- [ ] Configurar tela de consentimento OAuth
- [ ] Criar credenciais OAuth 2.0
- [ ] Copiar Client ID e Secret
- [ ] Adicionar no .env do backend
- [ ] Me enviar as credenciais para eu configurar o código
- [ ] Testar a integração

---

**VAMOS COMEÇAR?** 🚀

**Siga os passos e me avise quando chegar no PASSO 3.9 (copiar as credenciais)!**
