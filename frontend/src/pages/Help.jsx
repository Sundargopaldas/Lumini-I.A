import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const Help = () => {
  const [openCategory, setOpenCategory] = useState(null);
  const [openQuestion, setOpenQuestion] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      id: 'getting-started',
      title: 'Primeiros Passos',
      icon: '🚀',
      questions: [
        {
          q: 'Como criar minha conta?',
          a: 'Clique em "Criar Conta" no menu superior. Preencha seus dados (nome, email, senha) e confirme seu email. Em poucos minutos você estará pronto para usar o Lumini! O plano FREE é liberado automaticamente.'
        },
        {
          q: 'Como vincular meu contador?',
          a: 'Vá em "Configurações" → "Meu Contador" → Digite o email do seu contador → "Enviar Convite". Ele receberá um email e poderá aceitar o vínculo. Após aceito, ele terá acesso aos seus dados financeiros.'
        },
        {
          q: 'Quais planos estão disponíveis?',
          a: 'Temos 3 planos principais: <br><strong>FREE</strong>: Ideal para testar (limitado)<br><strong>PRO</strong>: R$ 49/mês - perfeito para MEIs e autônomos<br><strong>PREMIUM</strong>: R$ 99/mês - para empresas com maior volume. Veja detalhes completos na página "Planos".'
        },
        {
          q: 'Como importar minhas transações existentes?',
          a: 'Vá em "Transações" → Botão "Importar" → Selecione um arquivo CSV ou Excel → Mapeie as colunas → Confirme. O sistema aceita diversos formatos de extrato bancário.'
        }
      ]
    },
    {
      id: 'invoices',
      title: 'Notas Fiscais',
      icon: '📝',
      questions: [
        {
          q: 'Como emitir minha primeira nota fiscal?',
          a: 'Vá em "Notas Fiscais" → "Emitir Nova Nota" → Preencha os dados do cliente (nome, CPF/CNPJ) e do serviço prestado → O sistema calculará os tributos automaticamente → Clique em "Emitir".'
        },
        {
          q: 'Preciso de certificado digital?',
          a: '<strong>Sim!</strong> Para emitir NFS-e real, você precisa de um <strong>Certificado Digital A1</strong> (arquivo .pfx). Você pode comprá-lo em certificadoras como Serasa, Certisign, Valid, etc. Depois faça upload em "Certificados".'
        },
        {
          q: 'Como funciona o cálculo de tributos?',
          a: 'O Lumini calcula automaticamente <strong>ISS, IR, PIS, COFINS e CSLL</strong> baseado no valor do serviço. As alíquotas padrão são aplicadas conforme legislação vigente, mas você pode ajustar manualmente conforme seu regime tributário.'
        },
        {
          q: 'Posso cancelar uma nota fiscal?',
          a: 'Sim! Vá em "Notas Fiscais" → Encontre a nota → Clique em "Cancelar". O cancelamento será enviado para a prefeitura (se nota já emitida). Atenção: nota cancelada não pode ser revertida!'
        }
      ]
    },
    {
      id: 'integrations',
      title: 'Integrações',
      icon: '🔌',
      questions: [
        {
          q: 'Como conectar minha conta Hotmart?',
          a: 'Vá em "Integrações" → Encontre "Hotmart" → Clique em "Conectar" → Você será redirecionado para autorizar → Faça login na Hotmart e autorize → Após autorizar, clique em "Sincronizar Agora" para importar suas vendas!'
        },
        {
          q: 'Como conectar meu banco (Open Finance)?',
          a: 'Vá em "Integrações" → Encontre "Open Finance" → "Conectar" → Escolha seu banco na lista → Faça login normalmente → Autorize o Lumini → Pronto! Suas transações bancárias serão importadas automaticamente a cada sync.'
        },
        {
          q: 'É seguro conectar meu banco?',
          a: '<strong>SIM, 100% seguro!</strong> Usamos <strong>Open Finance</strong>, o padrão oficial regulamentado pelo <strong>Banco Central do Brasil</strong>. NUNCA pedimos sua senha bancária. A conexão é criptografada de ponta-a-ponta. Você pode revogar o acesso a qualquer momento.'
        },
        {
          q: 'Como conectar YouTube?',
          a: 'Vá em "Integrações" → "YouTube" → "Conectar" → Faça login na conta Google/YouTube → Autorize → Suas receitas do AdSense e métricas do canal serão sincronizadas automaticamente.'
        }
      ]
    },
    {
      id: 'accountant',
      title: 'Área do Contador',
      icon: '👨‍💼',
      questions: [
        {
          q: 'Como criar meu perfil de contador?',
          a: 'Vá em "Marketplace" → Botão "Tornar-me Contador" → Preencha seus dados profissionais (nome, CRC, especialidade, foto) → Enviar. Seu perfil será aprovado automaticamente e ficará visível para clientes procurando contadores.'
        },
        {
          q: 'Como adicionar clientes?',
          a: 'Seus clientes devem vincular você pelo seu email. Ou você pode convidá-los em "Dashboard do Contador" → "Convidar Cliente" → Digite o email → Enviar convite. O cliente receberá um email com instruções.'
        },
        {
          q: 'Como visualizar dados dos meus clientes?',
          a: 'Acesse "Dashboard do Contador" (menu superior) → Você verá estatísticas agregadas de todos os clientes → Clique em um cliente específico para ver receitas, despesas, notas fiscais e relatórios completos individuais.'
        },
        {
          q: 'Posso acessar as notas fiscais dos clientes?',
          a: 'Sim! Desde que o cliente tenha vinculado você como contador. Você terá acesso completo às notas emitidas, pendentes, canceladas e poderá baixar XMLs para envio à prefeitura.'
        }
      ]
    },
    {
      id: 'billing',
      title: 'Pagamentos e Planos',
      icon: '💳',
      questions: [
        {
          q: 'Como fazer upgrade para PRO?',
          a: 'Vá em "Planos" → Escolha PRO ou PREMIUM → Clique em "Assinar" → Preencha dados do cartão de crédito → Confirme. O upgrade é <strong>imediato</strong>! Você já pode usar todos os recursos premium.'
        },
        {
          q: 'Posso cancelar a qualquer momento?',
          a: '<strong>Sim! Sem fidelidade.</strong> Você pode cancelar em "Configurações" → "Assinatura" → "Cancelar Plano". Você terá acesso completo até o fim do período já pago. Depois retorna automaticamente ao FREE.'
        },
        {
          q: 'Quais formas de pagamento aceitam?',
          a: 'Aceitamos <strong>Cartão de Crédito</strong> (via Stripe - seguro e internacional). <strong>PIX e Boleto</strong> estarão disponíveis em breve para alguns planos. Fique atento às atualizações!'
        },
        {
          q: 'O que acontece se eu atrasar o pagamento?',
          a: 'Se o cartão for recusado, você tem 3 dias para atualizar os dados. Após isso, a conta volta para o plano FREE automaticamente. Seus dados são preservados e você pode reativar a qualquer momento.'
        }
      ]
    },
    {
      id: 'support',
      title: 'Suporte e Problemas',
      icon: '🆘',
      questions: [
        {
          q: 'Como entro em contato com o suporte?',
          a: 'Clique no botão "Enviar Email" ou "Chat ao Vivo" no final desta página. Também respondemos rapidamente em <strong>contato@luminiiadigital.com.br</strong>. Tempo médio de resposta: 2-4 horas úteis.'
        },
        {
          q: 'Esqueci minha senha, e agora?',
          a: 'Na tela de login, clique em "Esqueci Minha Senha" → Digite seu email → Você receberá um link para redefinir. Verifique também a pasta de SPAM. Se não receber em 5 minutos, entre em contato.'
        },
        {
          q: 'Meu certificado digital não está sendo aceito',
          a: 'Verifique: 1) Certificado é tipo A1 (.pfx)? 2) Está dentro da validade? 3) A senha está correta? 4) O CNPJ/CPF do certificado coincide com o cadastrado? Se ainda assim não funcionar, contate o suporte com print do erro.'
        },
        {
          q: 'Como sugiro uma nova funcionalidade?',
          a: 'Adoramos feedback! Envie email para <strong>contato@luminiiadigital.com.br</strong> com assunto "Sugestão de Funcionalidade". Todas as sugestões são avaliadas pela equipe de produto e priorizadas conforme demanda.'
        }
      ]
    }
  ];

  // Filtrar categorias e perguntas com base na busca
  const filteredCategories = categories.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q =>
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0 || searchQuery === '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 md:mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Central de Ajuda
            </h1>
            <span className="text-4xl md:text-6xl">🆘</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            Encontre respostas rápidas para suas dúvidas ou entre em contato com nossa equipe
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Buscar dúvidas... (ex: como emitir nota fiscal)"
              className="w-full px-5 py-4 rounded-xl border-2 border-purple-200 dark:border-purple-800 dark:bg-gray-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </motion.div>

        {/* Categories */}
        <div className="space-y-4">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <p className="text-4xl mb-4">🔎</p>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Nenhum resultado encontrado para "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
              >
                Limpar busca
              </button>
            </div>
          ) : (
            filteredCategories.map(category => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700"
              >
                <button
                  onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{category.icon}</span>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white text-left">
                      {category.title}
                    </h3>
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold px-3 py-1 rounded-full">
                      {category.questions.length}
                    </span>
                  </div>
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${
                      openCategory === category.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {openCategory === category.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                        {category.questions.map((item, idx) => (
                          <div
                            key={idx}
                            className="border-l-4 border-purple-500 pl-4 py-2"
                          >
                            <button
                              onClick={() =>
                                setOpenQuestion(
                                  openQuestion === `${category.id}-${idx}`
                                    ? null
                                    : `${category.id}-${idx}`
                                )
                              }
                              className="text-left w-full group"
                            >
                              <p className="font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-start gap-2">
                                <span className="text-purple-500 font-bold">Q:</span>
                                <span>{item.q}</span>
                              </p>
                            </button>

                            <AnimatePresence>
                              {openQuestion === `${category.id}-${idx}` && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed overflow-hidden"
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="text-green-500 font-bold">A:</span>
                                    <div dangerouslySetInnerHTML={{ __html: item.a }} />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center shadow-2xl"
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-3">Ainda precisa de ajuda?</h3>
          <p className="mb-6 text-purple-100 text-base md:text-lg">
            Nossa equipe está pronta para te atender! 💬
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="mailto:contato@luminiiadigital.com.br"
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <span>📧</span>
              <span>Enviar Email</span>
            </a>
            <Link
              to="/dashboard"
              className="bg-white/20 backdrop-blur-sm border-2 border-white px-8 py-3 rounded-lg font-bold hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
            >
              <span>🏠</span>
              <span>Voltar ao Dashboard</span>
            </Link>
          </div>
          <p className="mt-6 text-sm text-purple-100">
            Tempo médio de resposta: <strong>2-4 horas úteis</strong>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Help;
