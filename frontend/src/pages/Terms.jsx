import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <button 
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 text-slate-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Voltar
            </button>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12 border border-slate-100 dark:border-slate-700">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-8">
                    Termos de Uso e Políticas
                </h1>

                <div className="space-y-8 text-slate-700 dark:text-gray-300">
                    
                    {/* Seção 1: Cancelamento */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600">🚫</span>
                            Política de Cancelamento
                        </h2>
                        <div className="pl-12 space-y-3">
                            <p>
                                A Lumini I.A. valoriza a liberdade de seus usuários. Você pode cancelar sua assinatura a qualquer momento através do painel de controle (Dashboard), acessando a seção <strong>Configurações &gt; Assinatura</strong>.
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <strong>Cancelamento Imediato:</strong> Ao solicitar o cancelamento, a renovação automática será desativada imediatamente.
                                </li>
                                <li>
                                    <strong>Acesso Remanescente:</strong> Você continuará tendo acesso a todas as funcionalidades do seu plano Premium ou Pro até o final do período de faturamento atual (mensal ou anual) já pago.
                                </li>
                                <li>
                                    <strong>Sem Multas:</strong> Não cobramos multas por cancelamento.
                                </li>
                            </ul>
                        </div>
                    </section>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-6"></div>

                    {/* Seção 2: Reembolso e Devolução */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600">💸</span>
                            Política de Reembolso e Devolução
                        </h2>
                        <div className="pl-12 space-y-3">
                            <p>
                                Em conformidade com o <strong>Código de Defesa do Consumidor (Art. 49)</strong> e nosso compromisso com sua satisfação:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <strong>Garantia de 7 Dias:</strong> Para novas assinaturas, oferecemos reembolso integral se solicitado em até 7 dias corridos após a contratação inicial.
                                </li>
                                <li>
                                    <strong>Como Solicitar:</strong> Basta enviar um e-mail para <a href="mailto:suporte@lumini.ai" className="text-purple-600 hover:underline">suporte@lumini.ai</a> com o assunto "Solicitação de Reembolso" informando seu e-mail de cadastro.
                                </li>
                                <li>
                                    <strong>Processamento:</strong> O estorno será processado em até 5 dias úteis e o valor retornará ao método de pagamento original (cartão de crédito ou conta bancária, dependendo da operadora).
                                </li>
                                <li>
                                    <strong>Após 7 Dias:</strong> Cancelamentos feitos após o período de garantia não são elegíveis para reembolso proporcional (pro-rata), mas o acesso permanece ativo até o fim do ciclo.
                                </li>
                            </ul>
                        </div>
                    </section>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-6"></div>

                    {/* Seção 3: Pagamentos e Segurança */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600">🔒</span>
                            Pagamentos e Segurança
                        </h2>
                        <div className="pl-12 space-y-3">
                            <p>
                                A segurança dos seus dados é nossa prioridade máxima. Utilizamos processadores de pagamento líderes globais para garantir transações seguras.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-2">Processadores Certificados</h3>
                                    <p className="text-sm">
                                        Todas as transações são processadas pelo <strong>Stripe</strong>, que possui certificação PCI-DSS de nível máximo. A Lumini I.A. <strong>não armazena</strong> os dados completos do seu cartão de crédito.
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-2">Criptografia de Ponta a Ponta</h3>
                                    <p className="text-sm">
                                        Toda a comunicação entre seu navegador e nossos servidores é criptografada via SSL/TLS (HTTPS). Seus dados pessoais são tratados conforme a LGPD (Lei Geral de Proteção de Dados).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="mt-12 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 text-center">
                        <p className="text-slate-600 dark:text-gray-300 mb-4">
                            Ainda tem dúvidas sobre nossas políticas?
                        </p>
                        <a 
                            href="mailto:suporte@lumini.ai" 
                            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                            Falar com Suporte
                        </a>
                    </div>

                </div>
            </div>
            
            <footer className="mt-8 text-center text-sm text-slate-500 dark:text-gray-500">
                &copy; {new Date().getFullYear()} Lumini I.A. Todos os direitos reservados.
            </footer>
        </div>
    );
};

export default Terms;
