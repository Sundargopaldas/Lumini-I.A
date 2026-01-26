import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Privacy = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <button 
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 text-slate-600 dark:text-gray-400 hover:text-purple-600 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Voltar
            </button>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12 border border-slate-100 dark:border-slate-700">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-8">
                    Política de Privacidade
                </h1>

                <div className="space-y-8 text-slate-700 dark:text-gray-300">
                    
                    {/* Introdução */}
                    <section>
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800">
                            <p className="text-sm leading-relaxed">
                                <strong className="text-purple-700 dark:text-purple-300">Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
                            </p>
                            <p className="mt-3 text-sm">
                                A <strong>Lumini I.A</strong> respeita sua privacidade e está comprometida em proteger seus dados pessoais. 
                                Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e compartilhamos suas informações 
                                em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>.
                            </p>
                        </div>
                    </section>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-6"></div>

                    {/* 1. Dados Coletados */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600">📋</span>
                            1. Dados que Coletamos
                        </h2>
                        <div className="pl-12 space-y-4">
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-2">1.1 Dados Fornecidos por Você</h3>
                                <ul className="list-disc pl-5 space-y-2 text-sm">
                                    <li><strong>Cadastro:</strong> Nome de usuário, email, senha (criptografada)</li>
                                    <li><strong>Perfil:</strong> Nome completo, CPF/CNPJ, telefone (opcional)</li>
                                    <li><strong>Transações:</strong> Valores, categorias, descrições, datas</li>
                                    <li><strong>Documentos:</strong> Arquivos enviados por você ou seu contador</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-2">1.2 Dados Coletados Automaticamente</h3>
                                <ul className="list-disc pl-5 space-y-2 text-sm">
                                    <li><strong>Informações Técnicas:</strong> Endereço IP, tipo de navegador, sistema operacional</li>
                                    <li><strong>Cookies:</strong> Tokens de autenticação, preferências de idioma e tema</li>
                                    <li><strong>Logs de Uso:</strong> Data/hora de acesso, páginas visitadas, ações realizadas</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-2">1.3 Dados de Terceiros (Com Seu Consentimento)</h3>
                                <ul className="list-disc pl-5 space-y-2 text-sm">
                                    <li><strong>Open Banking:</strong> Transações bancárias sincronizadas (opcional)</li>
                                    <li><strong>Stripe:</strong> Informações de pagamento para assinaturas</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-6"></div>

                    {/* 2. Como Usamos os Dados */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600">🎯</span>
                            2. Como Usamos Seus Dados
                        </h2>
                        <div className="pl-12 space-y-3">
                            <p className="text-sm">Utilizamos suas informações para:</p>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                <li>Fornecer e melhorar nossos serviços de gestão financeira</li>
                                <li>Autenticar seu acesso e garantir a segurança da conta</li>
                                <li>Gerar relatórios, gráficos e insights financeiros personalizados</li>
                                <li>Processar pagamentos de assinaturas (via Stripe)</li>
                                <li>Enviar notificações importantes sobre sua conta</li>
                                <li>Conectar você com contadores cadastrados (com seu consentimento explícito)</li>
                                <li>Cumprir obrigações legais e regulatórias</li>
                            </ul>

                            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <p className="text-sm">
                                    <strong className="text-green-700 dark:text-green-300">✅ Base Legal (LGPD):</strong> Consentimento, 
                                    execução de contrato, cumprimento de obrigação legal e legítimo interesse.
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-6"></div>

                    {/* 3. Compartilhamento */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600">🔗</span>
                            3. Compartilhamento de Dados
                        </h2>
                        <div className="pl-12 space-y-3">
                            <p className="text-sm font-semibold">
                                A Lumini I.A <strong>NÃO vende</strong> seus dados pessoais. Compartilhamos apenas quando:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                <li><strong>Com Seu Contador:</strong> Dados financeiros compartilhados mediante seu consentimento explícito e aceite do termo</li>
                                <li><strong>Processadores de Pagamento:</strong> Stripe (para assinaturas Premium/Pro)</li>
                                <li><strong>Provedores de Infraestrutura:</strong> Fly.io (hospedagem), AWS/Google Cloud (armazenamento)</li>
                                <li><strong>Autoridades Legais:</strong> Quando exigido por lei ou ordem judicial</li>
                            </ul>

                            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                <p className="text-sm">
                                    <strong>⚠️ Importante:</strong> Todos os terceiros são contratualmente obrigados a proteger seus dados 
                                    e usá-los apenas para os fins especificados.
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-6"></div>

                    {/* 4. Segurança */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg text-red-600">🔒</span>
                            4. Segurança dos Dados
                        </h2>
                        <div className="pl-12 space-y-3">
                            <p className="text-sm">Implementamos medidas técnicas e organizacionais para proteger suas informações:</p>
                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-sm">🔐 Criptografia</h3>
                                    <p className="text-xs">
                                        • HTTPS/SSL em toda comunicação<br/>
                                        • Senhas com hash bcrypt<br/>
                                        • Dados sensíveis criptografados
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-sm">🛡️ Controles de Acesso</h3>
                                    <p className="text-xs">
                                        • Autenticação via JWT<br/>
                                        • Rate limiting contra ataques<br/>
                                        • Logs de auditoria
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-6"></div>

                    {/* 5. Seus Direitos (LGPD) */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600">⚖️</span>
                            5. Seus Direitos (LGPD)
                        </h2>
                        <div className="pl-12 space-y-3">
                            <p className="text-sm">Você tem direito a:</p>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                <li><strong>Confirmação:</strong> Saber se processamos seus dados</li>
                                <li><strong>Acesso:</strong> Obter cópia dos seus dados</li>
                                <li><strong>Correção:</strong> Atualizar dados incompletos/incorretos</li>
                                <li><strong>Anonimização/Bloqueio:</strong> Limitar o uso de dados desnecessários</li>
                                <li><strong>Exclusão:</strong> Deletar dados quando permitido por lei</li>
                                <li><strong>Portabilidade:</strong> Exportar seus dados em formato legível</li>
                                <li><strong>Revogação de Consentimento:</strong> Retirar consentimento a qualquer momento</li>
                                <li><strong>Oposição:</strong> Se opor ao tratamento de dados</li>
                            </ul>

                            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <p className="text-sm">
                                    <strong>📧 Para exercer seus direitos:</strong> Entre em contato via{' '}
                                    <a href="mailto:privacidade@luminiiadigital.com.br" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">
                                        privacidade@luminiiadigital.com.br
                                    </a>
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-6"></div>

                    {/* 6. Retenção */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600">⏳</span>
                            6. Retenção de Dados
                        </h2>
                        <div className="pl-12 space-y-3">
                            <p className="text-sm">Mantemos seus dados apenas pelo tempo necessário:</p>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                <li><strong>Conta Ativa:</strong> Enquanto você usar nossos serviços</li>
                                <li><strong>Após Cancelamento:</strong> Até 5 anos (obrigação legal - Código Civil e Tributário)</li>
                                <li><strong>Logs de Segurança:</strong> 6 meses</li>
                                <li><strong>Dados Anonimizados:</strong> Indefinidamente para estatísticas</li>
                            </ul>
                        </div>
                    </section>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-6"></div>

                    {/* 7. Cookies */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg text-yellow-600">🍪</span>
                            7. Cookies e Tecnologias Similares
                        </h2>
                        <div className="pl-12 space-y-3">
                            <p className="text-sm">Utilizamos cookies para:</p>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                <li><strong>Essenciais:</strong> Autenticação e funcionamento básico (não podem ser desabilitados)</li>
                                <li><strong>Preferências:</strong> Tema escuro/claro, idioma</li>
                                <li><strong>Analíticos:</strong> Google Analytics (anônimo) - pode ser desabilitado</li>
                            </ul>
                            <p className="text-sm mt-3">
                                Você pode gerenciar cookies nas configurações do seu navegador.
                            </p>
                        </div>
                    </section>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-6"></div>

                    {/* 8. Alterações */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg text-teal-600">🔄</span>
                            8. Alterações nesta Política
                        </h2>
                        <div className="pl-12 space-y-3">
                            <p className="text-sm">
                                Podemos atualizar esta Política periodicamente. Notificaremos sobre mudanças significativas via 
                                email ou aviso no dashboard. Recomendamos revisar esta página regularmente.
                            </p>
                        </div>
                    </section>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-6"></div>

                    {/* 9. Contato DPO */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-lg text-pink-600">📧</span>
                            9. Encarregado de Dados (DPO)
                        </h2>
                        <div className="pl-12 space-y-3">
                            <p className="text-sm">
                                Para dúvidas sobre privacidade ou exercício de direitos LGPD:
                            </p>
                            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="text-sm">
                                    <strong>Email:</strong>{' '}
                                    <a href="mailto:privacidade@luminiiadigital.com.br" className="text-purple-600 dark:text-purple-400 hover:underline">
                                        privacidade@luminiiadigital.com.br
                                    </a>
                                </p>
                                <p className="text-sm mt-2">
                                    <strong>Endereço:</strong> [Seu endereço comercial]
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Footer CTA */}
                    <div className="mt-12 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-100 dark:border-purple-800 text-center">
                        <p className="text-slate-600 dark:text-gray-300 mb-4 font-semibold">
                            Dúvidas sobre privacidade?
                        </p>
                        <a 
                            href="mailto:privacidade@luminiiadigital.com.br" 
                            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                            Falar com DPO
                        </a>
                    </div>

                </div>
            </div>
            
            <footer className="mt-8 text-center text-sm text-slate-500 dark:text-gray-500">
                &copy; {new Date().getFullYear()} Lumini I.A. Todos os direitos reservados. | Em conformidade com a LGPD (Lei nº 13.709/2018)
            </footer>
        </div>
    );
};

export default Privacy;
