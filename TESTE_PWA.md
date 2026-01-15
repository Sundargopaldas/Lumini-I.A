# 📱 GUIA DE TESTE DO PWA LUMINI

## 🎯 URLS PARA TESTAR:

### Principal:
- https://lumini-i-a.fly.dev/mobile-app

### Login de teste:
- Email: contato@luminidigital.com
- Senha: (sua senha de admin)

---

## ✅ CHECKLIST DE TESTE:

### NO CELULAR ANDROID:
- [ ] Abrir Chrome e acessar /mobile-app
- [ ] Ver banner de instalação
- [ ] Clicar em "Instalar"
- [ ] Verificar ícone na tela inicial
- [ ] Abrir o app (deve abrir em tela cheia)
- [ ] Testar modo avião (funciona offline?)
- [ ] Adicionar uma transação offline
- [ ] Voltar online e ver se sincronizou

### NO IPHONE:
- [ ] Abrir Safari e acessar /mobile-app
- [ ] Tocar em Compartilhar (⎋)
- [ ] "Adicionar à Tela de Início"
- [ ] Verificar ícone na tela inicial
- [ ] Abrir o app (tela cheia)
- [ ] Testar modo avião

### NO PC:
- [ ] Abrir Chrome
- [ ] Acessar /mobile-app
- [ ] Ver ícone de instalação na barra
- [ ] Instalar
- [ ] App abre em janela separada
- [ ] Verificar no Menu Iniciar (Windows) ou Dock (Mac)

---

## 🎨 PONTOS VISUAIS PARA VERIFICAR:

### Página /mobile-app deve ter:
- [ ] Hero section com título "O seu escritório, no seu bolso"
- [ ] 6 cards coloridos de benefícios
- [ ] Tabela de comparação (Navegador vs App)
- [ ] 5 FAQs expandidas
- [ ] Estatísticas (<2MB, 100%, 0s, AUTO)
- [ ] Botão roxo grande "Instalar Lumini Agora"

### Após instalar:
- [ ] Ícone do Lumini na tela inicial
- [ ] Ao abrir: SEM barra de navegador
- [ ] Tela cheia (fullscreen)
- [ ] Navbar do Lumini normal
- [ ] Todas as funcionalidades funcionando

---

## 🐛 POSSÍVEIS PROBLEMAS:

### Se não aparecer opção de instalar:
1. Certifique-se de estar em HTTPS (lumini-i-a.fly.dev)
2. Limpe cache do navegador
3. Feche e abra o navegador novamente
4. Tente em modo anônimo

### Se não funcionar offline:
1. O Service Worker leva alguns segundos para ativar
2. Navegue um pouco pelo site primeiro
3. Depois teste o modo avião

---

## 💡 DICAS:

- O PWA funciona melhor após a primeira instalação
- Cache é construído conforme você navega
- Modo offline melhora com o uso
- iOS tem algumas limitações vs Android

---

Criado em: 15/01/2026 - 18:20
Deploy: https://lumini-i-a.fly.dev/
