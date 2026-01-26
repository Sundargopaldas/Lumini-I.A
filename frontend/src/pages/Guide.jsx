import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../components/Logo';

const Guide = () => {
  const { t } = useTranslation();

  const steps = [
    {
      number: 1,
      icon: '👤',
      title: 'Complete seu Perfil',
      description: 'Adicione os dados da sua empresa, logo e informações fiscais para começar.',
      action: 'Ir para Configurações',
      link: '/settings',
      details: [
        'Nome da empresa e CNPJ/CPF',
        'Endereço completo',
        'Logo da empresa (opcional)',
        'Dados fiscais para emissão de notas'
      ]
    },
    {
      number: 2,
      icon: '💰',
      title: 'Registre suas Transações',
      description: 'Adicione receitas e despesas para o sistema gerar seus relatórios automaticamente.',
      action: 'Ir para Transações',
      link: '/transactions',
      details: [
        'Clique em "Nova Transação"',
        'Escolha: Receita ou Despesa',
        'Preencha valor, data e categoria',
        'Adicione descrição (opcional)'
      ]
    },
    {
      number: 3,
      icon: '📊',
      title: 'Visualize seus Relatórios',
      description: 'Veja balanço patrimonial, DRE, fluxo de caixa e muito mais gerados automaticamente.',
      action: 'Ir para Relatórios',
      link: '/reports',
      details: [
        'Balanço Patrimonial',
        'DRE (Demonstração do Resultado)',
        'Fluxo de Caixa',
        'Exporte tudo em PDF'
      ]
    },
    {
      number: 4,
      icon: '📄',
      title: 'Emita Notas Fiscais',
      description: 'Gere notas fiscais de serviço diretamente pelo sistema.',
      action: 'Ir para Notas Fiscais',
      link: '/invoices',
      details: [
        'Configure certificado digital (obrigatório)',
        'Clique em "Emitir Nota"',
        'Preencha dados do cliente',
        'Sistema envia para Receita automaticamente'
      ]
    },
    {
      number: 5,
      icon: '🤝',
      title: 'Conecte com seu Contador',
      description: 'Compartilhe seus dados financeiros automaticamente com seu contador.',
      action: 'Ir para Marketplace',
      link: '/marketplace',
      details: [
        'Aceite convite do seu contador',
        'Ou busque e solicite conexão',
        'Contador vê seus dados em tempo real',
        'Receba documentos e notificações'
      ],
      optional: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900/20 py-6 sm:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 animate-fadeIn">
          <div className="inline-flex items-center justify-center mb-4 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl shadow-xl">
            <Logo className="w-14 h-14 sm:w-16 sm:h-16 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl ipad-air:text-5xl md:text-5xl font-bold text-slate-800 dark:text-white mb-3 sm:mb-4 ipad-air:mb-5 px-4">
            Como Começar no Lumini I.A
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
            Siga este guia passo a passo para aproveitar ao máximo todas as funcionalidades do sistema
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 sm:space-y-6">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden animate-slideIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                  {/* Number & Icon */}
                  <div className="flex md:flex-col items-center md:items-start gap-3 sm:gap-4 md:gap-2">
                    <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg">
                      {step.number}
                    </div>
                    <div className="text-4xl sm:text-5xl">{step.icon}</div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2 sm:mb-3 ipad-air:mb-4">
                      <h3 className="text-xl sm:text-2xl ipad-air:text-3xl font-bold text-slate-800 dark:text-white">
                        {step.title}
                        {step.optional && (
                          <span className="ml-2 text-xs sm:text-sm font-normal text-slate-500 dark:text-gray-400">
                            (opcional)
                          </span>
                        )}
                      </h3>
                    </div>

                    <p className="text-sm sm:text-base text-slate-600 dark:text-gray-300 mb-3 sm:mb-4">
                      {step.description}
                    </p>

                    {/* Details List */}
                    <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                          <span className="text-purple-500 mt-0.5 sm:mt-1 flex-shrink-0">✓</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Button */}
                    <Link
                      to={step.link}
                      className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
                    >
                      {step.action}
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-8 sm:mt-12 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">💡</div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-2 sm:mb-3 px-4">
            Precisa de Ajuda?
          </h3>
          <p className="text-sm sm:text-base text-slate-600 dark:text-gray-300 mb-4 sm:mb-6 max-w-2xl mx-auto px-4">
            Nosso suporte está disponível para ajudar você em qualquer etapa
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link
              to="/help"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 shadow-md font-medium text-sm sm:text-base w-full sm:w-auto"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Central de Ajuda
            </Link>
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 shadow-md font-medium text-sm sm:text-base w-full sm:w-auto"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="hidden xs:inline">WhatsApp Suporte</span>
              <span className="xs:hidden">Suporte</span>
            </a>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-6 sm:mt-8 text-center pb-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm sm:text-base text-slate-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Guide;
