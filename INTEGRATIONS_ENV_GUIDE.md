# 🔐 Guia de Variáveis de Ambiente - Integrações

Este documento lista todas as variáveis de ambiente necessárias para as integrações do Lumini I.A.

## 📋 Backend (.env)

### YouTube Data API + Analytics
```bash
YOUTUBE_CLIENT_ID=seu_client_id_google.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=seu_secret_do_google
YOUTUBE_REDIRECT_URI=https://www.luminiiadigital.com.br/api/integrations/youtube/callback
```

**Como Obter:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione existente
3. Ative as APIs:
   - YouTube Data API v3
   - YouTube Analytics API
   - YouTube Reporting API
4. Vá em "Credenciais" → "Criar Credenciais" → "ID do cliente OAuth 2.0"
5. Configure o consentimento e adicione os escopos:
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/yt-analytics.readonly`
   - `https://www.googleapis.com/auth/yt-analytics-monetary.readonly`

---

### Hotmart API (OAuth2)
```bash
HOTMART_CLIENT_ID=seu_client_id_hotmart
HOTMART_CLIENT_SECRET=seu_secret_hotmart
HOTMART_REDIRECT_URI=https://www.luminiiadigital.com.br/api/integrations/hotmart/callback
HOTMART_USE_SANDBOX=false  # true para sandbox, false para produção
```

**Como Obter:**
1. Acesse [Hotmart Developers](https://developers.hotmart.com/)
2. Crie uma conta de desenvolvedor
3. Crie uma nova aplicação
4. Configure o OAuth2:
   - Redirect URI: `https://www.luminiiadigital.com.br/api/integrations/hotmart/callback`
   - Scopes necessários: `sales.read`, `commissions.read`
5. Copie o Client ID e Client Secret

**Documentação:** https://developers.hotmart.com/docs/pt-BR/v1/sales/history

---

### Open Finance / Pluggy
```bash
PLUGGY_CLIENT_ID=seu_client_id_pluggy
PLUGGY_CLIENT_SECRET=seu_secret_pluggy
OPEN_FINANCE_USE_SANDBOX=false  # true para sandbox, false para produção
```

**Como Obter:**
1. Acesse [Pluggy Dashboard](https://dashboard.pluggy.ai/)
2. Crie uma conta
3. Vá em "Configurações" → "API Keys"
4. Copie o Client ID e Client Secret
5. Configure o webhook (opcional): `https://www.luminiiadigital.com.br/api/webhooks/pluggy`

**Plano Recomendado:** Pluggy Starter (R$ 199/mês) ou Pro

**Documentação:** https://docs.pluggy.ai/

---

### Nuvem Fiscal (NFS-e)
```bash
NUVEM_FISCAL_CLIENT_ID=seu_client_id
NUVEM_FISCAL_CLIENT_SECRET=seu_secret
NUVEM_FISCAL_API_URL=https://api.nuvemfiscal.com.br
NUVEM_FISCAL_MOCK=false  # true para usar mock (desenvolvimento)
```

---

### Stripe (Pagamentos de Assinaturas)
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...  # ID do plano PRO
STRIPE_PRICE_PREMIUM=price_...  # ID do plano Premium
```

---

## 🎨 Frontend (.env)

### URLs de API
```bash
VITE_API_URL=https://lumini-i-a.fly.dev/api
VITE_FRONTEND_URL=https://lumini-i-a.fly.dev
```

### Open Finance (Pluggy Widget)
```bash
REACT_APP_OPEN_FINANCE_USE_SANDBOX=false  # true para sandbox, false para produção
```

---

## 📦 Deploy no Fly.io

Para configurar as variáveis de ambiente no Fly.io:

```bash
# YouTube
fly secrets set YOUTUBE_CLIENT_ID="..." YOUTUBE_CLIENT_SECRET="..." YOUTUBE_REDIRECT_URI="https://www.luminiiadigital.com.br/api/integrations/youtube/callback"

# Hotmart
fly secrets set HOTMART_CLIENT_ID="..." HOTMART_CLIENT_SECRET="..." HOTMART_REDIRECT_URI="https://www.luminiiadigital.com.br/api/integrations/hotmart/callback" HOTMART_USE_SANDBOX="false"

# Pluggy / Open Finance
fly secrets set PLUGGY_CLIENT_ID="..." PLUGGY_CLIENT_SECRET="..." OPEN_FINANCE_USE_SANDBOX="false"

# Stripe
fly secrets set STRIPE_SECRET_KEY="sk_live_..." STRIPE_PUBLISHABLE_KEY="pk_live_..." STRIPE_WEBHOOK_SECRET="whsec_..."

# Nuvem Fiscal
fly secrets set NUVEM_FISCAL_CLIENT_ID="..." NUVEM_FISCAL_CLIENT_SECRET="..." NUVEM_FISCAL_API_URL="https://api.nuvemfiscal.com.br" NUVEM_FISCAL_MOCK="false"
```

Para listar todas as secrets:
```bash
fly secrets list
```

---

## 🧪 Modo Sandbox/Mock

Durante o desenvolvimento, você pode usar os modos sandbox:

```bash
# Backend .env (desenvolvimento local)
HOTMART_USE_SANDBOX=true
OPEN_FINANCE_USE_SANDBOX=true
NUVEM_FISCAL_MOCK=true
```

Isso fará com que as integrações retornem dados simulados, permitindo testar sem credenciais reais.

---

## ✅ Checklist de Configuração

- [ ] YouTube API configurada e OAuth funcionando
- [ ] Hotmart Developers configurado com OAuth2
- [ ] Pluggy conta criada e Client ID/Secret obtidos
- [ ] Nuvem Fiscal credenciais obtidas
- [ ] Stripe configurado com planos de assinatura
- [ ] Todas as secrets configuradas no Fly.io
- [ ] Webhooks configurados (se aplicável)
- [ ] Testado em ambiente de sandbox
- [ ] Testado em produção com dados reais

---

## 🆘 Suporte

- **YouTube:** https://support.google.com/googleapi
- **Hotmart:** developers@hotmart.com
- **Pluggy:** support@pluggy.ai
- **Nuvem Fiscal:** suporte@nuvemfiscal.com.br
- **Stripe:** https://support.stripe.com

---

**Última atualização:** 19/01/2026
**Versão:** 2.0
