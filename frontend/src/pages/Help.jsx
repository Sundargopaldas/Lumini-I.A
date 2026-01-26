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
      icon: (
        <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      questions: [
        {
          q: 'Como criar minha conta?',
          a: 'Clique em <strong>"Criar Conta"</strong> no menu superior. Preencha seus dados (nome, email, senha) e confirme seu email. Em poucos minutos você estará pronto para usar o Lumini! O plano FREE é liberado automaticamente. Veja nosso <a href="/guide" class="text-purple-600 hover:underline">Guia Rápido</a> para começar!'
        },
        {
          q: 'Por onde devo começar após criar minha conta?',
          a: 'Recomendamos seguir esta ordem: 1) Complete seu perfil em <a href="/settings" class="text-purple-600 hover:underline">Configurações</a> 2) Adicione suas primeiras transações 3) Configure certificado digital (se for emitir notas) 4) Conecte com seu contador (opcional). Confira o <a href="/guide" class="text-purple-600 hover:underline">Guia Completo</a>!'
        },
        {
          q: 'Como adicionar logo da minha empresa?',
          a: 'Vá em <a href="/settings" class="text-purple-600 hover:underline">Configurações</a> → Aba "Perfil" → Seção "Logo da Empresa" → Clique em "Upload de Logo" → Selecione uma imagem (PNG, JPG ou SVG) → Salvar. A logo aparecerá nas notas fiscais e relatórios!'
        },
        {
          q: 'Como vincular meu contador?',
          a: 'Acesse o <a href="/marketplace" class="text-purple-600 hover:underline">Marketplace</a> → Busque pelo nome ou email do seu contador → Clique em "Solicitar Conexão". Ou aguarde um convite dele por email. Após aceito, ele terá acesso aos seus dados financeiros em tempo real.'
        },
        {
          q: 'Quais planos estão disponíveis?',
          a: 'Temos 3 planos principais: <br><strong>FREE</strong>: Ideal para testar o sistema (funcionalidades limitadas)<br><strong>PRO</strong>: R$ 49/mês - perfeito para MEIs e autônomos<br><strong>PREMIUM</strong>: R$ 99/mês - para empresas com maior volume. Veja detalhes completos em <a href="/plans" class="text-purple-600 hover:underline">Planos</a>.'
        }
      ]
    },
    {
      id: 'invoices',
      title: 'Notas Fiscais',
      icon: (
        <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      questions: [
        {
          q: 'Como emitir minha primeira nota fiscal?',
          a: 'Vá em <a href="/invoices" class="text-purple-600 hover:underline">Notas Fiscais</a> → Botão "Emitir Nota" → Preencha os dados do cliente (nome, CPF/CNPJ, email) e do serviço prestado (descrição, valor) → O sistema calculará os tributos automaticamente → Revise e clique em "Emitir e Enviar".'
        },
        {
          q: 'Preciso de certificado digital?',
          a: '<strong>Sim!</strong> Para emitir NFS-e <u>real</u> que vale oficialmente, você precisa de um <strong>Certificado Digital A1</strong> (arquivo .pfx com senha). Você pode comprá-lo em certificadoras como Serasa, Certisign, Valid, Soluti, etc. Depois faça upload em <a href="/settings?tab=fiscal" class="text-purple-600 hover:underline">Configurações → Fiscal</a>.'
        },
        {
          q: 'Quanto custa um certificado digital?',
          a: 'O certificado digital A1 custa entre <strong>R$ 120 a R$ 250/ano</strong> dependendo da certificadora. É um investimento obrigatório para emitir notas fiscais eletrônicas. A validade é de 1 ano. Recomendamos: Serasa (mais barato) ou Valid (mais confiável).'
        },
        {
          q: 'Como funciona o cálculo de tributos?',
          a: 'O Lumini calcula automaticamente <strong>ISS, IR, PIS, COFINS e CSLL</strong> baseado no valor do serviço e seu regime tributário. As alíquotas padrão são aplicadas conforme legislação vigente. Você pode ajustar manualmente em caso de regimes especiais.'
        },
        {
          q: 'Posso cancelar uma nota fiscal depois de emitida?',
          a: 'Sim! Vá em <a href="/invoices" class="text-purple-600 hover:underline">Notas Fiscais</a> → Encontre a nota → Clique nos 3 pontinhos → "Cancelar Nota" → Informe o motivo. O cancelamento será enviado automaticamente para a prefeitura. <strong>Atenção:</strong> nota cancelada não pode ser revertida!'
        },
        {
          q: 'Como baixar o PDF ou XML da nota?',
          a: 'Vá em <a href="/invoices" class="text-purple-600 hover:underline">Notas Fiscais</a> → Clique na nota desejada → Botões "Baixar PDF" ou "Baixar XML" aparecerão. O <strong>PDF</strong> é para o cliente, o <strong>XML</strong> é o arquivo oficial para envio ao contador ou prefeitura.'
        }
      ]
    },
    {
      id: 'integrations',
      title: 'Integrações',
      icon: (
        <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      ),
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
      icon: (
        <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
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
      icon: (
        <svg className="w-10 h-10 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
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
      id: 'transactions',
      title: 'Transações e Relatórios',
      icon: (
        <svg className="w-10 h-10 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0h2a2 2 0 012 2v10a2 2 0 002 2h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2z" />
        </svg>
      ),
      questions: [
        {
          q: 'Como adicionar uma transação (receita ou despesa)?',
          a: 'Vá em <a href="/transactions" class="text-purple-600 hover:underline">Transações</a> → Botão "Nova Transação" → Escolha o tipo (Receita ou Despesa) → Preencha valor, data, categoria e descrição → Salvar. Pronto! Seus relatórios serão atualizados automaticamente.'
        },
        {
          q: 'Como categorizar minhas transações?',
          a: 'Ao adicionar uma transação, selecione a categoria adequada: <strong>Receitas:</strong> Vendas, Serviços, Investimentos, etc. <strong>Despesas:</strong> Fornecedores, Salários, Marketing, Impostos, etc. Isso ajuda nos relatórios gerenciais!'
        },
        {
          q: 'Como gerar relatórios financeiros?',
          a: 'Vá em <a href="/reports" class="text-purple-600 hover:underline">Relatórios</a> → Escolha o tipo: <strong>Balanço Patrimonial, DRE, Fluxo de Caixa, DAS MEI</strong>, etc. → Selecione o período → Clique em "Gerar Relatório" → Você pode visualizar na tela ou "Exportar PDF".'
        },
        {
          q: 'Como exportar meus relatórios em PDF?',
          a: 'Em qualquer relatório (<a href="/reports" class="text-purple-600 hover:underline">Relatórios</a>), após gerar, clique no botão "Exportar PDF" no canto superior direito. O arquivo será baixado automaticamente com formatação profissional, pronto para enviar ao contador ou investidores!'
        },
        {
          q: 'O que é DAS MEI e como calcular?',
          a: 'DAS MEI é o boleto mensal obrigatório para Microempreendedores Individuais. Vá em <a href="/reports" class="text-purple-600 hover:underline">Relatórios</a> → "DAS MEI" → O sistema calcula automaticamente baseado no seu faturamento e gera o boleto para pagamento.'
        }
      ]
    },
    {
      id: 'support',
      title: 'Suporte e Problemas',
      icon: (
        <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      questions: [
        {
          q: 'Como entro em contato com o suporte?',
          a: 'Você pode: 1) Clicar no botão <strong>WhatsApp</strong> verde no canto inferior direito (resposta rápida!) 2) Enviar email para <strong>contato@luminiiadigital.com.br</strong> 3) Usar os botões no final desta página. Tempo médio de resposta: 2-4 horas úteis.'
        },
        {
          q: 'Esqueci minha senha, e agora?',
          a: 'Na tela de <a href="/login" class="text-purple-600 hover:underline">login</a>, clique em <strong>"Esqueci Minha Senha"</strong> → Digite seu email cadastrado → Você receberá um link para redefinir em até 5 minutos. <u>Verifique também a pasta de SPAM!</u> Se não receber, entre em contato.'
        },
        {
          q: 'Meu certificado digital não está sendo aceito',
          a: 'Verifique: 1) Certificado é tipo <strong>A1 (.pfx)</strong>? A3 não funciona. 2) Está dentro da validade? 3) A senha está correta? 4) O CNPJ/CPF do certificado coincide com o cadastrado em <a href="/settings" class="text-purple-600 hover:underline">Configurações</a>? Se persistir, contate o suporte com print do erro.'
        },
        {
          q: 'Como reportar um bug ou erro no sistema?',
          a: 'Encontrou algo estranho? Clique no <strong>WhatsApp</strong> (botão verde) ou envie email para <strong>contato@luminiiadigital.com.br</strong> com: 1) Print da tela 2) Descrição do erro 3) O que você estava fazendo. Bugs são priorizados e corrigidos rapidamente!'
        },
        {
          q: 'Como sugiro uma nova funcionalidade?',
          a: 'Adoramos feedback! Envie email para <strong>contato@luminiiadigital.com.br</strong> com assunto <strong>"Sugestão de Funcionalidade"</strong>. Todas as sugestões são avaliadas pela equipe de produto e priorizadas conforme demanda dos usuários.'
        },
        {
          q: 'O sistema está lento, o que fazer?',
          a: 'Tente: 1) Limpar cache do navegador (CTRL+SHIFT+DELETE) 2) Atualizar a página (CTRL+F5) 3) Testar em outro navegador (recomendamos Chrome ou Edge) 4) Verificar sua conexão de internet. Se persistir, entre em contato informando seu navegador e velocidade de internet.'
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
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Central de Ajuda
          </h1>
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
                    <div className="flex-shrink-0">{category.icon}</div>
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

      </div>
    </div>
  );
};

export default Help;
