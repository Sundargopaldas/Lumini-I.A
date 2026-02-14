# 🌐 Site Lumini I.A

Site institucional e documentação completa do **Lumini I.A**.

## 📁 Estrutura

```
website/
├── index.html       # Landing page principal (home)
├── docs.html        # Documentação completa e detalhada
└── README.md        # Este arquivo
```

---

## 🚀 Como Usar

### Opção 1: Abrir Localmente no Navegador

1. Navegue até a pasta `website`
2. Clique duas vezes no arquivo `index.html`
3. O site abre no seu navegador padrão

### Opção 2: Servidor Local (Recomendado)

#### Python (mais simples):
```bash
cd website
python -m http.server 8080
```
Abra: http://localhost:8080

#### Node.js:
```bash
cd website
npx serve
```

#### VS Code:
Instale a extensão **Live Server** e clique com o botão direito em `index.html` → **Open with Live Server**

---

## 📄 Páginas

### 🏠 Landing Page (`index.html`)
- Hero section impactante
- Funcionalidades principais
- Planos e preços
- FAQ
- CTA para cadastro/login

### 📖 Documentação (`docs.html`)
- Guia completo de todas as funcionalidades
- Dashboard explicado
- Transações, Integrações, Relatórios
- Notas Fiscais (NF-e)
- Marketplace de Contadores
- App Mobile (PWA)
- Configurações e Segurança
- API (em desenvolvimento)
- FAQ Técnico

---

## 🎨 Design

### Cores Principais:
- **Roxo Primary:** `#8b5cf6`
- **Azul Primary:** `#3b82f6`
- **Gradiente:** `from-purple-600 to-indigo-600`
- **Background:** `from-slate-900 via-purple-900 to-slate-900`

### Fontes:
- **Inter** (textos principais)
- **Fira Code** (códigos e monospace)

### Framework CSS:
- **Tailwind CSS** via CDN (sem build necessário)
- **Font Awesome** para ícones

---

## 🔗 Links e Navegação

| Link | Destino |
|------|---------|
| `index.html` | Landing page |
| `docs.html` | Documentação completa |
| `#features` | Seção de funcionalidades |
| `#pricing` | Seção de preços |
| `#faq` | Perguntas frequentes |

---

## 🚀 Deploy (Futuro)

### Opções Recomendadas:

#### 1. Vercel (Grátis e Fácil)
```bash
npm i -g vercel
cd website
vercel
```

#### 2. Netlify (Arraste e Solte)
1. Acesse https://netlify.com
2. Arraste a pasta `website` para o site
3. Pronto!

#### 3. GitHub Pages
```bash
# Criar repositório no GitHub
# Fazer push da pasta website
# Ativar GitHub Pages nas configurações
```

#### 4. Fly.io (junto com o backend)
Adicionar ao `fly.toml`:
```toml
[[statics]]
  guest_path = "/app/website"
  url_prefix = "/site"
```

---

## ✅ Checklist de Qualidade

- [x] Totalmente responsivo (mobile, tablet, desktop)
- [x] Modo escuro por padrão
- [x] Animações suaves
- [x] Performance otimizada
- [x] SEO básico (meta tags)
- [x] Acessibilidade (contraste, foco)
- [x] Links funcionais
- [x] Navegação suave (smooth scroll)
- [x] Cores do Lumini (roxo/azul)
- [x] Documentação completa e detalhada

---

## 📝 Personalizações Futuras

- [ ] Sistema de busca na documentação
- [ ] Versão em inglês
- [ ] Blog integrado
- [ ] Vídeos tutoriais
- [ ] Changelog público
- [ ] Status page (uptime)
- [ ] Chat de suporte (Intercom/Crisp)

---

## 🤝 Contribuindo

Se você quiser melhorar o site:

1. Edite os arquivos `.html` diretamente
2. Teste localmente (abra no navegador)
3. Faça commit das mudanças
4. Deploy!

---

## 📧 Contato

**Dúvidas sobre o site?**
- Email: contato@luminiiadigital.com.br
- WhatsApp: (11) 99999-9999

---

## 📜 Licença

© 2026 Lumini I.A. Todos os direitos reservados.

---

**🎨 Design moderno. 📱 Mobile-first. ⚡ Performance.**
