# 🚀 Roadmap de Desenvolvimento - Lumini I.A.

Este documento detalha o plano estratégico de evolução do **Lumini I.A.**, focado em transformar a plataforma de um gerenciador financeiro avançado em um ecossistema completo de inteligência financeira e automação para empresas e pessoas físicas.

---

## 📅 Fase 1: Consolidação & Inteligência (Atual - Curto Prazo)
*Foco: Refinar a experiência do usuário, robustez da IA e funcionalidades fiscais.*

- [x] **Consultor IA Híbrido**: Fallback robusto entre Gemini (Nuvem) e Lógica Local (Offline).
- [x] **Simulador Fiscal Pro**: Geração de relatórios PDF com assinatura e cálculo real de impostos.
- [x] **Importação OFX**: Importação de extratos bancários com categorização inteligente.
- [x] **Internacionalização (i18n)**: Suporte completo a PT-BR, EN e ES.
- [ ] **Chat IA Contextual (Memória)**:
    - *Objetivo*: Permitir que o usuário converse com a IA ("Como gastei meu dinheiro mês passado?") em vez de apenas receber insights estáticos.
    - *Tech*: Armazenar histórico de chat no backend e enviar contexto deslizante para o Gemini.
- [ ] **RAG Fiscal (Retrieval-Augmented Generation)**:
    - *Objetivo*: IA responder dúvidas fiscais baseadas na legislação brasileira atualizada (CLT, Simples Nacional).
    - *Tech*: Indexar PDFs de leis em vetor e usar Gemini para consultar.

---

## 📅 Fase 2: Integrações Reais & Automação (Médio Prazo)
*Foco: Eliminar a entrada manual de dados e conectar com o sistema financeiro real.*

- [ ] **Open Finance (Agregador Bancário)**:
    - *Objetivo*: Conectar automaticamente contas bancárias (Itaú, Nubank, Bradesco) para puxar transações em tempo real.
    - *Tech*: Integração com APIs como **Pluggy** ou **Belvo**.
- [ ] **Gateway de Pagamentos Real**:
    - *Objetivo*: Permitir que usuários cobrem seus clientes (boletos, Pix) direto pelo Lumini.
    - *Tech*: Integração com **Asaas** ou **Stripe** (substituindo o mock atual de Invoices).
- [ ] **Emissão de Notas Fiscais (NF-e/NFS-e)**:
    - *Objetivo*: Emitir notas fiscais reais para prefeituras/SEFAZ.
    - *Tech*: API de documentos fiscais (ex: Focus NFe ou eNotas).

---

## 📅 Fase 3: Expansão de Ecossistema (Longo Prazo)
*Foco: Mobilidade e escala.*

- [ ] **App Mobile Nativo**:
    - *Objetivo*: Versão iOS e Android com notificações push de gastos e alertas da IA.
    - *Tech*: **React Native** (reaproveitando lógica do React web).
- [ ] **Marketplace de Contadores**:
    - *Objetivo*: Conectar usuários Premium a contadores reais parceiros para validação de relatórios.
    - *Tech*: Módulo de agendamento e chat humano.
- [ ] **Arquitetura de Microserviços**:
    - *Objetivo*: Separar o módulo de IA e o módulo Bancário para escalar independentemente.
    - *Tech*: Docker, Kubernetes.

---

## 🛠️ Próximos Passos Técnicos (Imediatos)

1.  **Chat Interface**: Criar um componente de chat flutuante persistente no frontend.
2.  **API de Chat**: Criar rota `/api/ai/chat` que aceita mensagens do usuário e mantém contexto.
3.  **POC Open Finance**: Criar uma prova de conceito usando o ambiente Sandbox da Pluggy para listar contas reais.
