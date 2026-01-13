# 🎯 GUIA: CONFIGURAR GOOGLE ANALYTICS 4 (GA4)

---

## 📋 PASSO A PASSO COMPLETO

### 1️⃣ CRIAR CONTA NO GOOGLE ANALYTICS

1. Acesse: https://analytics.google.com/
2. Faça login com sua conta Google
3. Clique em **"Começar a medir"** (ou "Start measuring")

---

### 2️⃣ CONFIGURAR PROPRIEDADE

1. **Nome da conta:**
   - Digite: `Lumini I.A`
   
2. **Nome da propriedade:**
   - Digite: `Lumini IA - Produção`
   
3. **Fuso horário:**
   - Selecione: `Brazil Time (GMT-03:00) Brasília`
   
4. **Moeda:**
   - Selecione: `Real Brasileiro (R$)`

5. Clique em **"Próximo"**

---

### 3️⃣ DETALHES DA EMPRESA

1. **Setor:**
   - Selecione: `Software e Tecnologia` ou `Finanças`
   
2. **Tamanho da empresa:**
   - Selecione conforme seu caso (ex: `Pequena: 1-10 funcionários`)

3. **Objetivos:**
   - Marque:
     - ✅ Examinar o comportamento do usuário
     - ✅ Medir conversões
     - ✅ Obter insights sobre os clientes

4. Clique em **"Criar"**

5. **Aceite os Termos de Serviço**

---

### 4️⃣ CONFIGURAR FLUXO DE DADOS (DATA STREAM)

1. **Plataforma:**
   - Selecione: **"Web"**

2. **URL do site:**
   - Digite: `https://luminiiadigital.com.br`

3. **Nome do fluxo:**
   - Digite: `Lumini I.A - Website`

4. Clique em **"Criar fluxo"**

---

### 5️⃣ COPIAR O MEASUREMENT ID

Após criar o fluxo, você verá uma tela com:

```
ID de medição: G-XXXXXXXXXX
```

**COPIE ESTE ID!** Você vai precisar dele.

---

### 6️⃣ CONFIGURAR NO LUMINI I.A

#### No seu computador local (desenvolvimento):

1. Abra o arquivo `frontend/.env` (ou crie se não existir)

2. Adicione a linha:
```
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```
(Substitua `G-XXXXXXXXXX` pelo seu ID real)

3. Salve o arquivo

#### No Fly.io (produção):

Execute no terminal:

```bash
flyctl secrets set VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```
(Substitua `G-XXXXXXXXXX` pelo seu ID real)

---

### 7️⃣ FAZER DEPLOY

#### Frontend:
```bash
cd frontend
npm install
npm run build
```

#### Deploy no Fly.io:
```bash
cd ..
fly deploy
```

---

### 8️⃣ VERIFICAR SE ESTÁ FUNCIONANDO

1. **Teste Local:**
   - Abra o console do navegador (F12)
   - Acesse: `http://localhost:5173`
   - Você deve ver no console:
     ```
     ✅ Google Analytics 4 inicializado: G-XXXXXXXXXX
     📊 GA4 PageView: /login
     ```

2. **Teste Produção:**
   - Acesse: `https://luminiiadigital.com.br`
   - Abra o console (F12)
   - Você deve ver os mesmos logs

3. **No Google Analytics:**
   - Volte para: https://analytics.google.com/
   - Vá em **"Relatórios" → "Tempo real"**
   - Acesse seu site em outra aba
   - Você deve ver **1 usuário ativo** no GA4

---

## 🎯 O QUE ESTÁ SENDO RASTREADO

### 📊 Eventos Automáticos:
- ✅ **Pageviews** - Cada mudança de página
- ✅ **Login** - Quando usuário faz login
- ✅ **Cadastro (Sign Up)** - Quando usuário se registra
- ✅ **Upgrade de Plano** - Quando usuário muda para Pro/Premium
- ✅ **Cancelamento** - Quando usuário cancela plano (com motivo)
- ✅ **Erros** - Quando ocorre erro de login/registro

### 💰 Conversões (quando implementadas):
- Upgrade para plano pago
- Valor das transações

---

## 📈 RELATÓRIOS ÚTEIS NO GA4

### 1. **Tempo Real:**
   - Ver usuários online agora
   - Ver páginas sendo acessadas

### 2. **Aquisição → Visão geral:**
   - De onde vêm seus usuários (Google, direto, redes sociais)

### 3. **Engajamento → Páginas e telas:**
   - Páginas mais visitadas
   - Tempo médio por página

### 4. **Engajamento → Eventos:**
   - Ver todos os eventos (login, cadastro, upgrade)
   - Quantos upgrades por dia

### 5. **Retenção:**
   - Quantos usuários voltam ao site

---

## 🔧 CONFIGURAÇÕES AVANÇADAS (OPCIONAL)

### Configurar Conversões:

1. No GA4, vá em **"Configurar" → "Eventos"**
2. Clique em **"Marcar como conversão"** nos eventos:
   - `sign_up` (cadastro)
   - `upgrade` (upgrade de plano)
   - `purchase` (se você adicionar e-commerce)

### Conectar com Google Ads:

1. Se você fizer anúncios no Google, conecte o GA4 com o Google Ads
2. Vá em **"Administração" → "Vinculações do Google Ads"**
3. Siga o assistente

### Configurar Públicos-Alvo:

1. Vá em **"Configurar" → "Públicos-alvo"**
2. Crie públicos personalizados, ex:
   - Usuários que fizeram login mas não fizeram upgrade
   - Usuários que cancelaram (para remarketing)

---

## 🐛 PROBLEMAS COMUNS

### ❌ Não aparece nada no GA4:

**Soluções:**
1. Verifique se o Measurement ID está correto no `.env`
2. Verifique se fez o deploy após adicionar o ID
3. Aguarde até 24 horas (dados podem demorar)
4. Use o "Relatório em Tempo Real" para testar (mais rápido)

### ❌ Console mostra erro de GA4:

**Soluções:**
1. Verifique se a URL do site está correta no GA4
2. Verifique se não há AdBlocker ativo
3. Verifique se o domínio está correto (luminiiadigital.com.br)

### ❌ Muitos eventos "page_view":

- Isso é normal! Cada mudança de rota gera um pageview

---

## 📚 RECURSOS

- **Documentação oficial GA4:**
  https://support.google.com/analytics/answer/9304153

- **Curso gratuito GA4:**
  https://analytics.google.com/analytics/academy/

- **Melhores práticas:**
  https://developers.google.com/analytics/devguides/collection/ga4

---

## ✅ CHECKLIST FINAL

- [ ] Criei conta no Google Analytics
- [ ] Criei propriedade "Lumini I.A"
- [ ] Configurei fluxo de dados "Web"
- [ ] Copiei o Measurement ID (G-XXXXXXXXXX)
- [ ] Adicionei o ID no arquivo `.env`
- [ ] Configurei o secret no Fly.io
- [ ] Fiz deploy do frontend
- [ ] Testei no navegador (vi logs no console)
- [ ] Vi usuário ativo no "Tempo Real" do GA4
- [ ] Marquei eventos como conversões (opcional)

---

## 🎉 PRONTO!

Agora você tem **analytics profissional** no Lumini I.A! 📊

Acesse diariamente o GA4 para ver:
- Quantos usuários novos
- Quantos upgrades
- Quais páginas são mais visitadas
- De onde vêm seus usuários

---

**Criado em:** 14/01/2026  
**Última atualização:** 14/01/2026  
**Versão:** 1.0
